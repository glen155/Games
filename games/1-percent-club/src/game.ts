import type { GameDefinition } from '@games/platform';
import { classicLadders } from './data/questions';
import { gameReducer, initialState, type GameAction } from './state/gameReducer';
import type { GameState } from './types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

function pickClassicLadder() {
  return classicLadders[Math.floor(Math.random() * classicLadders.length)].tiers;
}

/**
 * 1% Club as a platform game. Solo mode is unchanged: you alone against the
 * simulated crowd of 100. Hosted mode keeps that same simulated crowd driving
 * the jackpot narrative — real joined players answer alongside it purely for
 * bragging rights, with the host walking the group through each reveal.
 *
 * A fresh local game randomly picks one of the classic ladders so replays
 * don't always show the identical 12 questions.
 */
export const onePercentClub: GameDefinition<GameState, GameAction> = {
  slug: 'one-percent-club',
  displayName: '1% Club',
  tagline: 'Chase the jackpot with the crowd — answer along for bragging rights.',
  createInitialState: () => initialState(pickClassicLadder()),
  reducer: gameReducer,
  HostView,
  PlayerView,
};
