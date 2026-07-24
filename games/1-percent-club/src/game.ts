import type { GameDefinition } from '@games/platform';
import { questions } from './data/questions';
import { gameReducer, initialState, type GameAction } from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

/**
 * 1% Club as a platform game. Solo mode is unchanged: you alone against the
 * simulated crowd of 100. Hosted mode keeps that same simulated crowd driving
 * the jackpot narrative — real joined players answer alongside it purely for
 * bragging rights, with the host walking the group through each reveal.
 */
export const onePercentClub: GameDefinition<GameState, GameAction> = {
  slug: 'one-percent-club',
  displayName: '1% Club',
  tagline: 'Chase the jackpot with the crowd — answer along for bragging rights.',
  createInitialState: () => initialState(questions),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
