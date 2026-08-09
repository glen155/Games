import { useState } from 'react';
import type { Team, TeamId } from '../types';

interface RosterEntry {
  userId: string;
  nickname: string;
}

interface TeamPanelProps {
  team: Team;
  teamId: TeamId;
  isActive: boolean;
  /** Joined players who picked this team, if any (hosted mode only). */
  roster: RosterEntry[];
  /** The derived captain's userId for this team, or null if nobody's joined yet. */
  captainUserId: string | null;
  onRename: (team: TeamId, name: string) => void;
  /** Host-only: tap a roster chip to move that player to the other team. */
  onReassign: (userId: string, team: TeamId) => void;
}

/** Team display — same roster-chip/captain-badge/host-reassign pattern as
 * Family Feud's TeamPanel, minus the click-to-activate/award controls: whose
 * turn it is and who banks the pot are both automatic here (SPIN/SOLVE),
 * not host-manual. */
export function TeamPanel({ team, teamId, isActive, roster, captainUserId, onRename, onReassign }: TeamPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(team.name);
  const otherTeam: TeamId = teamId === 0 ? 1 : 0;

  function commitRename() {
    const trimmed = draftName.trim();
    onRename(teamId, trimmed || team.name);
    setEditing(false);
  }

  return (
    <div className={`wof-team-panel${isActive ? ' wof-team-panel--active' : ''}`}>
      {editing ? (
        <input
          className="wof-team-name-input"
          value={draftName}
          autoFocus
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
          }}
        />
      ) : (
        <h2 className="wof-team-name" onClick={() => { setDraftName(team.name); setEditing(true); }} title="Click to rename">
          {isActive && <span className="wof-team-active-indicator">▶</span>}
          {team.name}
        </h2>
      )}
      <div className="wof-team-score">{team.score}</div>
      {roster.length > 0 && (
        <ul className="wof-team-roster">
          {roster.map((player) => (
            <li key={player.userId}>
              <button
                type="button"
                className="wof-team-roster-chip"
                title={`Move ${player.nickname} to the other team`}
                onClick={() => onReassign(player.userId, otherTeam)}
              >
                {player.userId === captainUserId && (
                  <span className="wof-team-captain-badge" title="Team captain">★</span>
                )}
                {player.nickname}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
