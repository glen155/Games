import type { PlayerPresence } from '@games/platform';
import type { Team, TeamId } from '../types';
import { captainOfTeam } from '../state/gameReducer';
import { TeamPanel } from './TeamPanel';

interface ScoreboardProps {
  teams: [Team, Team];
  activeTeam: TeamId;
  roundPot: number;
  players: PlayerPresence[];
  teamAssignments: Record<string, TeamId>;
  onRename: (team: TeamId, name: string) => void;
  /** Host-only: move a player onto the other team. */
  onReassign: (userId: string, team: TeamId) => void;
}

/** Two TeamPanels plus the round pot readout between them. Unlike Family
 * Feud's Scoreboard, there's no onSetActive/onAward here — whose turn it is
 * and who banks the pot are both automatic (SPIN/SOLVE resolve them). */
export function Scoreboard({
  teams,
  activeTeam,
  roundPot,
  players,
  teamAssignments,
  onRename,
  onReassign,
}: ScoreboardProps) {
  const rosterFor = (teamId: TeamId) =>
    players
      .filter((p) => teamAssignments[p.userId] === teamId)
      .map((p) => ({ userId: p.userId, nickname: p.nickname }));

  return (
    <div className="wof-scoreboard">
      <TeamPanel
        team={teams[0]}
        teamId={0}
        isActive={activeTeam === 0}
        roster={rosterFor(0)}
        captainUserId={captainOfTeam(0, players, teamAssignments)}
        onRename={onRename}
        onReassign={onReassign}
      />
      <div className="wof-scoreboard-pot">
        <span className="wof-scoreboard-pot-label">Round Pot</span>
        <span className="wof-scoreboard-pot-value">${roundPot}</span>
      </div>
      <TeamPanel
        team={teams[1]}
        teamId={1}
        isActive={activeTeam === 1}
        roster={rosterFor(1)}
        captainUserId={captainOfTeam(1, players, teamAssignments)}
        onRename={onRename}
        onReassign={onReassign}
      />
    </div>
  );
}
