import type { GameState, Question, RoundStats, VoteOffResult } from '../types';

/** Value of the chain at each rung. Banking transfers *this* value into the
 * round pot and resets the chain — it is not a running sum of every rung
 * climbed, same as the real show. A wrong answer breaks the chain for free. */
export const CHAIN_LADDER = [20, 30, 50, 75, 100, 150, 200, 300, 450, 1000];

/** Judged questions per money round (banking a turn doesn't count toward this —
 * it still uses up a turn, just not a question). */
export const ROUND_QUESTION_TARGET = 9;

/** Questions each finalist answers before a winner is checked for. Tied after
 * this many each keeps the final going in extra pairs (sudden death) until
 * someone's ahead once both have answered the same number of questions. */
export const FINAL_QUESTION_TARGET = 5;

export type WeakestLinkAction =
  | { type: 'PLAYER_JOINED'; userId: string; nickname: string }
  | { type: 'START_GAME' }
  | { type: 'BANK'; userId: string }
  | { type: 'JUDGE_ANSWER'; correct: boolean }
  | { type: 'CAST_VOTE'; voterId: string; targetId: string }
  | { type: 'REVEAL_VOTES' }
  | { type: 'ADVANCE_AFTER_VOTE' }
  | { type: 'FINAL_JUDGE'; correct: boolean }
  | { type: 'RESET_GAME' };

export function initialState(questions: Question[]): GameState {
  return {
    phase: 'lobby',
    questions,
    questionIndex: 0,
    players: {},
    playerOrder: [],
    turnOrder: [],
    turnIndex: 0,
    roundNumber: 1,
    questionsAskedThisRound: 0,
    roundStats: {},
    currentChain: 0,
    chainStep: -1,
    roundPot: 0,
    bank: 0,
    votes: {},
    lastVoteOff: null,
    finalists: null,
    finalScores: null,
    finalQuestionsAsked: null,
    finalTurn: 0,
    winnerId: null,
  };
}

/** The question up for the current turn (money round) or the current
 * finalist (final round) — read-only lookup, host-only display. Cycles the
 * pool with modulo rather than tracking "used" questions, same trade-off
 * Family Feud/Music Timeline accept for their own content pools. */
export function currentQuestion(state: GameState): Question {
  return state.questions[state.questionIndex % state.questions.length];
}

export function currentTurnUserId(state: GameState): string | undefined {
  return state.turnOrder[state.turnIndex];
}

function freshRoundStats(userIds: string[]): Record<string, RoundStats> {
  return Object.fromEntries(userIds.map((id) => [id, { correct: 0, wrong: 0 }]));
}

function nextTurnIndex(state: GameState): number {
  if (state.turnOrder.length === 0) return 0;
  return (state.turnIndex + 1) % state.turnOrder.length;
}

function bumpPlayerTotals(state: GameState, userId: string, correct: boolean): GameState['players'] {
  const player = state.players[userId];
  return {
    ...state.players,
    [userId]: {
      ...player,
      totalCorrect: player.totalCorrect + (correct ? 1 : 0),
      totalWrong: player.totalWrong + (correct ? 0 : 1),
    },
  };
}

function bumpRoundStats(
  roundStats: GameState['roundStats'],
  userId: string,
  correct: boolean,
): GameState['roundStats'] {
  const stats = roundStats[userId] ?? { correct: 0, wrong: 0 };
  return {
    ...roundStats,
    [userId]: {
      correct: stats.correct + (correct ? 1 : 0),
      wrong: stats.wrong + (correct ? 0 : 1),
    },
  };
}

/** Among tied-for-most-votes candidates, the round's weakest performer goes
 * home — mirrors the real show's "strongest link breaks the tie" rule as a
 * deterministic outcome rather than a second human decision. Ties within the
 * tie fall back to join order, just to be fully deterministic (and testable). */
function weakestOfTied(
  candidates: string[],
  roundStats: GameState['roundStats'],
  playerOrder: string[],
): string {
  const score = (id: string) => {
    const stats = roundStats[id] ?? { correct: 0, wrong: 0 };
    return stats.correct - stats.wrong;
  };
  return [...candidates].sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return playerOrder.indexOf(a) - playerOrder.indexOf(b);
  })[0];
}

function tallyVotes(votes: Record<string, string>): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  return tally;
}

/** Starts a fresh money round for whoever's left — new turn order, cleared
 * round stats, turn back to the top. Shared by START_GAME (first round) and
 * ADVANCE_AFTER_VOTE (every round after an elimination). */
function beginMoneyRound(state: GameState, turnOrder: string[], roundNumber: number): GameState {
  return {
    ...state,
    phase: 'money',
    turnOrder,
    turnIndex: 0,
    roundNumber,
    questionsAskedThisRound: 0,
    roundStats: freshRoundStats(turnOrder),
  };
}

function beginFinal(state: GameState, finalists: [string, string]): GameState {
  return {
    ...state,
    phase: 'final',
    turnOrder: finalists,
    finalists,
    finalScores: { [finalists[0]]: 0, [finalists[1]]: 0 },
    finalQuestionsAsked: { [finalists[0]]: 0, [finalists[1]]: 0 },
    finalTurn: 0,
  };
}

export function gameReducer(state: GameState, action: WeakestLinkAction): GameState {
  switch (action.type) {
    case 'PLAYER_JOINED': {
      if (state.phase !== 'lobby' || state.players[action.userId]) return state;
      return {
        ...state,
        players: {
          ...state.players,
          [action.userId]: {
            userId: action.userId,
            nickname: action.nickname,
            eliminated: false,
            totalCorrect: 0,
            totalWrong: 0,
          },
        },
        playerOrder: [...state.playerOrder, action.userId],
      };
    }

    case 'START_GAME': {
      if (state.phase !== 'lobby' || state.playerOrder.length < 2) return state;
      // Exactly two players can't meaningfully vote each other off — go
      // straight to the head-to-head final.
      if (state.playerOrder.length === 2) {
        return beginFinal(state, [state.playerOrder[0], state.playerOrder[1]]);
      }
      return beginMoneyRound(state, [...state.playerOrder], 1);
    }

    case 'BANK': {
      if (state.phase !== 'money') return state;
      if (action.userId !== currentTurnUserId(state)) return state;
      if (state.currentChain === 0) return state;
      return {
        ...state,
        roundPot: state.roundPot + state.currentChain,
        currentChain: 0,
        chainStep: -1,
        questionIndex: state.questionIndex + 1,
        turnIndex: nextTurnIndex(state),
      };
    }

    case 'JUDGE_ANSWER': {
      if (state.phase !== 'money') return state;
      const current = currentTurnUserId(state);
      if (!current) return state;

      const chainStep = action.correct
        ? Math.min(state.chainStep + 1, CHAIN_LADDER.length - 1)
        : -1;
      const currentChain = chainStep === -1 ? 0 : CHAIN_LADDER[chainStep];
      const questionsAskedThisRound = state.questionsAskedThisRound + 1;

      const next: GameState = {
        ...state,
        players: bumpPlayerTotals(state, current, action.correct),
        roundStats: bumpRoundStats(state.roundStats, current, action.correct),
        chainStep,
        currentChain,
        questionsAskedThisRound,
        questionIndex: state.questionIndex + 1,
        turnIndex: nextTurnIndex(state),
      };

      if (questionsAskedThisRound < ROUND_QUESTION_TARGET) return next;

      // Round over: only banked money survives — whatever's still riding on
      // the chain is lost, same tension as the real show.
      return {
        ...next,
        phase: 'voting',
        bank: next.bank + next.roundPot,
        roundPot: 0,
        currentChain: 0,
        chainStep: -1,
        votes: {},
      };
    }

    case 'CAST_VOTE': {
      if (state.phase !== 'voting') return state;
      const { voterId, targetId } = action;
      if (voterId === targetId) return state;
      if (!state.turnOrder.includes(voterId) || !state.turnOrder.includes(targetId)) return state;
      return { ...state, votes: { ...state.votes, [voterId]: targetId } };
    }

    case 'REVEAL_VOTES': {
      if (state.phase !== 'voting') return state;
      if (Object.keys(state.votes).length < state.turnOrder.length) return state;

      const tally = tallyVotes(state.votes);
      const maxVotes = Math.max(...state.turnOrder.map((id) => tally[id] ?? 0));
      const candidates = state.turnOrder.filter((id) => (tally[id] ?? 0) === maxVotes);
      const tieBroken = candidates.length > 1;
      const eliminatedId = tieBroken
        ? weakestOfTied(candidates, state.roundStats, state.playerOrder)
        : candidates[0];

      const voteOff: VoteOffResult = {
        eliminatedId,
        nickname: state.players[eliminatedId].nickname,
        tally,
        tieBroken,
      };
      return { ...state, phase: 'vote-reveal', lastVoteOff: voteOff };
    }

    case 'ADVANCE_AFTER_VOTE': {
      if (state.phase !== 'vote-reveal' || !state.lastVoteOff) return state;
      const { eliminatedId } = state.lastVoteOff;
      const players = {
        ...state.players,
        [eliminatedId]: { ...state.players[eliminatedId], eliminated: true },
      };
      const remaining = state.turnOrder.filter((id) => id !== eliminatedId);
      const cleared: GameState = { ...state, players, votes: {}, lastVoteOff: null };

      if (remaining.length === 2) {
        return beginFinal(cleared, [remaining[0], remaining[1]]);
      }
      if (remaining.length <= 1) {
        // Shouldn't normally happen (money rounds only start with 3+), but
        // stay well-defined rather than crash if it ever does.
        return { ...cleared, phase: 'game-over', turnOrder: remaining, winnerId: remaining[0] ?? null };
      }
      return beginMoneyRound(cleared, remaining, state.roundNumber + 1);
    }

    case 'FINAL_JUDGE': {
      if (state.phase !== 'final' || !state.finalists || !state.finalScores || !state.finalQuestionsAsked) {
        return state;
      }
      const current = state.finalists[state.finalTurn];
      const finalScores = {
        ...state.finalScores,
        [current]: state.finalScores[current] + (action.correct ? 1 : 0),
      };
      const finalQuestionsAsked = {
        ...state.finalQuestionsAsked,
        [current]: state.finalQuestionsAsked[current] + 1,
      };

      const [a, b] = state.finalists;
      const bothAnswered = finalQuestionsAsked[a] === finalQuestionsAsked[b];
      const metTarget =
        finalQuestionsAsked[a] >= FINAL_QUESTION_TARGET && finalQuestionsAsked[b] >= FINAL_QUESTION_TARGET;
      const decided = bothAnswered && metTarget && finalScores[a] !== finalScores[b];

      const next: GameState = {
        ...state,
        players: bumpPlayerTotals(state, current, action.correct),
        finalScores,
        finalQuestionsAsked,
        questionIndex: state.questionIndex + 1,
        finalTurn: state.finalTurn === 0 ? 1 : 0,
      };

      if (!decided) return next;
      return { ...next, phase: 'game-over', winnerId: finalScores[a] > finalScores[b] ? a : b };
    }

    case 'RESET_GAME':
      return initialState(state.questions);

    default:
      return state;
  }
}
