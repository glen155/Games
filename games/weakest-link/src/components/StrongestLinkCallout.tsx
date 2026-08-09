import type { GameState } from '../types';
import { roundStandings } from '../state/gameReducer';

interface StrongestLinkCalloutProps {
  state: GameState;
}

/** The round's statistically best performer, surfaced before voting so
 * players can use it strategically — this already silently drives the tie
 * break (see `roundStandings`), this just makes it visible. */
export function StrongestLinkCallout({ state }: StrongestLinkCalloutProps) {
  const { strongestId } = roundStandings(state);
  if (!strongestId) return null;
  const strongest = state.players[strongestId];
  const stats = state.roundStats[strongestId];

  return (
    <div className="wl-strongest-link">
      <span className="wl-strongest-link-label">Strongest link this round</span>
      <span className="wl-strongest-link-name">{strongest.nickname}</span>
      {stats && (
        <span className="wl-strongest-link-stats">
          {stats.correct} correct / {stats.wrong} wrong
        </span>
      )}
    </div>
  );
}
