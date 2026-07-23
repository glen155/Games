import type { GameState, QuestionTier } from '../types';

export const STARTING_POOL = 100;

export type GameAction =
  | { type: 'START_GAME'; jackpotAmount: number }
  | { type: 'SELECT_OPTION'; index: number }
  | { type: 'CONFIRM_ANSWER' }
  | { type: 'ADVANCE' }
  | { type: 'RESTART' };

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

    default:
      return state;
  }
}
