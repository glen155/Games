import type { GameDefinition } from '@games/platform';
import { rounds } from './data/rounds';
import { gameReducer, initialState, type GameAction } from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

/**
 * Family Feud as a platform game: the existing reducer becomes the authoritative
 * state machine the room drives, with a host (big screen) view and a player
 * (phone) view.
 */
export const familyFeud: GameDefinition<GameState, GameAction> = {
  slug: 'family-feud',
  displayName: 'Family Feud',
  tagline: 'Survey says… gather round and guess the top answers.',
  createInitialState: () => initialState(rounds),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
