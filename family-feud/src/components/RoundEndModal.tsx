import type { Team } from '../types';

interface RoundEndModalProps {
  teams: [Team, Team];
  onPlayAgain: () => void;
}

export function RoundEndModal({ teams, onPlayAgain }: RoundEndModalProps) {
  const winner =
    teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? teams[0] : teams[1];

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">Game Over!</h2>
        <p className="modal-winner">
          {winner ? `${winner.name} wins!` : "It's a tie!"}
        </p>
        <div className="modal-final-scores">
          {teams.map((team) => (
            <div key={team.name} className="modal-score-row">
              <span>{team.name}</span>
              <span>{team.score}</span>
            </div>
          ))}
        </div>
        <button type="button" className="modal-play-again" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
