import type { GameState } from '../types';

interface GameOverScreenProps {
  state: GameState;
  onPlayAgain: () => void;
}

export function GameOverScreen({ state, onPlayAgain }: GameOverScreenProps) {
  const winner = state.winnerId ? state.players[state.winnerId] : null;
  const standings = [...state.playerOrder].sort(
    (a, b) => state.players[b].totalCorrect - state.players[a].totalCorrect,
  );

  return (
    <div className="wl-gameover-overlay">
      <div className="wl-gameover-card">
        <h2 className="wl-gameover-title">{winner ? `${winner.nickname} wins!` : 'Game over!'}</h2>
        <p className="wl-gameover-bank">Took home {state.bank} from the bank.</p>
        <ul className="wl-gameover-standings">
          {standings.map((id) => (
            <li key={id} className="wl-gameover-row">
              <span>{state.players[id].nickname}</span>
              <span className="wl-gameover-record">
                {state.players[id].totalCorrect} correct / {state.players[id].totalWrong} wrong
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="wl-btn wl-btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
