import { useState } from 'react';
import type { PlayerViewProps } from '@games/platform';
import type { GameState } from './types';

/**
 * The player / phone view. A read-only live mirror of the board — crucially it
 * only renders answer text once the host reveals it, so unrevealed answers never
 * leak into the player's device — plus a big Buzz button to buzz in.
 */
export function PlayerView({ state, sendAction }: PlayerViewProps<GameState>) {
  const [buzzed, setBuzzed] = useState(false);

  if (!state) {
    return (
      <div className="player-view player-view--waiting">
        <p>Waiting for the host to start…</p>
      </div>
    );
  }

  if (state.isRoundOver) {
    const [a, b] = state.teams;
    const winner = a.score === b.score ? null : a.score > b.score ? a : b;
    return (
      <div className="player-view player-view--waiting">
        <h2>Game over!</h2>
        <p>{winner ? `${winner.name} wins!` : "It's a tie!"}</p>
      </div>
    );
  }

  const category = state.rounds[state.currentRoundIndex];

  function handleBuzz() {
    sendAction('buzz');
    setBuzzed(true);
    setTimeout(() => setBuzzed(false), 1200);
  }

  return (
    <div className="player-view">
      <div className="player-view-category">
        <span className="player-view-round">
          Round {state.currentRoundIndex + 1} of {state.rounds.length}
        </span>
        <h1>{category.name}</h1>
      </div>

      <ul className="player-board">
        {category.answers.map((answer, index) => (
          <li
            key={index}
            className={`player-board-row${state.revealed[index] ? ' revealed' : ''}`}
          >
            <span className="player-board-number">{index + 1}</span>
            {state.revealed[index] ? (
              <>
                <span className="player-board-text">{answer.text}</span>
                <span className="player-board-points">{answer.points}</span>
              </>
            ) : (
              <span className="player-board-hidden">• • •</span>
            )}
          </li>
        ))}
      </ul>

      <div className="player-scores">
        {state.teams.map((team) => (
          <div key={team.name} className="player-score">
            <span className="player-score-name">{team.name}</span>
            <span className="player-score-value">{team.score}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`player-buzz${buzzed ? ' player-buzz--active' : ''}`}
        onClick={handleBuzz}
      >
        {buzzed ? 'Buzzed!' : 'BUZZ'}
      </button>
    </div>
  );
}
