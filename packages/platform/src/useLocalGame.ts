import { useCallback, useReducer } from 'react';
import type { GameDefinition, HostViewProps } from './types';

/**
 * Fully-local single-device play — no network, no room. Returns the same shape
 * the HostView consumes, so a game's host screen renders unchanged whether it is
 * driven locally (solo) or by a live room.
 */
export function useLocalGame<State, Action>(
  game: GameDefinition<State, Action>,
): HostViewProps<State, Action> {
  const [state, dispatch] = useReducer(game.reducer, undefined, game.createInitialState);
  const noop = useCallback(() => {}, []);
  return {
    state,
    dispatch,
    players: [],
    playerActions: [],
    clearPlayerAction: noop,
  };
}
