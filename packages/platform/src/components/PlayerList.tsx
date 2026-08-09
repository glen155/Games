import type { PlayerPresence } from '../types';
import { nicknameWithIcon } from '../nicknameIcon';

interface PlayerListProps {
  players: PlayerPresence[];
  title?: string;
}

/** Live "who's in the room" list, driven by realtime presence. */
export function PlayerList({ players, title = 'Players' }: PlayerListProps) {
  return (
    <div className="player-list">
      <span className="player-list-title">
        {title} <span className="player-list-count">{players.length}</span>
      </span>
      {players.length === 0 ? (
        <span className="player-list-empty">Waiting for players to join…</span>
      ) : (
        <ul className="player-list-items">
          {players.map((p) => (
            <li key={p.userId} className="player-list-item">
              {nicknameWithIcon(p.nickname)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
