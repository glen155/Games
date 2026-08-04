import { describe, expect, it } from 'vitest'
import { gameReducer } from './gameReducer'
import type { GameState, Track, TimelinePlayer } from '../types'

const trackPool: Track[] = [
  { id: 't1', spotifyUri: 'spotify:track:t1', spotifyUrl: 'https://open.spotify.com/track/t1', title: 'Song A', artist: 'Artist A', year: 2000 },
  { id: 't2', spotifyUri: 'spotify:track:t2', spotifyUrl: 'https://open.spotify.com/track/t2', title: 'Song B', artist: 'Artist B', year: 1990 },
  { id: 't3', spotifyUri: 'spotify:track:t3', spotifyUrl: 'https://open.spotify.com/track/t3', title: 'Song C', artist: 'Artist C', year: 2010 },
]

function player(userId: string, nickname: string, timeline: TimelinePlayer['timeline'] = [], misses = 0): TimelinePlayer {
  return { userId, nickname, timeline, misses }
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    mode: 'timeline',
    phase: 'lobby',
    trackPool,
    usedTrackIds: [],
    targetCards: 10,
    shotClockMs: 25000,
    players: {},
    playerOrder: [],
    round: null,
    roundHistory: [],
    winnerUserIds: [],
    suddenDeath: null,
    poolExhausted: false,
    ...overrides,
  }
}

describe('PLAYER_JOINED', () => {
  it('adds a player and appends registration order', () => {
    const state = gameReducer(baseState(), { type: 'PLAYER_JOINED', userId: 'u1', nickname: 'Alice' })
    expect(state.players.u1).toEqual(player('u1', 'Alice'))
    expect(state.playerOrder).toEqual(['u1'])
  })

  it('no-ops outside the lobby phase', () => {
    const state = baseState({ phase: 'playing' })
    expect(gameReducer(state, { type: 'PLAYER_JOINED', userId: 'u1', nickname: 'Alice' })).toBe(state)
  })

  it('no-ops when the player already joined', () => {
    let state = baseState()
    state = gameReducer(state, { type: 'PLAYER_JOINED', userId: 'u1', nickname: 'Alice' })
    const after = gameReducer(state, { type: 'PLAYER_JOINED', userId: 'u1', nickname: 'Alice Again' })
    expect(after).toBe(state)
  })
})

describe('START_ROUND', () => {
  it('starts a round with a joined player', () => {
    let state = baseState({ players: { u1: player('u1', 'Alice') }, playerOrder: ['u1'] })
    state = gameReducer(state, { type: 'START_ROUND', at: 0 })
    expect(state.phase).toBe('loading_track')
    expect(state.round).not.toBeNull()
    expect(state.usedTrackIds).toContain(state.round!.trackId)
    expect(state.round!.eligibleUserIds).toBeNull()
  })

  it('no-ops outside the lobby phase', () => {
    const state = baseState({ phase: 'playing', players: { u1: player('u1', 'Alice') }, playerOrder: ['u1'] })
    expect(gameReducer(state, { type: 'START_ROUND', at: 0 })).toBe(state)
  })

  it('no-ops with no players', () => {
    const state = baseState()
    expect(gameReducer(state, { type: 'START_ROUND', at: 0 })).toBe(state)
  })

  it('ends the game with a standings fallback winner when the track pool is exhausted', () => {
    const state = baseState({
      players: {
        u1: player('u1', 'Alice', [{ trackId: 't1', year: 2000, title: 'Song A', artist: 'Artist A' }], 1),
        u2: player('u2', 'Bob', [], 0),
      },
      playerOrder: ['u1', 'u2'],
      usedTrackIds: ['t1', 't2', 't3'],
    })
    const after = gameReducer(state, { type: 'START_ROUND', at: 0 })
    expect(after.phase).toBe('game_over')
    expect(after.poolExhausted).toBe(true)
    expect(after.round).toBeNull()
    // Alice has more cards (1 vs 0), so she's the sole standings leader.
    expect(after.winnerUserIds).toEqual(['u1'])
  })

  it('falls back to multiple standings leaders when still tied on cards and misses', () => {
    const card = { trackId: 't1', year: 2000, title: 'Song A', artist: 'Artist A' }
    const state = baseState({
      players: {
        u1: player('u1', 'Alice', [card], 0),
        u2: player('u2', 'Bob', [card], 0),
      },
      playerOrder: ['u1', 'u2'],
      usedTrackIds: ['t1', 't2', 't3'],
    })
    const after = gameReducer(state, { type: 'START_ROUND', at: 0 })
    expect(after.phase).toBe('game_over')
    expect(after.winnerUserIds.sort()).toEqual(['u1', 'u2'])
  })
})

describe('HOST_CONFIRMED_PLAYING', () => {
  it('moves loading_track -> playing and sets the deadline', () => {
    const state = baseState({
      phase: 'loading_track',
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: null, shotClockMs: 25000, deadline: null, locks: {}, results: null,
      },
    })
    const after = gameReducer(state, { type: 'HOST_CONFIRMED_PLAYING', at: 1000 })
    expect(after.phase).toBe('playing')
    expect(after.round!.startedAt).toBe(1000)
    expect(after.round!.deadline).toBe(26000)
  })

  it('no-ops outside loading_track or without a round', () => {
    const state = baseState({ phase: 'playing', round: null })
    expect(gameReducer(state, { type: 'HOST_CONFIRMED_PLAYING', at: 1000 })).toBe(state)
  })
})

describe('LOCK_GUESS', () => {
  function playingState(overrides: Partial<GameState> = {}): GameState {
    return baseState({
      phase: 'playing',
      players: { u1: player('u1', 'Alice', [{ trackId: 't9', year: 1995, title: 'X', artist: 'Y' }]) },
      playerOrder: ['u1'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000, locks: {}, results: null,
      },
      ...overrides,
    })
  }

  it('accepts a gapIndex at the upper boundary (equal to timeline length)', () => {
    const state = playingState()
    const after = gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: 1, receivedAt: 10 })
    expect(after.round!.locks.u1).toEqual({ userId: 'u1', gapIndex: 1, receivedAt: 10 })
  })

  it('rejects a gapIndex one past the upper boundary', () => {
    const state = playingState()
    const after = gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: 2, receivedAt: 10 })
    expect(after).toBe(state)
  })

  it('rejects a negative gapIndex', () => {
    const state = playingState()
    const after = gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: -1, receivedAt: 10 })
    expect(after).toBe(state)
  })

  it('overwrites a previous lock rather than accumulating', () => {
    let state = playingState()
    state = gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: 0, receivedAt: 10 })
    state = gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: 1, receivedAt: 20 })
    expect(state.round!.locks.u1).toEqual({ userId: 'u1', gapIndex: 1, receivedAt: 20 })
  })

  it('rejects an unknown player', () => {
    const state = playingState()
    const after = gameReducer(state, { type: 'LOCK_GUESS', userId: 'ghost', gapIndex: 0, receivedAt: 10 })
    expect(after).toBe(state)
  })

  it('rejects a player ineligible during sudden death', () => {
    const state = playingState({
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: ['other'],
        startedAt: 0, shotClockMs: 25000, deadline: 25000, locks: {}, results: null,
      },
    })
    const after = gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: 0, receivedAt: 10 })
    expect(after).toBe(state)
  })

  it('no-ops outside the playing phase', () => {
    const state = playingState({ phase: 'locked' })
    expect(gameReducer(state, { type: 'LOCK_GUESS', userId: 'u1', gapIndex: 0, receivedAt: 10 })).toBe(state)
  })
})

describe('SHOT_CLOCK_EXPIRED', () => {
  it('moves playing -> locked', () => {
    const state = baseState({
      phase: 'playing',
      round: { index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null, startedAt: 0, shotClockMs: 25000, deadline: 25000, locks: {}, results: null },
    })
    expect(gameReducer(state, { type: 'SHOT_CLOCK_EXPIRED' }).phase).toBe('locked')
  })

  it('no-ops outside the playing phase', () => {
    const state = baseState({ phase: 'lobby' })
    expect(gameReducer(state, { type: 'SHOT_CLOCK_EXPIRED' })).toBe(state)
  })
})

describe('REVEAL_ROUND', () => {
  function lockedState(overrides: Partial<GameState> = {}): GameState {
    return baseState({
      phase: 'locked',
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000, locks: {}, results: null,
      },
      ...overrides,
    })
  }

  it('no-ops outside the locked phase', () => {
    const state = baseState({ phase: 'playing' })
    expect(gameReducer(state, { type: 'REVEAL_ROUND' })).toBe(state)
  })

  it('inserts a correctly-placed card into the sorted timeline', () => {
    const state = lockedState({
      players: { u1: player('u1', 'Alice', [
        { trackId: 't2', year: 1990, title: 'Song B', artist: 'Artist B' },
        { trackId: 't3', year: 2010, title: 'Song C', artist: 'Artist C' },
      ]) },
      playerOrder: ['u1'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000,
        locks: { u1: { userId: 'u1', gapIndex: 1, receivedAt: 10 } }, results: null,
      },
    })
    const after = gameReducer(state, { type: 'REVEAL_ROUND' })
    expect(after.players.u1.timeline.map((c) => c.year)).toEqual([1990, 2000, 2010])
    expect(after.round!.results!.u1.correct).toBe(true)
  })

  it('records a miss and leaves the timeline untouched on an incorrect guess', () => {
    const state = lockedState({
      players: { u1: player('u1', 'Alice') },
      playerOrder: ['u1'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000,
        locks: { u1: { userId: 'u1', gapIndex: 1, receivedAt: 10 } }, results: null,
      },
    })
    const after = gameReducer(state, { type: 'REVEAL_ROUND' })
    expect(after.players.u1.misses).toBe(1)
    expect(after.players.u1.timeline).toEqual([])
    expect(after.round!.results!.u1.correct).toBe(false)
  })

  it('declares a sole winner once a player reaches targetCards', () => {
    const state = lockedState({
      targetCards: 1,
      players: { u1: player('u1', 'Alice') },
      playerOrder: ['u1'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000,
        locks: { u1: { userId: 'u1', gapIndex: 0, receivedAt: 10 } }, results: null,
      },
    })
    const after = gameReducer(state, { type: 'REVEAL_ROUND' })
    expect(after.winnerUserIds).toEqual(['u1'])
    expect(after.suddenDeath).toBeNull()
  })

  it('opens sudden death when multiple players tie at the target with equal misses', () => {
    const state = lockedState({
      targetCards: 1,
      players: { u1: player('u1', 'Alice'), u2: player('u2', 'Bob') },
      playerOrder: ['u1', 'u2'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000,
        locks: {
          u1: { userId: 'u1', gapIndex: 0, receivedAt: 10 },
          u2: { userId: 'u2', gapIndex: 0, receivedAt: 10 },
        },
        results: null,
      },
    })
    const after = gameReducer(state, { type: 'REVEAL_ROUND' })
    expect(after.winnerUserIds).toEqual([])
    expect(after.suddenDeath).toEqual({ active: true, contenders: expect.arrayContaining(['u1', 'u2']) })
    expect(after.suddenDeath!.contenders).toHaveLength(2)
  })

  it('breaks a tie on cards by fewest misses', () => {
    const state = lockedState({
      targetCards: 1,
      players: { u1: player('u1', 'Alice', [], 0), u2: player('u2', 'Bob', [], 2) },
      playerOrder: ['u1', 'u2'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000,
        locks: {
          u1: { userId: 'u1', gapIndex: 0, receivedAt: 10 },
          u2: { userId: 'u2', gapIndex: 0, receivedAt: 10 },
        },
        results: null,
      },
    })
    const after = gameReducer(state, { type: 'REVEAL_ROUND' })
    expect(after.winnerUserIds).toEqual(['u1'])
  })

  describe('sudden-death round reveal', () => {
    it('a lone correct contender wins outright', () => {
      const state = lockedState({
        players: { u1: player('u1', 'Alice'), u2: player('u2', 'Bob') },
        playerOrder: ['u1', 'u2'],
        suddenDeath: { active: true, contenders: ['u1', 'u2'] },
        round: {
          index: 1, trackId: 't1', trueYear: 2000, eligibleUserIds: ['u1', 'u2'],
          startedAt: 0, shotClockMs: 25000, deadline: 25000,
          locks: {
            u1: { userId: 'u1', gapIndex: 0, receivedAt: 10 },
            u2: { userId: 'u2', gapIndex: 5, receivedAt: 10 }, // out of range on an empty timeline -> incorrect
          },
          results: null,
        },
      })
      const after = gameReducer(state, { type: 'REVEAL_ROUND' })
      expect(after.winnerUserIds).toEqual(['u1'])
      expect(after.suddenDeath).toBeNull()
    })

    it('leaves the contender pool unchanged when nobody in the pool guesses correctly', () => {
      const state = lockedState({
        players: { u1: player('u1', 'Alice'), u2: player('u2', 'Bob') },
        playerOrder: ['u1', 'u2'],
        suddenDeath: { active: true, contenders: ['u1', 'u2'] },
        round: {
          index: 1, trackId: 't1', trueYear: 2000, eligibleUserIds: ['u1', 'u2'],
          startedAt: 0, shotClockMs: 25000, deadline: 25000,
          locks: {
            u1: { userId: 'u1', gapIndex: 5, receivedAt: 10 },
            u2: { userId: 'u2', gapIndex: 5, receivedAt: 10 },
          },
          results: null,
        },
      })
      const after = gameReducer(state, { type: 'REVEAL_ROUND' })
      // Both missed, so both misses increment equally -- pool must stay the full
      // contender set, not empty out, and sudden death must remain active.
      expect(after.suddenDeath).not.toBeNull()
      expect(after.suddenDeath!.contenders.sort()).toEqual(['u1', 'u2'])
      expect(after.winnerUserIds).toEqual([])
    })
  })
})

describe('ADVANCE_ROUND', () => {
  function revealState(overrides: Partial<GameState> = {}): GameState {
    return baseState({
      phase: 'reveal',
      players: { u1: player('u1', 'Alice') },
      playerOrder: ['u1'],
      round: {
        index: 0, trackId: 't1', trueYear: 2000, eligibleUserIds: null,
        startedAt: 0, shotClockMs: 25000, deadline: 25000, locks: {},
        results: { u1: { userId: 'u1', correct: true, gapIndex: 0 } },
      },
      usedTrackIds: ['t1'],
      ...overrides,
    })
  }

  it('no-ops outside the reveal phase', () => {
    const state = baseState({ phase: 'playing' })
    expect(gameReducer(state, { type: 'ADVANCE_ROUND', at: 0 })).toBe(state)
  })

  it('archives the round and starts the next one when nobody has won', () => {
    const state = revealState()
    const after = gameReducer(state, { type: 'ADVANCE_ROUND', at: 0 })
    expect(after.roundHistory).toHaveLength(1)
    expect(after.phase).toBe('loading_track')
    expect(after.round).not.toBeNull()
  })

  it('ends the game once a winner has already been declared', () => {
    const state = revealState({ winnerUserIds: ['u1'] })
    const after = gameReducer(state, { type: 'ADVANCE_ROUND', at: 0 })
    expect(after.phase).toBe('game_over')
    expect(after.round).toBeNull()
  })
})

describe('RESET_GAME', () => {
  it('resets to a fresh lobby state, keeping the track pool', () => {
    const state = baseState({ phase: 'playing', players: { u1: player('u1', 'Alice') }, playerOrder: ['u1'] })
    const after = gameReducer(state, { type: 'RESET_GAME' })
    expect(after.phase).toBe('lobby')
    expect(after.players).toEqual({})
    expect(after.trackPool).toBe(trackPool)
  })
})
