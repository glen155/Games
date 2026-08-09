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

/** Whole-round clock for a money round — the round ends the instant this
 * expires, even mid-question. No round-level clock in the final; it's
 * already bounded by FINAL_QUESTION_TARGET (+ sudden death). */
export const ROUND_TIME_MS = 120_000;

/** Per-turn clock, money round and final alike. Running out counts as a
 * wrong answer with nothing selected — same tension as answering wrong. */
export const QUESTION_TIME_MS = 15_000;

/** Proper Fisher-Yates shuffle — unlike `.sort(() => Math.random() - 0.5)`
 * (a common but statistically biased shortcut), every permutation is
 * equally likely. Used both for the initial question order (game.ts) and to
 * reshuffle on RESET_GAME, so replaying doesn't repeat the same order. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type WeakestLinkAction =
  | { type: 'PLAYER_JOINED'; userId: string; nickname: string }
  | { type: 'START_GAME'; at: number }
  | { type: 'BANK'; userId: string; at: number }
  | { type: 'SUBMIT_ANSWER'; userId: string; index: number; at: number }
  | { type: 'QUESTION_TIME_EXPIRED'; at: number }
  | { type: 'ROUND_TIME_EXPIRED' }
  | { type: 'CAST_VOTE'; voterId: string; targetId: string }
  | { type: 'REVEAL_VOTE'; voterId: string }
  | { type: 'FORCE_REVEAL_REMAINING_VOTES' }
  | { type: 'ADVANCE_AFTER_VOTE'; at: number }
  | { type: 'SUBMIT_FINAL_ANSWER'; userId: string; index: number; at: number }
  | { type: 'FINAL_QUESTION_TIME_EXPIRED'; at: number }
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
    roundEndsAt: null,
    questionEndsAt: null,
    votes: {},
    revealedVoterIds: [],
    lastVoteOff: null,
    finalists: null,
    finalScores: null,
    finalQuestionsAsked: null,
    finalTurn: 0,
    winnerId: null,
  };
}

/** The question up for the current turn (money round) or the current
 * finalist (final round). Cycles the pool with modulo rather than tracking
 * "used" questions, same trade-off Family Feud/Music Timeline accept for
 * their own content pools. */
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

function scoreOf(roundStats: GameState['roundStats'], id: string): number {
  const stats = roundStats[id] ?? { correct: 0, wrong: 0 };
  return stats.correct - stats.wrong;
}

/** Whoever's furthest to one extreme of this round's correct-minus-wrong
 * score. Ties fall back to join order, so the result is always deterministic
 * (and testable). Shared by the vote tie-break and the public "strongest
 * link" stat — same underlying question, just min vs max. */
function extremeId(
  ids: string[],
  roundStats: GameState['roundStats'],
  playerOrder: string[],
  direction: 'min' | 'max',
): string | null {
  if (ids.length === 0) return null;
  const scores = ids.map((id) => scoreOf(roundStats, id));
  const target = direction === 'min' ? Math.min(...scores) : Math.max(...scores);
  const candidates = ids.filter((id) => scoreOf(roundStats, id) === target);
  return [...candidates].sort((a, b) => playerOrder.indexOf(a) - playerOrder.indexOf(b))[0];
}

/** This round's best and worst performer by correct-minus-wrong, for the
 * "statistically best player" callout shown before voting. Purely derived
 * from state already mirrored to every device — no new sync needed. */
export function roundStandings(state: GameState): { strongestId: string | null; weakestId: string | null } {
  return {
    strongestId: extremeId(state.turnOrder, state.roundStats, state.playerOrder, 'max'),
    weakestId: extremeId(state.turnOrder, state.roundStats, state.playerOrder, 'min'),
  };
}

function tallyVotes(votes: Record<string, string>): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  return tally;
}

/** Tallies votes and picks who's eliminated (tie-break via this round's
 * weakest performer) — the actual vote-off resolution, independent of *how*
 * every vote became known (one flip at a time, or all at once via the
 * host's force-reveal). Shared by REVEAL_VOTE and FORCE_REVEAL_REMAINING_VOTES. */
function resolveVoteOff(state: GameState): VoteOffResult {
  const tally = tallyVotes(state.votes);
  const maxVotes = Math.max(...state.turnOrder.map((id) => tally[id] ?? 0));
  const candidates = state.turnOrder.filter((id) => (tally[id] ?? 0) === maxVotes);
  const tieBroken = candidates.length > 1;
  const eliminatedId = tieBroken
    ? (extremeId(candidates, state.roundStats, state.playerOrder, 'min') as string)
    : candidates[0];

  return {
    eliminatedId,
    nickname: state.players[eliminatedId].nickname,
    tally,
    tieBroken,
  };
}

/** Round over: only banked money survives — whatever's still riding on the
 * chain (or ticking on the clock) is lost, same tension as the real show.
 * Shared by hitting the question target and the round clock expiring. */
function endMoneyRound(state: GameState): GameState {
  return {
    ...state,
    phase: 'voting',
    bank: state.bank + state.roundPot,
    roundPot: 0,
    currentChain: 0,
    chainStep: -1,
    votes: {},
    revealedVoterIds: [],
    lastVoteOff: null,
    roundEndsAt: null,
    questionEndsAt: null,
  };
}

/** Applies one money-round turn's outcome (a real answer or a timed-out
 * no-answer, both just "correct: boolean" from here) — chain climb/reset,
 * stats, turn rotation, and the round-end check. Shared by SUBMIT_ANSWER and
 * QUESTION_TIME_EXPIRED so they can never drift apart. */
function resolveMoneyAnswer(state: GameState, correct: boolean, at: number): GameState {
  const current = currentTurnUserId(state);
  if (!current) return state;

  const chainStep = correct ? Math.min(state.chainStep + 1, CHAIN_LADDER.length - 1) : -1;
  const currentChain = chainStep === -1 ? 0 : CHAIN_LADDER[chainStep];
  const questionsAskedThisRound = state.questionsAskedThisRound + 1;

  const next: GameState = {
    ...state,
    players: bumpPlayerTotals(state, current, correct),
    roundStats: bumpRoundStats(state.roundStats, current, correct),
    chainStep,
    currentChain,
    questionsAskedThisRound,
    questionIndex: state.questionIndex + 1,
    turnIndex: nextTurnIndex(state),
  };

  if (questionsAskedThisRound >= ROUND_QUESTION_TARGET) return endMoneyRound(next);
  return { ...next, questionEndsAt: at + QUESTION_TIME_MS };
}

/** Applies one final-round turn's outcome, checking for a decided winner
 * (or continuing into sudden death). Shared by SUBMIT_FINAL_ANSWER and
 * FINAL_QUESTION_TIME_EXPIRED. */
function resolveFinalAnswer(state: GameState, correct: boolean, at: number): GameState {
  if (state.phase !== 'final' || !state.finalists || !state.finalScores || !state.finalQuestionsAsked) {
    return state;
  }
  const current = state.finalists[state.finalTurn];
  const finalScores = {
    ...state.finalScores,
    [current]: state.finalScores[current] + (correct ? 1 : 0),
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
    players: bumpPlayerTotals(state, current, correct),
    finalScores,
    finalQuestionsAsked,
    questionIndex: state.questionIndex + 1,
    finalTurn: state.finalTurn === 0 ? 1 : 0,
    questionEndsAt: decided ? null : at + QUESTION_TIME_MS,
  };

  if (!decided) return next;
  return { ...next, phase: 'game-over', winnerId: finalScores[a] > finalScores[b] ? a : b };
}

/** Starts a fresh money round for whoever's left — new turn order, cleared
 * round stats, turn back to the top, both clocks (re)started. Shared by
 * START_GAME (first round) and ADVANCE_AFTER_VOTE (every round after an
 * elimination). */
function beginMoneyRound(state: GameState, turnOrder: string[], roundNumber: number, at: number): GameState {
  return {
    ...state,
    phase: 'money',
    turnOrder,
    turnIndex: 0,
    roundNumber,
    questionsAskedThisRound: 0,
    roundStats: freshRoundStats(turnOrder),
    roundEndsAt: at + ROUND_TIME_MS,
    questionEndsAt: at + QUESTION_TIME_MS,
  };
}

function beginFinal(state: GameState, finalists: [string, string], at: number): GameState {
  return {
    ...state,
    phase: 'final',
    turnOrder: finalists,
    finalists,
    finalScores: { [finalists[0]]: 0, [finalists[1]]: 0 },
    finalQuestionsAsked: { [finalists[0]]: 0, [finalists[1]]: 0 },
    finalTurn: 0,
    roundEndsAt: null,
    questionEndsAt: at + QUESTION_TIME_MS,
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
        return beginFinal(state, [state.playerOrder[0], state.playerOrder[1]], action.at);
      }
      return beginMoneyRound(state, [...state.playerOrder], 1, action.at);
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
        questionEndsAt: action.at + QUESTION_TIME_MS,
      };
    }

    case 'SUBMIT_ANSWER': {
      if (state.phase !== 'money') return state;
      if (action.userId !== currentTurnUserId(state)) return state;
      const correct = action.index === currentQuestion(state).correctIndex;
      return resolveMoneyAnswer(state, correct, action.at);
    }

    case 'QUESTION_TIME_EXPIRED': {
      if (state.phase !== 'money' || !currentTurnUserId(state)) return state;
      return resolveMoneyAnswer(state, false, action.at);
    }

    case 'ROUND_TIME_EXPIRED': {
      if (state.phase !== 'money') return state;
      return endMoneyRound(state);
    }

    case 'CAST_VOTE': {
      if (state.phase !== 'voting') return state;
      const { voterId, targetId } = action;
      if (voterId === targetId) return state;
      if (!state.turnOrder.includes(voterId) || !state.turnOrder.includes(targetId)) return state;
      const votes = { ...state.votes, [voterId]: targetId };
      // The last vote closes voting and opens the floor — free-for-all,
      // anyone can flip their own card whenever they're ready, no host gate.
      if (Object.keys(votes).length >= state.turnOrder.length) {
        return { ...state, votes, phase: 'vote-reveal', revealedVoterIds: [] };
      }
      return { ...state, votes };
    }

    case 'REVEAL_VOTE': {
      if (state.phase !== 'vote-reveal') return state;
      const { voterId } = action;
      if (!state.turnOrder.includes(voterId) || state.revealedVoterIds.includes(voterId)) return state;
      const revealedVoterIds = [...state.revealedVoterIds, voterId];
      if (revealedVoterIds.length < state.turnOrder.length) {
        return { ...state, revealedVoterIds };
      }
      // Last card just flipped — resolve the outcome now, from the full tally.
      return { ...state, revealedVoterIds, lastVoteOff: resolveVoteOff(state) };
    }

    case 'FORCE_REVEAL_REMAINING_VOTES': {
      // Host escape hatch — someone's walked away or their phone died mid-reveal.
      if (state.phase !== 'vote-reveal' || state.lastVoteOff) return state;
      return { ...state, revealedVoterIds: [...state.turnOrder], lastVoteOff: resolveVoteOff(state) };
    }

    case 'ADVANCE_AFTER_VOTE': {
      if (state.phase !== 'vote-reveal' || !state.lastVoteOff) return state;
      const { eliminatedId } = state.lastVoteOff;
      const players = {
        ...state.players,
        [eliminatedId]: { ...state.players[eliminatedId], eliminated: true },
      };
      const remaining = state.turnOrder.filter((id) => id !== eliminatedId);
      const cleared: GameState = {
        ...state,
        players,
        votes: {},
        revealedVoterIds: [],
        lastVoteOff: null,
      };

      if (remaining.length === 2) {
        return beginFinal(cleared, [remaining[0], remaining[1]], action.at);
      }
      if (remaining.length <= 1) {
        // Shouldn't normally happen (money rounds only start with 3+), but
        // stay well-defined rather than crash if it ever does.
        return { ...cleared, phase: 'game-over', turnOrder: remaining, winnerId: remaining[0] ?? null };
      }
      return beginMoneyRound(cleared, remaining, state.roundNumber + 1, action.at);
    }

    case 'SUBMIT_FINAL_ANSWER': {
      if (state.phase !== 'final' || !state.finalists) return state;
      if (action.userId !== state.finalists[state.finalTurn]) return state;
      const correct = action.index === currentQuestion(state).correctIndex;
      return resolveFinalAnswer(state, correct, action.at);
    }

    case 'FINAL_QUESTION_TIME_EXPIRED': {
      if (state.phase !== 'final' || !state.finalists) return state;
      return resolveFinalAnswer(state, false, action.at);
    }

    case 'RESET_GAME':
      // Reshuffle rather than reuse the same order — otherwise playing
      // again in one sitting would replay the exact same question sequence.
      return initialState(shuffle(state.questions));

    default:
      return state;
  }
}
