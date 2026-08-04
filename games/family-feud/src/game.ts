import type { GameDefinition } from '@games/platform';
import { rounds } from './data/rounds';
import { gameReducer, initialState, type GameAction } from './state/gameReducer';
import type { Category, GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

function shuffledRounds(): Category[] {
  return [...rounds].sort(() => Math.random() - 0.5);
}

/**
 * Family Feud as a platform game: the existing reducer becomes the authoritative
 * state machine the room drives, with a host (big screen) view and a player
 * (phone) view.
 *
 * A fresh game shuffles the classic round order so replays don't always start
 * with the same round-1 category — matches the pattern used by 1% Club
 * (random ladder) and Soundtrack Showdown (random clue subset).
 */
export const familyFeud: GameDefinition<GameState, GameAction> = {
  slug: 'family-feud',
  displayName: 'Family Feud',
  tagline: 'Survey says… gather round and guess the top answers.',
  createInitialState: () => initialState(shuffledRounds()),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
