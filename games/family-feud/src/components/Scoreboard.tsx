import type { PlayerPresence } from '@games/platform';
import type { Team, TeamId } from '../types';
import { captainOfTeam } from '../state/gameReducer';
import { TeamPanel } from './TeamPanel';

interface ScoreboardProps {
  teams: [Team, Team];
  activeTeam: TeamId;
  pot: number;
  players: PlayerPresence[];
  teamAssignments: Record<string, TeamId>;
  onSetActive: (team: TeamId) => void;
  onAward: (team: TeamId) => void;
  onRename: (team: TeamId, name: string) => void;
  /** Host-only: move a player onto the other team. */
  onReassign: (userId: string, team: TeamId) => void;
}

export function Scoreboard({
  teams,
  activeTeam,
  pot,
  players,
  teamAssignments,
  onSetActive,
  onAward,
  onRename,
  onReassign,
}: ScoreboardProps) {
  const rosterFor = (teamId: TeamId) =>
    players
      .filter((p) => teamAssignments[p.userId] === teamId)
      .map((p) => ({ userId: p.userId, nickname: p.nickname }));

  return (
    <div className="scoreboard">
      <TeamPanel
        team={teams[0]}
        teamId={0}
        isActive={activeTeam === 0}
        pot={pot}
        roster={rosterFor(0)}
        captainUserId={captainOfTeam(0, players, teamAssignments)}
        onSetActive={onSetActive}
        onAward={onAward}
        onRename={onRename}
        onReassign={onReassign}
      />
      <div className="scoreboard-pot">
        <span className="scoreboard-pot-label">Pot</span>
        <span className="scoreboard-pot-value">{pot}</span>
      </div>
      <TeamPanel
        team={teams[1]}
        teamId={1}
        isActive={activeTeam === 1}
        pot={pot}
        roster={rosterFor(1)}
        captainUserId={captainOfTeam(1, players, teamAssignments)}
        onSetActive={onSetActive}
        onAward={onAward}
        onRename={onRename}
        onReassign={onReassign}
      />
    </div>
  );
}
