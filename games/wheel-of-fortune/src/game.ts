import type { GameDefinition } from '@games/platform';
import { puzzles } from './data/puzzles';
import { gameReducer, initialState, shuffle, type WheelAction } from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

/**
 * Wheel of Fortune as a platform game: two teams take turns spinning,
 * calling letters, and racing to solve the puzzle. Self-graded, like
 * Weakest Link's questions — the solution is deterministic, so the reducer
 * can judge letter guesses and solve attempts without a host in the loop.
 */
export const wheelOfFortune: GameDefinition<GameState, WheelAction> = {
  slug: 'wheel-of-fortune',
  displayName: 'Wheel of Fortune',
  tagline: 'Spin, call a letter, and race to solve the puzzle as a team.',
  createInitialState: () => initialState(shuffle(puzzles)),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
