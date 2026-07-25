import { useEffect, useState } from 'react';
import type { PlayerPresence } from '@games/platform';
import type { GameState } from '../types';
import type { MusicTimelineAction } from '../state/gameReducer';

/**
 * Host-local shot clock. Ticks a countdown while a round is `playing`, and
 * force-resolves the round (dispatching `SHOT_CLOCK_EXPIRED`) either when the
 * deadline passes or once every currently-connected eligible player has
 * locked in — whichever comes first. Also auto-advances `locked` into
 * `reveal` after a short pause, purely for host-screen pacing.
 */
export function useShotClock(
  state: GameState,
  dispatch: (action: MusicTimelineAction) => void,
  players: PlayerPresence[],
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state.phase !== 'playing' || !state.round?.deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.phase, state.round?.deadline]);

  useEffect(() => {
    if (state.phase !== 'playing' || !state.round?.deadline) return;
    if (now >= state.round.deadline) dispatch({ type: 'SHOT_CLOCK_EXPIRED' });
  }, [now, state.phase, state.round?.deadline, dispatch]);

  useEffect(() => {
    if (state.phase !== 'playing' || !state.round) return;
    const round = state.round;
    const eligible = round.eligibleUserIds ?? state.playerOrder;
    const connectedPresence = new Set(players.map((p) => p.userId));
    // Local (same-screen) players have no presence entry — always connected.
    const connectedEligible = eligible.filter(
      (id) => id.startsWith('local-') || connectedPresence.has(id),
    );
    if (connectedEligible.length > 0 && connectedEligible.every((id) => id in round.locks)) {
      dispatch({ type: 'SHOT_CLOCK_EXPIRED' });
    }
  }, [state.phase, state.round, state.playerOrder, players, dispatch]);

  useEffect(() => {
    if (state.phase !== 'locked') return;
    const id = setTimeout(() => dispatch({ type: 'REVEAL_ROUND' }), 600);
    return () => clearTimeout(id);
  }, [state.phase, dispatch]);

  const remainingMs = state.round?.deadline ? Math.max(0, state.round.deadline - now) : null;
  return { remainingMs };
}
