import type { GameState, QuestionTier } from '../types';

export const STARTING_POOL = 100;

export type GameAction =
  | { type: 'START_GAME'; jackpotAmount: number }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER' }
  | { type: 'ADVANCE' }
  | { type: 'RESTART' }
  // Hosted-mode only — dispatched by HostView, never by solo play.
  | { type: 'PLAYER_ANSWER'; userId: string; nickname: string; index: number }
  | { type: 'REVEAL_TIER' }
  | { type: 'NEXT_TIER' };

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
    lastPlayerResults: null,
    playerCorrectCounts: {},
    outOfRunningIds: [],
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
        lastPlayerResults: null,
        playerCorrectCounts: {},
        outOfRunningIds: [],
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
      return {
        ...state,
        playerAnswers: {
          ...state.playerAnswers,
          [action.userId]: { nickname: action.nickname, index: action.index },
        },
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
        lastPlayerResults[userId] = { nickname: answer.nickname, index: answer.index, correct };
        if (correct) {
          playerCorrectCounts[userId] = (playerCorrectCounts[userId] ?? 0) + 1;
        } else if (!outOfRunningIds.includes(userId)) {
          outOfRunningIds.push(userId);
        }
      }
      // Simulated crowd narrative — unconditional, exactly like solo's math,
      // just no longer gated behind any single actor's correctness.
      const poolRemaining = Math.max(1, Math.round((STARTING_POOL * tier.percent) / 100));
      return { ...state, phase: 'reveal', poolRemaining, lastPlayerResults, playerCorrectCounts, outOfRunningIds };
    }

    case 'NEXT_TIER': {
      if (state.phase !== 'reveal') return state;
      if (state.currentTierIndex >= state.questions.length - 1) {
        return { ...state, phase: 'ended' };
      }
      return {
        ...state,
        phase: 'playing',
        currentTierIndex: state.currentTierIndex + 1,
        playerAnswers: {},
        lastPlayerResults: null,
      };
    }

    default:
      return state;
  }
}
