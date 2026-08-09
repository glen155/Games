import type { GameDefinition } from '@games/platform';
import { questions } from './data/questions';
import { gameReducer, initialState, type WeakestLinkAction } from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

function shuffledQuestions() {
  return [...questions].sort(() => Math.random() - 0.5);
}

/**
 * The Weakest Link as a platform game: players answer trivia in rotating
 * turns, climbing a chain of money they can bank or lose, voting off the
 * weakest link each round down to a head-to-head final. Host-judged, like
 * Family Feud — free-text answers can't be auto-graded.
 */
export const weakestLink: GameDefinition<GameState, WeakestLinkAction> = {
  slug: 'weakest-link',
  displayName: 'The Weakest Link',
  tagline: 'Answer in turn, build the chain, bank it — then vote off the weakest link.',
  createInitialState: () => initialState(shuffledQuestions()),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
