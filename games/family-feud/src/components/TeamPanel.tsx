import { useState } from 'react';
import type { Team, TeamId } from '../types';

interface TeamPanelProps {
  team: Team;
  teamId: TeamId;
  isActive: boolean;
  pot: number;
  /** Nicknames of joined players who picked this team, if any (hosted mode only). */
  roster: string[];
  onSetActive: (team: TeamId) => void;
  onAward: (team: TeamId) => void;
  onRename: (team: TeamId, name: string) => void;
}

export function TeamPanel({ team, teamId, isActive, pot, roster, onSetActive, onAward, onRename }: TeamPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(team.name);

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
          {roster.map((name) => (
            <li key={name} className="scoreboard-roster-chip">{name}</li>
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
