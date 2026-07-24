import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { ensureSignedIn, getSupabase } from './supabase';
import { generateRoomCode, normalizeRoomCode } from './roomCode';
import type {
  GameDefinition,
  PlayerAction,
  PlayerPresence,
  Room,
} from './types';

export type ConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'not-found'
  | 'error';

const STATE_EVENT = 'state';
const ACTION_EVENT = 'action';
const MAX_TRACKED_ACTIONS = 20;
const CODE_INSERT_RETRIES = 5;

function channelName(code: string): string {
  return `room:${code}`;
}

function sessionKey(slug: string): string {
  return `games-platform:host-room:${slug}`;
}

/** Reads the live player list out of a channel's presence state. */
function readPlayers(channel: RealtimeChannel): PlayerPresence[] {
  const raw = channel.presenceState() as Record<
    string,
    Array<{ userId?: string; nickname?: string; role?: string; joinedAt?: number }>
  >;
  const players: PlayerPresence[] = [];
  for (const entries of Object.values(raw)) {
    const entry = entries[0];
    if (!entry || entry.role !== 'player' || !entry.userId) continue;
    players.push({
      userId: entry.userId,
      nickname: entry.nickname ?? 'Player',
      joinedAt: entry.joinedAt ?? 0,
    });
  }
  return players.sort((a, b) => a.joinedAt - b.joinedAt);
}

interface HostRoomResult<State, Action> {
  phase: ConnectionPhase;
  error: string | null;
  code: string | null;
  room: Room | null;
  state: State;
  dispatch: (action: Action) => void;
  players: PlayerPresence[];
  playerActions: PlayerAction[];
  clearPlayerAction: (id: string) => void;
  endRoom: () => void;
}

/**
 * Hosts a room for a game. Owns the authoritative state; every dispatch is
 * applied locally, persisted to Postgres (durable / late-join catch-up), and
 * broadcast to all joined devices. Resumes an existing room across host
 * refreshes via sessionStorage so players are not orphaned.
 */
export function useHostRoom<State, Action>(
  game: GameDefinition<State, Action>,
): HostRoomResult<State, Action> {
  const client = getSupabase();

  // Authoritative state, applied synchronously so we can broadcast the result.
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const stateRef = useRef<State>(game.createInitialState());

  const [phase, setPhase] = useState<ConnectionPhase>(client ? 'connecting' : 'connected');
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const broadcastState = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: STATE_EVENT,
      payload: { state: stateRef.current },
    });
  }, []);

  const persistState = useCallback(
    (c: SupabaseClient, roomId: string) => {
      void c
        .from('game_state')
        .upsert({ room_id: roomId, state: stateRef.current })
        .then(({ error: e }) => {
          if (e) console.warn('Failed to persist game state:', e.message);
        });
    },
    [],
  );

  const dispatch = useCallback(
    (action: Action) => {
      stateRef.current = game.reducer(stateRef.current, action);
      forceRender();
      broadcastState();
      if (client && room) persistState(client, room.id);
    },
    [game, broadcastState, client, room, persistState],
  );

  const clearPlayerAction = useCallback((id: string) => {
    setPlayerActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const endRoom = useCallback(() => {
    if (client && room) {
      void client.from('rooms').update({ status: 'ended' }).eq('id', room.id);
      sessionStorage.removeItem(sessionKey(game.slug));
    }
  }, [client, room, game.slug]);

  useEffect(() => {
    if (!client) return; // Local single-device mode: nothing to connect.
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function connect() {
      try {
        const c = client!;
        const userId = await ensureSignedIn(c);
        if (cancelled) return;

        const resumed = await resumeOrCreateRoom(c, game, userId, stateRef.current);
        if (cancelled) return;
        stateRef.current = resumed.state;
        forceRender();
        setRoom(resumed.room);
        setCode(resumed.room.code);
        sessionStorage.setItem(sessionKey(game.slug), resumed.room.code);

        channel = c.channel(channelName(resumed.room.code), {
          config: { broadcast: { self: false }, presence: { key: userId } },
        });
        channelRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
          if (!channel) return;
          setPlayers(readPlayers(channel));
          // A device just (re)joined — push current state so late joiners sync.
          broadcastState();
        });

        channel.on('broadcast', { event: ACTION_EVENT }, ({ payload }) => {
          const action = payload as PlayerAction;
          setPlayerActions((prev) =>
            [...prev, action].slice(-MAX_TRACKED_ACTIONS),
          );
        });

        channel.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED' || cancelled) return;
          await channel!.track({ userId, nickname: 'Host', role: 'host', joinedAt: Date.now() });
          persistState(c, resumed.room.id);
          setPhase('connected');
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not start the room');
        setPhase('error');
      }
    }

    void connect();
    return () => {
      cancelled = true;
      if (channel) void client.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, game.slug]);

  return {
    phase,
    error,
    code,
    room,
    state: stateRef.current,
    dispatch,
    players,
    playerActions,
    clearPlayerAction,
    endRoom,
  };
}

interface PlayerRoomResult<State> {
  phase: ConnectionPhase;
  error: string | null;
  room: Room | null;
  state: State | null;
  userId: string;
  players: PlayerPresence[];
  sendAction: (type: string, payload?: unknown) => void;
}

/**
 * Joins an existing room as a player device. Fetches current state once for
 * catch-up, then applies live state broadcasts from the host. Sends player
 * actions (buzz / guess) back up the room channel.
 */
export function usePlayerRoom<State, Action>(
  game: GameDefinition<State, Action>,
  rawCode: string,
  nickname: string,
): PlayerRoomResult<State> {
  const client = getSupabase();
  const code = normalizeRoomCode(rawCode);

  const [phase, setPhase] = useState<ConnectionPhase>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [players, setPlayers] = useState<PlayerPresence[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string>('');

  const sendAction = useCallback(
    (type: string, payload?: unknown) => {
      const channel = channelRef.current;
      if (!channel) return;
      const action: PlayerAction = {
        id: crypto.randomUUID(),
        userId: userIdRef.current,
        nickname,
        type,
        payload,
        at: Date.now(),
      };
      void channel.send({ type: 'broadcast', event: ACTION_EVENT, payload: action });
    },
    [nickname],
  );

  useEffect(() => {
    if (!client) {
      setError('Multiplayer is not configured for this app.');
      setPhase('error');
      return;
    }
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function connect() {
      try {
        const c = client!;
        const userId = await ensureSignedIn(c);
        userIdRef.current = userId;
        if (cancelled) return;

        const { data: roomRow, error: roomErr } = await c
          .from('rooms')
          .select('id, code, game_slug, host_user_id, status')
          .eq('code', code)
          .eq('game_slug', game.slug)
          .maybeSingle();
        if (cancelled) return;
        if (roomErr) throw new Error(roomErr.message);
        if (!roomRow) {
          setPhase('not-found');
          return;
        }
        const joinedRoom: Room = {
          id: roomRow.id,
          code: roomRow.code,
          gameSlug: roomRow.game_slug,
          hostUserId: roomRow.host_user_id,
          status: roomRow.status,
        };
        setRoom(joinedRoom);

        // Record membership (RLS uses this to grant state reads) — best effort.
        await c
          .from('players')
          .upsert(
            { room_id: joinedRoom.id, user_id: userId, nickname },
            { onConflict: 'room_id,user_id' },
          );

        // Catch-up: pull whatever state exists right now.
        const { data: stateRow } = await c
          .from('game_state')
          .select('state')
          .eq('room_id', joinedRoom.id)
          .maybeSingle();
        if (cancelled) return;
        if (stateRow?.state) setState(stateRow.state as State);

        channel = c.channel(channelName(code), {
          config: { broadcast: { self: false }, presence: { key: userId } },
        });
        channelRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
          if (channel) setPlayers(readPlayers(channel));
        });
        channel.on('broadcast', { event: STATE_EVENT }, ({ payload }) => {
          setState((payload as { state: State }).state);
        });

        channel.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED' || cancelled) return;
          await channel!.track({ userId, nickname, role: 'player', joinedAt: Date.now() });
          setPhase('connected');
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not join the room');
        setPhase('error');
      }
    }

    void connect();
    return () => {
      cancelled = true;
      if (channel) void client.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, code, game.slug, nickname]);

  return { phase, error, room, state, userId: userIdRef.current, players, sendAction };
}

/**
 * Resumes the host's existing room (after a refresh) or creates a fresh one.
 * Returns the room plus the state to seed from (existing durable state on
 * resume, otherwise the game's initial state).
 */
async function resumeOrCreateRoom<State, Action>(
  c: SupabaseClient,
  game: GameDefinition<State, Action>,
  userId: string,
  fallbackState: State,
): Promise<{ room: Room; state: State }> {
  const savedCode = sessionStorage.getItem(sessionKey(game.slug));
  if (savedCode) {
    const { data: existing } = await c
      .from('rooms')
      .select('id, code, game_slug, host_user_id, status')
      .eq('code', savedCode)
      .eq('host_user_id', userId)
      .neq('status', 'ended')
      .maybeSingle();
    if (existing) {
      const { data: stateRow } = await c
        .from('game_state')
        .select('state')
        .eq('room_id', existing.id)
        .maybeSingle();
      return {
        room: {
          id: existing.id,
          code: existing.code,
          gameSlug: existing.game_slug,
          hostUserId: existing.host_user_id,
          status: existing.status,
        },
        state: (stateRow?.state as State) ?? fallbackState,
      };
    }
  }

  // Create a new room, retrying on the (rare) code collision.
  for (let attempt = 0; attempt < CODE_INSERT_RETRIES; attempt += 1) {
    const candidate = generateRoomCode();
    const { data, error } = await c
      .from('rooms')
      .insert({
        code: candidate,
        game_slug: game.slug,
        host_user_id: userId,
        status: 'lobby',
      })
      .select('id, code, game_slug, host_user_id, status')
      .single();
    if (!error && data) {
      await c.from('game_state').insert({ room_id: data.id, state: fallbackState });
      return {
        room: {
          id: data.id,
          code: data.code,
          gameSlug: data.game_slug,
          hostUserId: data.host_user_id,
          status: data.status,
        },
        state: fallbackState,
      };
    }
    // 23505 = unique_violation on the code; any other error is fatal.
    if (error && error.code !== '23505') {
      throw new Error(error.message);
    }
  }
  throw new Error('Could not allocate a unique room code, please try again.');
}
