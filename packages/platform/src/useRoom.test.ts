// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHostRoom, usePlayerRoom } from './useRoom'
import { ensureSignedIn, getSupabase } from './supabase'
import type { GameDefinition } from './types'

vi.mock('./supabase', () => ({
  getSupabase: vi.fn(),
  ensureSignedIn: vi.fn(),
}))

const mockedGetSupabase = vi.mocked(getSupabase)
const mockedEnsureSignedIn = vi.mocked(ensureSignedIn)

interface CounterState {
  count: number
}
type CounterAction = { type: 'INC' }

const game: GameDefinition<CounterState, CounterAction> = {
  slug: 'counter-test',
  displayName: 'Counter',
  createInitialState: () => ({ count: 0 }),
  reducer: (state, action) => (action.type === 'INC' ? { count: state.count + 1 } : state),
  HostView: () => null,
  PlayerView: () => null,
}

interface FakeQueryResult {
  data?: unknown
  error?: unknown
}

function createChain(result: FakeQueryResult) {
  const chain: Record<string, unknown> = {
    then: (resolve: (v: FakeQueryResult) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'eq', 'neq', 'order', 'limit', 'insert', 'update', 'upsert', 'single', 'maybeSingle']) {
    chain[method] = vi.fn(() => chain)
  }
  return chain
}

function createFakeChannel() {
  const listeners: {
    presenceSync?: () => void
    broadcast: Record<string, (arg: { payload: unknown }) => void>
  } = { broadcast: {} }

  const channel = {
    on: vi.fn((type: string, filter: { event: string }, cb: (arg?: { payload: unknown }) => void) => {
      if (type === 'presence' && filter.event === 'sync') listeners.presenceSync = cb
      if (type === 'broadcast') listeners.broadcast[filter.event] = cb as (arg: { payload: unknown }) => void
      return channel
    }),
    subscribe: vi.fn((cb: (status: string) => void) => {
      queueMicrotask(() => cb('SUBSCRIBED'))
      return channel
    }),
    track: vi.fn().mockResolvedValue({ status: 'ok' }),
    send: vi.fn(),
    presenceState: vi.fn(() => ({})),
    _emitPresenceSync: () => listeners.presenceSync?.(),
    _emitBroadcast: (event: string, payload: unknown) => listeners.broadcast[event]?.({ payload }),
  }
  return channel
}

type FakeChannel = ReturnType<typeof createFakeChannel>

function createFakeClient(fromResults: Record<string, FakeQueryResult[]> = {}) {
  const counters: Record<string, number> = {}
  const channels: FakeChannel[] = []
  const client = {
    from: vi.fn((table: string) => {
      const queue = fromResults[table] ?? []
      const i = counters[table] ?? 0
      counters[table] = i + 1
      const result = queue[Math.min(i, queue.length - 1)] ?? { data: null, error: null }
      return createChain(result)
    }),
    channel: vi.fn(() => {
      const ch = createFakeChannel()
      channels.push(ch)
      return ch
    }),
    removeChannel: vi.fn(),
  }
  return { client, channels }
}

const SESSION_KEY = 'games-platform:host-room:counter-test'

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('useHostRoom - local-only mode', () => {
  it('applies dispatch synchronously with no network when multiplayer is not configured', () => {
    mockedGetSupabase.mockReturnValue(null)
    const { result } = renderHook(() => useHostRoom(game))
    expect(result.current.phase).toBe('connected')
    act(() => result.current.dispatch({ type: 'INC' }))
    expect(result.current.state.count).toBe(1)
  })
})

describe('useHostRoom - hosted mode', () => {
  it('creates a room, connects, and dispatch broadcasts + persists state', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    expect(result.current.code).toBe('ABCDEF')
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('ABCDEF')

    const channel = channels[0]
    act(() => result.current.dispatch({ type: 'INC' }))
    expect(result.current.state.count).toBe(1)
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'state', payload: { state: { count: 1 } } }),
    )
  })

  it('resumes an existing room from sessionStorage, merging its persisted state', async () => {
    sessionStorage.setItem(SESSION_KEY, 'RESUME1')
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client } = createFakeClient({
      rooms: [{ data: { id: 'room-9', code: 'RESUME1', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      game_state: [{ data: { state: { count: 5 } }, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('connected'))
    expect(result.current.code).toBe('RESUME1')
    expect(result.current.state.count).toBe(5)
  })

  it('retries room-code creation on a collision and eventually succeeds', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client } = createFakeClient({
      rooms: [
        { data: null, error: { code: '23505', message: 'duplicate' } },
        { data: { id: 'room-2', code: 'RETRY1', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null },
      ],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('connected'))
    expect(result.current.code).toBe('RETRY1')
  })

  it('surfaces an error once every room-code creation attempt collides', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client } = createFakeClient({
      rooms: Array.from({ length: 5 }, () => ({ data: null, error: { code: '23505', message: 'duplicate' } })),
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('error'))
    expect(result.current.error).toMatch(/unique room code/i)
  })

  it('updates the player list from presence sync, sorted by join time and filtered to players', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    const channel = channels[0]
    channel.presenceState.mockReturnValue({
      'user-2': [{ userId: 'user-2', nickname: 'Alice', role: 'player', joinedAt: 100 }],
      'user-1': [{ userId: 'user-1', nickname: 'Host', role: 'host', joinedAt: 50 }],
      'user-3': [{ userId: 'user-3', nickname: 'Bob', role: 'player', joinedAt: 10 }],
    })
    act(() => channel._emitPresenceSync())

    expect(result.current.players).toEqual([
      { userId: 'user-3', nickname: 'Bob', joinedAt: 10 },
      { userId: 'user-2', nickname: 'Alice', joinedAt: 100 },
    ])
  })

  it('caps tracked player actions at the most recent 20', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    const channel = channels[0]
    act(() => {
      for (let i = 0; i < 25; i += 1) {
        channel._emitBroadcast('action', { id: `a${i}`, userId: 'u', nickname: 'n', type: 'buzz', payload: undefined, at: i })
      }
    })

    expect(result.current.playerActions).toHaveLength(20)
    expect(result.current.playerActions[0].id).toBe('a5')
    expect(result.current.playerActions[19].id).toBe('a24')
  })

  it('endRoom broadcasts room-ended, marks the room ended, and clears the session', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-1')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => useHostRoom(game))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    const channel = channels[0]
    act(() => result.current.endRoom())

    expect(channel.send).toHaveBeenCalledWith(expect.objectContaining({ event: 'room-ended' }))
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})

describe('usePlayerRoom', () => {
  it('surfaces a configuration error with no network when multiplayer is not set up', () => {
    mockedGetSupabase.mockReturnValue(null)
    const { result } = renderHook(() => usePlayerRoom(game, 'abc123', 'Alice'))
    expect(result.current.phase).toBe('error')
    expect(result.current.error).toMatch(/not configured/i)
  })

  it('resolves to not-found when no room matches the code', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-2')
    const { client } = createFakeClient({ rooms: [{ data: null, error: null }] })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => usePlayerRoom(game, 'ZZZZZZ', 'Alice'))
    await waitFor(() => expect(result.current.phase).toBe('not-found'))
  })

  it('joins successfully, merging partial stored state over the game default', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-2')
    const { client } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      players: [{ data: null, error: null }],
      game_state: [{ data: { state: {} }, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => usePlayerRoom(game, 'abcdef', 'Alice'))
    await waitFor(() => expect(result.current.phase).toBe('connected'))
    expect(result.current.state).toEqual({ count: 0 })
    expect(result.current.room?.code).toBe('ABCDEF')
  })

  it('applies a state broadcast directly, replacing local state', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-2')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      players: [{ data: null, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => usePlayerRoom(game, 'abcdef', 'Alice'))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    act(() => channels[0]._emitBroadcast('state', { state: { count: 42 } }))
    expect(result.current.state).toEqual({ count: 42 })
  })

  it('transitions to ended on a room-ended broadcast', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-2')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      players: [{ data: null, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => usePlayerRoom(game, 'abcdef', 'Alice'))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    act(() => channels[0]._emitBroadcast('room-ended', {}))
    expect(result.current.phase).toBe('ended')
  })

  it('sendAction broadcasts a PlayerAction with the expected shape', async () => {
    mockedEnsureSignedIn.mockResolvedValue('user-2')
    const { client, channels } = createFakeClient({
      rooms: [{ data: { id: 'room-1', code: 'ABCDEF', game_slug: 'counter-test', host_user_id: 'user-1', status: 'lobby' }, error: null }],
      players: [{ data: null, error: null }],
      game_state: [{ data: null, error: null }],
    })
    mockedGetSupabase.mockReturnValue(client as never)

    const { result } = renderHook(() => usePlayerRoom(game, 'abcdef', 'Alice'))
    await waitFor(() => expect(result.current.phase).toBe('connected'))

    act(() => result.current.sendAction('buzz', { fast: true }))

    expect(channels[0].send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'action',
        payload: expect.objectContaining({
          userId: 'user-2',
          nickname: 'Alice',
          type: 'buzz',
          payload: { fast: true },
        }),
      }),
    )
  })
})
