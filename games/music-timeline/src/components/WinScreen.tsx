import type { GameState } from '../types';
import { TimelineStrip } from './TimelineStrip';

interface WinScreenProps {
  state: GameState;
  onPlayAgain: () => void;
}

export function WinScreen({ state, onPlayAgain }: WinScreenProps) {
  const winnerNames = state.winnerUserIds.map((id) => state.players[id]?.nickname ?? 'Player');
  const standings = [...state.playerOrder].sort(
    (a, b) => state.players[b].timeline.length - state.players[a].timeline.length,
  );

  return (
    <div className="mt-win-overlay">
      <div className="mt-win-card">
        <h2 className="mt-win-title">
          {winnerNames.length === 1
            ? `${winnerNames[0]} wins!`
            : `${winnerNames.join(' & ')} tie for the win!`}
        </h2>
        {state.poolExhausted && (
          <p className="mt-win-note">The track pool ran out — final standings decided it.</p>
        )}
        <ul className="mt-win-standings">
          {standings.map((id) => (
            <li key={id} className="mt-win-row">
              <span>{state.players[id].nickname}</span>
              <TimelineStrip cards={state.players[id].timeline} />
            </li>
          ))}
        </ul>
        <button type="button" className="mt-btn mt-btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
