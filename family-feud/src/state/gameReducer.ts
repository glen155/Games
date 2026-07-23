import type { Category, GameState, TeamId } from '../types';

export const ANSWERS_PER_ROUND = 8;
export const MAX_STRIKES = 3;

export type GameAction =
  | { type: 'REVEAL_ANSWER'; index: number }
  | { type: 'STRIKE' }
  | { type: 'AWARD_POINTS'; team: TeamId }
  | { type: 'SET_ACTIVE_TEAM'; team: TeamId }
  | { type: 'RESET_ROUND' }
  | { type: 'NEXT_ROUND' }
  | { type: 'PREV_ROUND' }
  | { type: 'SET_TEAM_NAME'; team: TeamId; name: string }
  | { type: 'RESET_GAME' };

export function initialState(rounds: Category[]): GameState {
  return {
    rounds,
    currentRoundIndex: 0,
    revealed: Array(ANSWERS_PER_ROUND).fill(false),
    strikes: 0,
    activeTeam: 0,
    teams: [
      { name: 'Team 1', score: 0 },
      { name: 'Team 2', score: 0 },
    ],
    pot: 0,
    isRoundOver: false,
  };
}

function freshRoundFields(state: GameState, roundIndex: number): GameState {
  const clampedIndex = Math.max(0, Math.min(roundIndex, state.rounds.length - 1));
  return {
    ...state,
    currentRoundIndex: clampedIndex,
    revealed: Array(ANSWERS_PER_ROUND).fill(false),
    strikes: 0,
    pot: 0,
    isRoundOver: roundIndex >= state.rounds.length,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'REVEAL_ANSWER': {
      const { index } = action;
      const category = state.rounds[state.currentRoundIndex];
      if (
        index < 0 ||
        index >= category.answers.length ||
        state.revealed[index]
      ) {
        return state;
      }
      const revealed = [...state.revealed];
      revealed[index] = true;
      return {
        ...state,
        revealed,
        pot: state.pot + category.answers[index].points,
      };
    }

    case 'STRIKE':
      return { ...state, strikes: Math.min(MAX_STRIKES, state.strikes + 1) };

    case 'AWARD_POINTS': {
      const teams: [typeof state.teams[0], typeof state.teams[1]] = [
        { ...state.teams[0] },
        { ...state.teams[1] },
      ];
      teams[action.team].score += state.pot;
      return { ...state, teams, pot: 0 };
    }

    case 'SET_ACTIVE_TEAM':
      return { ...state, activeTeam: action.team };

    case 'RESET_ROUND':
      return freshRoundFields(state, state.currentRoundIndex);

    case 'NEXT_ROUND':
      return freshRoundFields(state, state.currentRoundIndex + 1);

    case 'PREV_ROUND':
      return freshRoundFields(state, state.currentRoundIndex - 1);

    case 'SET_TEAM_NAME': {
      const teams: [typeof state.teams[0], typeof state.teams[1]] = [
        { ...state.teams[0] },
        { ...state.teams[1] },
      ];
      teams[action.team].name = action.name;
      return { ...state, teams };
    }

    case 'RESET_GAME':
      return initialState(state.rounds);

    default:
      return state;
  }
}
