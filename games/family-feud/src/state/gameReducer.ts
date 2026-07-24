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
  | { type: 'RESET_GAME' }
  // The classic steal-the-pot mechanic — a general rule improvement, works
  // the same in solo and hosted play (host judges either way).
  | { type: 'RESOLVE_STEAL'; success: boolean }
  // Hosted-mode only — a real joined player picking their own team.
  | { type: 'ASSIGN_TEAM'; userId: string; team: TeamId }
  // Pre-game setup — dismisses the classic-vs-generated chooser.
  | { type: 'BEGIN_GAME' }
  | { type: 'SET_ROUNDS'; rounds: Category[] };

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
    awaitingSteal: false,
    teamAssignments: {},
    gameStarted: false,
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
    awaitingSteal: false,
  };
}

function otherTeam(team: TeamId): TeamId {
  return team === 0 ? 1 : 0;
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

    case 'STRIKE': {
      if (state.awaitingSteal || state.strikes >= MAX_STRIKES) return state;
      const strikes = state.strikes + 1;
      return { ...state, strikes, awaitingSteal: strikes >= MAX_STRIKES };
    }

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

    case 'RESOLVE_STEAL': {
      if (!state.awaitingSteal) return state;
      const winner = action.success ? otherTeam(state.activeTeam) : state.activeTeam;
      const teams: [typeof state.teams[0], typeof state.teams[1]] = [
        { ...state.teams[0] },
        { ...state.teams[1] },
      ];
      teams[winner].score += state.pot;
      return { ...state, teams, pot: 0, awaitingSteal: false };
    }

    case 'ASSIGN_TEAM':
      return {
        ...state,
        teamAssignments: { ...state.teamAssignments, [action.userId]: action.team },
      };

    case 'BEGIN_GAME':
      if (state.gameStarted) return state;
      return { ...state, gameStarted: true };

    case 'SET_ROUNDS': {
      if (state.gameStarted || action.rounds.length === 0) return state;
      return { ...state, rounds: action.rounds, gameStarted: true };
    }

    default:
      return state;
  }
}
