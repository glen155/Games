import type { GameState } from '../types';

interface PlayerRosterProps {
  state: GameState;
  currentTurnId?: string;
}

/** Everyone who's played this game, in join order — eliminated players stay
 * visible (struck through) so the room can see the full story, not just
 * who's left. Shows this round's correct/wrong tally for whoever's still in. */
export function PlayerRoster({ state, currentTurnId }: PlayerRosterProps) {
  return (
    <ul className="wl-roster">
      {state.playerOrder.map((id) => {
        const player = state.players[id];
        const stats = state.roundStats[id];
        return (
          <li
            key={id}
            className={`wl-roster-row${player.eliminated ? ' wl-roster-row--eliminated' : ''}${
              id === currentTurnId ? ' wl-roster-row--current' : ''
            }`}
          >
            <span className="wl-roster-name">{player.nickname}</span>
            {stats && !player.eliminated && (
              <span className="wl-roster-stats">
                <span className="wl-roster-stat wl-roster-stat--correct">✓ {stats.correct}</span>
                <span className="wl-roster-stat wl-roster-stat--wrong">✗ {stats.wrong}</span>
              </span>
            )}
            {player.eliminated && <span className="wl-roster-tag">out</span>}
          </li>
        );
      })}
    </ul>
  );
}
