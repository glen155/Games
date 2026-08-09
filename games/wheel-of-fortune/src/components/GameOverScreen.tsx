import type { GameState } from '../types';

interface GameOverScreenProps {
  state: GameState;
  onPlayAgain: () => void;
}

export function GameOverScreen({ state, onPlayAgain }: GameOverScreenProps) {
  const [teamA, teamB] = state.teams;
  const winner = teamA.score === teamB.score ? null : teamA.score > teamB.score ? teamA : teamB;

  return (
    <div className="wof-gameover-overlay">
      <div className="wof-gameover-card">
        <h2 className="wof-gameover-title">{winner ? `${winner.name} wins!` : "It's a tie!"}</h2>
        <div className="wof-gameover-scores">
          {state.teams.map((t) => (
            <div key={t.name} className="wof-gameover-row">
              <span>{t.name}</span>
              <span>${t.score}</span>
            </div>
          ))}
        </div>
        <button type="button" className="wof-btn wof-btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
