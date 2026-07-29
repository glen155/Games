import type { ComponentType } from 'react';

/** Which side of a room a device is on. */
export type Role = 'host' | 'player';

/** A running instance of one game. Mirrors the `rooms` table. */
export interface Room {
  id: string;
  code: string;
  gameSlug: string;
  hostUserId: string;
  status: 'lobby' | 'active' | 'ended';
}

/** A person who joined a room from their own device (via presence). */
export interface PlayerPresence {
  userId: string;
  nickname: string;
  /** Wall-clock join time (ms) — used to order the lobby list. */
  joinedAt: number;
}

/**
 * Props handed to a game's HostView — the authoritative screen (the TV/laptop).
 * The host owns state and is the only device allowed to dispatch actions.
 */
export interface HostViewProps<State, Action> {
  state: State;
  dispatch: (action: Action) => void;
  players: PlayerPresence[];
  /** Latest player-originated actions (buzzes, guesses) the host can react to. */
  playerActions: PlayerAction[];
  clearPlayerAction: (id: string) => void;
  /**
   * False in solo/local single-device mode, true when driving a live room.
   * `players.length === 0` alone can't distinguish these — a hosted room's
   * lobby is also empty until the first player joins — so games whose solo
   * and hosted flows genuinely differ (not just "more players") should
   * branch on this instead.
   */
  isHosted: boolean;
  /** The live room's id (for recordGameResult etc). Null in solo mode. */
  roomId: string | null;
}

/**
 * Props handed to a game's PlayerView — a joined device (a phone). Read-only
 * mirror of host state, plus a channel to send actions back to the host.
 */
export interface PlayerViewProps<State> {
  state: State | null;
  nickname: string;
  /** This device's stable id (its row/key in any per-player state the host tracks). */
  userId: string;
  players: PlayerPresence[];
  sendAction: (type: string, payload?: unknown) => void;
  /** The joined room's id (for reportIssue etc). Null in solo mode. */
  roomId: string | null;
}

/** A message sent from a player device up to the host over the room channel. */
export interface PlayerAction {
  id: string;
  userId: string;
  nickname: string;
  type: string;
  payload?: unknown;
  at: number;
}

/**
 * The contract every game implements to plug into the platform. State/Action
 * are the game's own reducer types — the platform stays game-agnostic.
 */
export interface GameDefinition<State, Action> {
  slug: string;
  displayName: string;
  tagline?: string;
  createInitialState: () => State;
  reducer: (state: State, action: Action) => State;
  HostView: ComponentType<HostViewProps<State, Action>>;
  PlayerView: ComponentType<PlayerViewProps<State>>;
}
