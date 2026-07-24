import type { Team, TeamId } from '../types';
import { TeamPanel } from './TeamPanel';

interface ScoreboardProps {
  teams: [Team, Team];
  activeTeam: TeamId;
  pot: number;
  onSetActive: (team: TeamId) => void;
  onAward: (team: TeamId) => void;
  onRename: (team: TeamId, name: string) => void;
}

export function Scoreboard({ teams, activeTeam, pot, onSetActive, onAward, onRename }: ScoreboardProps) {
  return (
    <div className="scoreboard">
      <TeamPanel
        team={teams[0]}
        teamId={0}
        isActive={activeTeam === 0}
        pot={pot}
        onSetActive={onSetActive}
        onAward={onAward}
        onRename={onRename}
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
        onSetActive={onSetActive}
        onAward={onAward}
        onRename={onRename}
      />
    </div>
  );
}
