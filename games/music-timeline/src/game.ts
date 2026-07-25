import type { GameDefinition } from '@games/platform';
import { tracks } from './data/tracks';
import { gameReducer, createInitialState, type MusicTimelineAction } from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

/**
 * Music Timeline as a platform game: guess when a song is from by placing it
 * into your own chronological timeline. Simultaneous placement, first to the
 * target card count wins.
 */
export const musicTimeline: GameDefinition<GameState, MusicTimelineAction> = {
  slug: 'music-timeline',
  displayName: 'Music Timeline',
  tagline: 'Guess when each song is from — build your timeline first to win.',
  createInitialState: () => createInitialState(tracks),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
