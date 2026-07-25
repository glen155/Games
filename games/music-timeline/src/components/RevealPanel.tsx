import type { GameState } from '../types';

interface RevealPanelProps {
  state: GameState;
  onNext: () => void;
}

export function RevealPanel({ state, onNext }: RevealPanelProps) {
  const round = state.round!;
  const track = state.trackPool.find((t) => t.id === round.trackId)!;
  const results = round.results ?? {};

  return (
    <div className="mt-reveal">
      <p className="mt-reveal-year">{track.year}</p>
      <h2 className="mt-reveal-title">{track.title}</h2>
      <p className="mt-reveal-artist">{track.artist}</p>

      <ul className="mt-reveal-results">
        {state.playerOrder.map((id) => {
          const player = state.players[id];
          const result = results[id];
          const outcome = !result ? 'no-guess' : result.correct ? 'correct' : 'wrong';
          return (
            <li key={id} className={`mt-reveal-row mt-reveal-row--${outcome}`}>
              <span>{player.nickname}</span>
              <span>
                {outcome === 'no-guess'
                  ? 'No guess'
                  : outcome === 'correct'
                    ? 'Correct! Card added'
                    : 'Wrong — card discarded'}
              </span>
            </li>
          );
        })}
      </ul>

      <button type="button" className="mt-btn mt-btn--primary" onClick={onNext}>
        Next Round ▶
      </button>
    </div>
  );
}
