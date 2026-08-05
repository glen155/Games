import type { GameState, QuestionTier, TimerConfig } from '../types';

export const STARTING_POOL = 100;
export const DEFAULT_TIMER_CONFIG: TimerConfig = { mode: 'auto', durationSeconds: 30 };
// Matches the real show: the Pass becomes available "prior to the fifth
// question" (i.e. usable from the 50% tier onward, index 4) and can never be
// used on the final tier.
export const MIN_PASS_TIER_INDEX = 4;

export function isPassEligible(state: GameState): boolean {
  return state.currentTierIndex >= MIN_PASS_TIER_INDEX && state.currentTierIndex < state.questions.length - 1;
}

export type GameAction =
  | { type: 'START_GAME'; jackpotAmount: number }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER' }
  | { type: 'ADVANCE' }
  | { type: 'RESTART' }
  // Hosted-mode only — dispatched by HostView, never by solo play.
  | { type: 'PLAYER_ANSWER'; userId: string; nickname: string; index: number }
  // Hosted-mode only — a player skipping this tier with their one-per-game
  // Pass (from the 50% tier onward, never on the final 1% tier).
  | { type: 'PLAYER_PASS'; userId: string; nickname: string }
  | { type: 'REVEAL_TIER' }
  | { type: 'NEXT_TIER' }
  | { type: 'SET_TIMER_CONFIG'; mode: TimerConfig['mode']; durationSeconds: number }
  | { type: 'START_TIMER' }
  | { type: 'CLEAR_TIMER' }
  | { type: 'SET_QUESTIONS'; questions: QuestionTier[] };

function nextTimerEndsAt(config: TimerConfig): number | null {
  return config.mode === 'auto' ? Date.now() + config.durationSeconds * 1000 : null;
}

export function initialState(questions: QuestionTier[]): GameState {
  return {
    questions,
    phase: 'setup',
    currentTierIndex: 0,
    selectedOptionIndex: null,
    jackpotAmount: 0,
    poolRemaining: STARTING_POOL,
    lastAnswerCorrect: null,
    eliminatedAtTierIndex: null,
    playerAnswers: {},
    playerPasses: {},
    lastPlayerResults: null,
    playerCorrectCounts: {},
    outOfRunningIds: [],
    passUsedIds: [],
    timerConfig: DEFAULT_TIMER_CONFIG,
    timerEndsAt: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      if (state.phase !== 'setup' || action.jackpotAmount <= 0) return state;
      return {
        ...state,
        phase: 'playing',
        currentTierIndex: 0,
        selectedOptionIndex: null,
        jackpotAmount: action.jackpotAmount,
        poolRemaining: STARTING_POOL,
        lastAnswerCorrect: null,
        eliminatedAtTierIndex: null,
        playerAnswers: {},
        playerPasses: {},
        lastPlayerResults: null,
        playerCorrectCounts: {},
        outOfRunningIds: [],
        passUsedIds: [],
        timerEndsAt: nextTimerEndsAt(state.timerConfig),
      };
    }

    case 'SELECT_OPTION': {
      if (state.phase !== 'playing') return state;
      return { ...state, selectedOptionIndex: action.index };
    }

    case 'CONFIRM_ANSWER': {
      if (state.phase !== 'playing' || state.selectedOptionIndex === null) return state;
      const tier = state.questions[state.currentTierIndex];
      const correct = state.selectedOptionIndex === tier.correctIndex;
      const poolRemaining = correct
        ? Math.max(1, Math.round((STARTING_POOL * tier.percent) / 100))
        : state.poolRemaining;
      return { ...state, phase: 'reveal', lastAnswerCorrect: correct, poolRemaining };
    }

    case 'ADVANCE': {
      if (state.phase !== 'reveal') return state;
      if (!state.lastAnswerCorrect) {
        return { ...state, phase: 'eliminated', eliminatedAtTierIndex: state.currentTierIndex };
      }
      if (state.currentTierIndex >= state.questions.length - 1) {
        return { ...state, phase: 'won' };
      }
      return {
        ...state,
        phase: 'playing',
        currentTierIndex: state.currentTierIndex + 1,
        selectedOptionIndex: null,
        lastAnswerCorrect: null,
      };
    }

    case 'RESTART':
      return initialState(state.questions);

    case 'PLAYER_ANSWER': {
      if (state.phase !== 'playing') return state;
      // Answering supersedes a pending Pass for this tier — the two are
      // mutually exclusive per player, per tier.
      let playerPasses = state.playerPasses;
      if (action.userId in playerPasses) {
        playerPasses = { ...playerPasses };
        delete playerPasses[action.userId];
      }
      return {
        ...state,
        playerAnswers: {
          ...state.playerAnswers,
          [action.userId]: { nickname: action.nickname, index: action.index },
        },
        playerPasses,
      };
    }

    case 'PLAYER_PASS': {
      if (state.phase !== 'playing' || !isPassEligible(state) || state.passUsedIds.includes(action.userId)) {
        return state;
      }
      // Passing supersedes a pending answer for this tier, and consumes the
      // player's one-per-game Pass immediately (not just on reveal), so a
      // second PLAYER_PASS this game is rejected even before the tier ends.
      let playerAnswers = state.playerAnswers;
      if (action.userId in playerAnswers) {
        playerAnswers = { ...playerAnswers };
        delete playerAnswers[action.userId];
      }
      return {
        ...state,
        playerAnswers,
        playerPasses: {
          ...state.playerPasses,
          [action.userId]: { nickname: action.nickname },
        },
        passUsedIds: [...state.passUsedIds, action.userId],
      };
    }

    case 'REVEAL_TIER': {
      if (state.phase !== 'playing') return state;
      const tier = state.questions[state.currentTierIndex];
      const lastPlayerResults: GameState['lastPlayerResults'] = {};
      const playerCorrectCounts = { ...state.playerCorrectCounts };
      const outOfRunningIds = [...state.outOfRunningIds];
      for (const [userId, answer] of Object.entries(state.playerAnswers)) {
        const correct = answer.index === tier.correctIndex;
        lastPlayerResults[userId] = { nickname: answer.nickname, index: answer.index, correct, passed: false };
        if (correct) {
          playerCorrectCounts[userId] = (playerCorrectCounts[userId] ?? 0) + 1;
        } else if (!outOfRunningIds.includes(userId)) {
          outOfRunningIds.push(userId);
        }
      }
      // Passing is risk-free — it protects a player's stake for this tier
      // without scoring a correct/wrong or affecting outOfRunningIds at all.
      for (const [userId, pass] of Object.entries(state.playerPasses)) {
        lastPlayerResults[userId] = { nickname: pass.nickname, index: -1, correct: false, passed: true };
      }
      // Simulated crowd narrative — unconditional, exactly like solo's math,
      // just no longer gated behind any single actor's correctness.
      const poolRemaining = Math.max(1, Math.round((STARTING_POOL * tier.percent) / 100));
      return {
        ...state,
        phase: 'reveal',
        poolRemaining,
        lastPlayerResults,
        playerCorrectCounts,
        outOfRunningIds,
        timerEndsAt: null,
      };
    }

    case 'NEXT_TIER': {
      if (state.phase !== 'reveal') return state;
      if (state.currentTierIndex >= state.questions.length - 1) {
        return { ...state, phase: 'ended', timerEndsAt: null };
      }
      return {
        ...state,
        phase: 'playing',
        currentTierIndex: state.currentTierIndex + 1,
        playerAnswers: {},
        playerPasses: {},
        lastPlayerResults: null,
        timerEndsAt: nextTimerEndsAt(state.timerConfig),
      };
    }

    case 'SET_TIMER_CONFIG': {
      if (action.durationSeconds <= 0) return state;
      return { ...state, timerConfig: { mode: action.mode, durationSeconds: action.durationSeconds } };
    }

    case 'START_TIMER': {
      if (state.phase !== 'playing') return state;
      return { ...state, timerEndsAt: Date.now() + state.timerConfig.durationSeconds * 1000 };
    }

    case 'CLEAR_TIMER': {
      if (state.phase !== 'playing') return state;
      return { ...state, timerEndsAt: null };
    }

    case 'SET_QUESTIONS': {
      if (state.phase !== 'setup' || action.questions.length === 0) return state;
      return { ...state, questions: action.questions };
    }

    default:
      return state;
  }
}
