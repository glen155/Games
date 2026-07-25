import { useState } from 'react';
import type { GameState } from '../types';
import type { MusicTimelineAction } from '../state/gameReducer';

interface LobbyPanelProps {
  state: GameState;
  dispatch: (action: MusicTimelineAction) => void;
}

/** Pre-game roster + start button. Remote players who joined the room are
 * registered automatically (by HostView); this panel only needs to handle
 * players sharing this screen (pass-and-play). */
export function LobbyPanel({ state, dispatch }: LobbyPanelProps) {
  const [name, setName] = useState('');

  function addLocalPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'PLAYER_JOINED', userId: `local-${crypto.randomUUID()}`, nickname: trimmed });
    setName('');
  }

  return (
    <div className="mt-lobby">
      <h1 className="mt-lobby-title">Music Timeline</h1>
      <p className="mt-lobby-sub">
        Guess when each song is from — build your timeline first to win.
      </p>

      <div className="mt-lobby-roster">
        <h2>Players</h2>
        {state.playerOrder.length === 0 && <p className="mt-lobby-empty">No players yet.</p>}
        <ul className="mt-lobby-list">
          {state.playerOrder.map((id) => (
            <li key={id} className="mt-lobby-item">
              {state.players[id].nickname}
              {id.startsWith('local-') && <span className="mt-lobby-tag">this screen</span>}
            </li>
          ))}
        </ul>
      </div>

      <form
        className="mt-lobby-add"
        onSubmit={(e) => {
          e.preventDefault();
          addLocalPlayer();
        }}
      >
        <input
          className="mt-input"
          value={name}
          maxLength={20}
          placeholder="Add a player on this screen"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="mt-btn">
          Add
        </button>
      </form>
      <p className="mt-lobby-hint">
        Anyone who joins with the room code is added automatically. Use the field above only
        for players sharing this screen.
      </p>

      <button
        type="button"
        className="mt-btn mt-btn--primary mt-lobby-start"
        disabled={state.playerOrder.length === 0}
        onClick={() => dispatch({ type: 'START_ROUND', at: Date.now() })}
      >
        Start Game
      </button>
    </div>
  );
}
