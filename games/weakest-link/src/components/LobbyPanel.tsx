import { useState } from 'react';
import { nicknameWithIcon } from '@games/platform';
import type { GameState } from '../types';
import type { WeakestLinkAction } from '../state/gameReducer';

interface LobbyPanelProps {
  state: GameState;
  dispatch: (action: WeakestLinkAction) => void;
}

/** Pre-game roster + start button. Remote players who joined the room are
 * registered automatically (by HostView); this panel only needs to handle
 * players sharing this screen (pass-and-play), same split as Music
 * Timeline's LobbyPanel. */
export function LobbyPanel({ state, dispatch }: LobbyPanelProps) {
  const [name, setName] = useState('');

  function addLocalPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'PLAYER_JOINED', userId: `local-${crypto.randomUUID()}`, nickname: trimmed });
    setName('');
  }

  const count = state.playerOrder.length;

  return (
    <div className="wl-lobby">
      <h1 className="wl-lobby-title">The Weakest Link</h1>
      <p className="wl-lobby-sub">
        Answer in turn, build the chain, bank it before it breaks — then vote off the weakest
        link each round until it's a head-to-head final.
      </p>

      <div className="wl-lobby-roster">
        <h2>Players</h2>
        {count === 0 && <p className="wl-lobby-empty">No players yet.</p>}
        <ul className="wl-lobby-list">
          {state.playerOrder.map((id) => (
            <li key={id} className="wl-lobby-item">
              {nicknameWithIcon(state.players[id].nickname)}
              {id.startsWith('local-') && <span className="wl-lobby-tag">this screen</span>}
            </li>
          ))}
        </ul>
      </div>

      <form
        className="wl-lobby-add"
        onSubmit={(e) => {
          e.preventDefault();
          addLocalPlayer();
        }}
      >
        <input
          className="wl-input"
          value={name}
          maxLength={20}
          placeholder="Add a player on this screen"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="wl-btn">
          Add
        </button>
      </form>
      <p className="wl-lobby-hint">
        Anyone who joins with the room code is added automatically. Use the field above only for
        players sharing this screen. Exactly two players goes straight to the final; three or
        more plays a full game of money rounds and vote-offs.
      </p>

      <button
        type="button"
        className="wl-btn wl-btn--primary wl-lobby-start"
        disabled={count < 2}
        onClick={() => dispatch({ type: 'START_GAME', at: Date.now() })}
      >
        {count < 2 ? 'Need at least 2 players' : 'Start Game'}
      </button>
    </div>
  );
}
