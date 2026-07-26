import type { AnswerStyle, GameState, PlayerClueResult, SoundtrackClue, TimerConfig } from '../types';

export const DEFAULT_TIMER_CONFIG: TimerConfig = { mode: 'auto', durationSeconds: 20 };
export const DEFAULT_ROUND_COUNT = 10;

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'HOST_CONFIRMED_PLAYING' } // loading_clue -> answering; starts the timer
  | { type: 'SELECT_OPTION'; index: number } // solo
  | { type: 'CONFIRM_ANSWER' } // solo: answering -> reveal, computes correctness inline
  | { type: 'ADVANCE' } // solo: reveal -> loading_clue | summary
  | { type: 'RESTART' }
  // Hosted-mode only — dispatched by HostView, never by solo play.
  | { type: 'PLAYER_ANSWER'; userId: string; nickname: string; index: number }
  | { type: 'REVEAL_CLUE' } // hosted: answering -> reveal, computes correctness for all (multiple_choice only)
  | { type: 'NEXT_CLUE' } // hosted: reveal -> loading_clue | ended
  | { type: 'SET_TIMER_CONFIG'; mode: TimerConfig['mode']; durationSeconds: number }
  | { type: 'START_TIMER' }
  | { type: 'CLEAR_TIMER' }
  | { type: 'SET_CLUES'; clues: SoundtrackClue[] }
  | { type: 'SET_ANSWER_STYLE'; answerStyle: AnswerStyle } // setup only, hosted UI
  // Hosted-mode + open_guess only: the host's verdict for one player on the
  // current clue, dispatched from PlayerJudgePanel. Never computed from
  // clue data — mirrors Family Feud's REVEAL_ANSWER, where correctness is
  // entirely the host's call.
  | { type: 'HOST_MARK_PLAYER'; userId: string; nickname: string; correct: boolean };

function nextTimerEndsAt(config: TimerConfig): number | null {
  return config.mode === 'auto' ? Date.now() + config.durationSeconds * 1000 : null;
}

export function pickRandomClues(pool: SoundtrackClue[], count: number): SoundtrackClue[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

export function initialState(clues: SoundtrackClue[]): GameState {
  return {
    clues,
    phase: 'setup',
    currentClueIndex: 0,
    answerStyle: 'multiple_choice',
    selectedOptionIndex: null,
    lastAnswerCorrect: null,
    soloCorrectCount: 0,
    playerAnswers: {},
    lastPlayerResults: null,
    playerCorrectCounts: {},
    timerConfig: DEFAULT_TIMER_CONFIG,
    timerEndsAt: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      if (state.phase !== 'setup' || state.clues.length === 0) return state;
      return {
        ...state,
        phase: 'loading_clue',
        currentClueIndex: 0,
        selectedOptionIndex: null,
        lastAnswerCorrect: null,
        soloCorrectCount: 0,
        playerAnswers: {},
        lastPlayerResults: null,
        playerCorrectCounts: {},
        timerEndsAt: null,
      };
    }

    case 'HOST_CONFIRMED_PLAYING': {
      if (state.phase !== 'loading_clue') return state;
      return { ...state, phase: 'answering', timerEndsAt: nextTimerEndsAt(state.timerConfig) };
    }

    case 'SELECT_OPTION': {
      if (state.phase !== 'answering') return state;
      return { ...state, selectedOptionIndex: action.index };
    }

    case 'CONFIRM_ANSWER': {
      if (state.phase !== 'answering' || state.selectedOptionIndex === null) return state;
      const clue = state.clues[state.currentClueIndex];
      const correct = state.selectedOptionIndex === clue.correctIndex;
      return {
        ...state,
        phase: 'reveal',
        lastAnswerCorrect: correct,
        soloCorrectCount: correct ? state.soloCorrectCount + 1 : state.soloCorrectCount,
        timerEndsAt: null,
      };
    }

    case 'ADVANCE': {
      if (state.phase !== 'reveal') return state;
      if (state.currentClueIndex >= state.clues.length - 1) {
        return { ...state, phase: 'summary' };
      }
      return {
        ...state,
        phase: 'loading_clue',
        currentClueIndex: state.currentClueIndex + 1,
        selectedOptionIndex: null,
        lastAnswerCorrect: null,
      };
    }

    case 'RESTART':
      return initialState(state.clues);

    case 'PLAYER_ANSWER': {
      if (state.phase !== 'answering') return state;
      return {
        ...state,
        playerAnswers: {
          ...state.playerAnswers,
          [action.userId]: { nickname: action.nickname, index: action.index },
        },
      };
    }

    case 'REVEAL_CLUE': {
      if (state.phase !== 'answering') return state;
      if (state.answerStyle === 'open_guess') {
        // No auto-scoring here — the host judges each player individually via
        // HOST_MARK_PLAYER once the answer is shown. Just open an empty
        // verdict sheet.
        return { ...state, phase: 'reveal', lastPlayerResults: {}, timerEndsAt: null };
      }
      const clue = state.clues[state.currentClueIndex];
      const lastPlayerResults: Record<string, PlayerClueResult> = {};
      const playerCorrectCounts = { ...state.playerCorrectCounts };
      for (const [userId, answer] of Object.entries(state.playerAnswers)) {
        const correct = answer.index === clue.correctIndex;
        lastPlayerResults[userId] = { nickname: answer.nickname, index: answer.index, correct };
        if (correct) {
          playerCorrectCounts[userId] = (playerCorrectCounts[userId] ?? 0) + 1;
        }
      }
      return {
        ...state,
        phase: 'reveal',
        lastPlayerResults,
        playerCorrectCounts,
        timerEndsAt: null,
      };
    }

    case 'HOST_MARK_PLAYER': {
      if (state.phase !== 'reveal' || state.answerStyle !== 'open_guess') return state;
      const previous = state.lastPlayerResults?.[action.userId];
      const wasCorrect = previous?.correct ?? false;
      let playerCorrectCounts = state.playerCorrectCounts;
      if (action.correct !== wasCorrect) {
        const delta = action.correct ? 1 : -1;
        playerCorrectCounts = {
          ...state.playerCorrectCounts,
          [action.userId]: Math.max(0, (state.playerCorrectCounts[action.userId] ?? 0) + delta),
        };
      }
      return {
        ...state,
        lastPlayerResults: {
          ...state.lastPlayerResults,
          [action.userId]: { nickname: action.nickname, index: null, correct: action.correct },
        },
        playerCorrectCounts,
      };
    }

    case 'NEXT_CLUE': {
      if (state.phase !== 'reveal') return state;
      if (state.currentClueIndex >= state.clues.length - 1) {
        return { ...state, phase: 'ended', timerEndsAt: null };
      }
      return {
        ...state,
        phase: 'loading_clue',
        currentClueIndex: state.currentClueIndex + 1,
        playerAnswers: {},
        lastPlayerResults: null,
        timerEndsAt: null,
      };
    }

    case 'SET_TIMER_CONFIG': {
      if (action.durationSeconds <= 0) return state;
      return { ...state, timerConfig: { mode: action.mode, durationSeconds: action.durationSeconds } };
    }

    case 'START_TIMER': {
      if (state.phase !== 'answering') return state;
      return { ...state, timerEndsAt: Date.now() + state.timerConfig.durationSeconds * 1000 };
    }

    case 'CLEAR_TIMER': {
      if (state.phase !== 'answering') return state;
      return { ...state, timerEndsAt: null };
    }

    case 'SET_CLUES': {
      if (state.phase !== 'setup' || action.clues.length === 0) return state;
      return { ...state, clues: action.clues };
    }

    case 'SET_ANSWER_STYLE': {
      if (state.phase !== 'setup') return state;
      return { ...state, answerStyle: action.answerStyle };
    }

    default:
      return state;
  }
}
