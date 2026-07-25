import type { PlayerPresence } from '@games/platform';
import type { GameState } from '../types';

interface TimelineLockStatusProps {
  state: GameState;
  players: PlayerPresence[];
}

/** Per-player lock status during a round — deliberately shows only ✓/…, never
 * a guessed gap, so the host can't infer anyone's placement before reveal. */
export function TimelineLockStatus({ state, players }: TimelineLockStatusProps) {
  const connected = new Set(players.map((p) => p.userId));
  const round = state.round;
  const eligible = round?.eligibleUserIds ?? state.playerOrder;

  return (
    <ul className="mt-lock-status">
      {eligible.map((id) => {
        const player = state.players[id];
        if (!player) return null;
        const locked = round ? id in round.locks : false;
        const isConnected = id.startsWith('local-') || connected.has(id);
        return (
          <li key={id} className={`mt-lock-status-row${locked ? ' locked' : ''}`}>
            <span className="mt-lock-status-name">{player.nickname}</span>
            {!isConnected && <span className="mt-lock-status-tag">offline</span>}
            <span className="mt-lock-status-icon">{locked ? '✓' : '…'}</span>
          </li>
        );
      })}
    </ul>
  );
}
