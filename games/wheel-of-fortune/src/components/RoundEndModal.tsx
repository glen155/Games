import { ROUND_COUNT } from '../state/gameReducer';
import type { GameState } from '../types';

interface RoundEndModalProps {
  state: GameState;
  onNextRound: () => void;
}

/** Shown between rounds — reveals the solved puzzle and who banked it, then
 * hands off to the next round (or lets NEXT_ROUND resolve to game-over on
 * the final round, at which point GameOverScreen takes over instead). */
export function RoundEndModal({ state, onNextRound }: RoundEndModalProps) {
  const winner = state.lastRoundWinner !== null ? state.teams[state.lastRoundWinner] : null;

  return (
    <div className="wof-modal-overlay">
      <div className="wof-modal-card">
        <h2 className="wof-modal-title">{winner ? `${winner.name} solved it!` : 'Round over'}</h2>
        {state.solvedSolution && <p className="wof-modal-solution">{state.solvedSolution}</p>}
        <div className="wof-modal-scores">
          {state.teams.map((t) => (
            <div key={t.name} className="wof-modal-score-row">
              <span>{t.name}</span>
              <span>${t.score}</span>
            </div>
          ))}
        </div>
        <button type="button" className="wof-btn wof-btn--primary" onClick={onNextRound}>
          {state.roundNumber >= ROUND_COUNT ? 'See Final Results' : 'Next Round'}
        </button>
      </div>
    </div>
  );
}
