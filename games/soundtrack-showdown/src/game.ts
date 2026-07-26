import type { GameDefinition } from '@games/platform';
import { clues as cluePool } from './data/clues';
import {
  gameReducer,
  initialState,
  pickRandomClues,
  DEFAULT_ROUND_COUNT,
  type GameAction,
} from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

/**
 * Soundtrack Showdown as a platform game: a movie/TV theme plays over
 * Spotify, players pick which title it's from (multiple choice). Everyone
 * answers every clue — no elimination — and whoever has the most correct at
 * the end wins. A fresh game draws a random subset of the curated pool so
 * replays don't always show the identical clue set.
 */
export const soundtrackShowdown: GameDefinition<GameState, GameAction> = {
  slug: 'soundtrack-showdown',
  displayName: 'Soundtrack Showdown',
  tagline: "Name the movie or show before the theme gives it away.",
  createInitialState: () => initialState(pickRandomClues(cluePool, DEFAULT_ROUND_COUNT)),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
