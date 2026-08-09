import { useState } from 'react';
import { nicknameWithIcon } from '@games/platform';
import type { Team, TeamId } from '../types';

interface RosterEntry {
  userId: string;
  nickname: string;
}

interface TeamPanelProps {
  team: Team;
  teamId: TeamId;
  isActive: boolean;
  pot: number;
  /** Joined players who picked this team, if any (hosted mode only). */
  roster: RosterEntry[];
  /** The derived captain's userId for this team — whoever's been on it the
   * longest — or null if nobody's joined yet. */
  captainUserId: string | null;
  onSetActive: (team: TeamId) => void;
  onAward: (team: TeamId) => void;
  onRename: (team: TeamId, name: string) => void;
  /** Host-only: tap a roster chip to move that player to the other team. */
  onReassign: (userId: string, team: TeamId) => void;
}

export function TeamPanel({
  team,
  teamId,
  isActive,
  pot,
  roster,
  captainUserId,
  onSetActive,
  onAward,
  onRename,
  onReassign,
}: TeamPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(team.name);
  const otherTeam: TeamId = teamId === 0 ? 1 : 0;

  function commitRename() {
    const trimmed = draftName.trim();
    onRename(teamId, trimmed || team.name);
    setEditing(false);
  }

  return (
    <div
      className={`scoreboard-panel${isActive ? ' scoreboard-panel--active' : ''}`}
      onClick={() => !editing && onSetActive(teamId)}
    >
      {editing ? (
        <input
          className="scoreboard-name-input"
          value={draftName}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
          }}
        />
      ) : (
        <h2
          className="scoreboard-name"
          onClick={(e) => {
            e.stopPropagation();
            setDraftName(team.name);
            setEditing(true);
          }}
          title="Click to rename"
        >
          {isActive && <span className="scoreboard-active-indicator">▶</span>}
          {team.name}
        </h2>
      )}
      <div className="scoreboard-score">{team.score}</div>
      {roster.length > 0 && (
        <ul className="scoreboard-roster" onClick={(e) => e.stopPropagation()}>
          {roster.map((player) => (
            <li key={player.userId}>
              <button
                type="button"
                className="scoreboard-roster-chip"
                title={`Move ${player.nickname} to the other team`}
                onClick={() => onReassign(player.userId, otherTeam)}
              >
                {player.userId === captainUserId && (
                  <span className="scoreboard-captain-badge" title="Team captain">★</span>
                )}
                {nicknameWithIcon(player.nickname)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="scoreboard-award-button"
        disabled={pot === 0}
        onClick={(e) => {
          e.stopPropagation();
          onAward(teamId);
        }}
      >
        Award {pot} pts
      </button>
    </div>
  );
}
