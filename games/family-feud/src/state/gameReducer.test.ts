import { describe, expect, it } from 'vitest'
import { MAX_STRIKES, captainOfTeam, gameReducer, initialState } from './gameReducer'
import type { Category, GameState } from '../types'
import type { PlayerPresence } from '@games/platform'

const rounds: Category[] = [
  {
    name: 'Round 1',
    answers: [
      { text: 'Answer A', points: 40 },
      { text: 'Answer B', points: 30 },
    ],
  },
  {
    name: 'Round 2',
    answers: [{ text: 'Answer C', points: 20 }],
  },
]

function fresh(): GameState {
  return initialState(rounds)
}

describe('REVEAL_ANSWER', () => {
  it('reveals the given index and adds its points to the pot', () => {
    const state = gameReducer(fresh(), { type: 'REVEAL_ANSWER', index: 0 })
    expect(state.revealed[0]).toBe(true)
    expect(state.pot).toBe(40)
  })

  it('accumulates the pot across multiple reveals', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 1 })
    expect(state.pot).toBe(70)
  })

  it('no-ops when the index is already revealed', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    const after = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    expect(after).toBe(state)
  })

  it('no-ops when the index is out of bounds', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'REVEAL_ANSWER', index: -1 })).toBe(state)
    expect(gameReducer(state, { type: 'REVEAL_ANSWER', index: 99 })).toBe(state)
  })
})

describe('STRIKE', () => {
  it('increments strikes and flips awaitingSteal once MAX_STRIKES is reached', () => {
    let state = fresh()
    for (let i = 0; i < MAX_STRIKES - 1; i += 1) {
      state = gameReducer(state, { type: 'STRIKE' })
      expect(state.awaitingSteal).toBe(false)
    }
    state = gameReducer(state, { type: 'STRIKE' })
    expect(state.strikes).toBe(MAX_STRIKES)
    expect(state.awaitingSteal).toBe(true)
  })

  it('no-ops once awaitingSteal is true, even below a literal strike cap', () => {
    let state = fresh()
    for (let i = 0; i < MAX_STRIKES; i += 1) {
      state = gameReducer(state, { type: 'STRIKE' })
    }
    const after = gameReducer(state, { type: 'STRIKE' })
    expect(after).toBe(state)
    expect(after.strikes).toBe(MAX_STRIKES)
  })
})

describe('AWARD_POINTS', () => {
  it('awards the pot to the given team and resets the pot', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    state = gameReducer(state, { type: 'AWARD_POINTS', team: 0 })
    expect(state.teams[0].score).toBe(40)
    expect(state.teams[1].score).toBe(0)
    expect(state.pot).toBe(0)
  })

  it('does not mutate the other team', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    state = gameReducer(state, { type: 'AWARD_POINTS', team: 1 })
    expect(state.teams[0].score).toBe(0)
    expect(state.teams[1].score).toBe(40)
  })
})

describe('RESOLVE_STEAL', () => {
  function toAwaitingSteal(activeTeam: 0 | 1 = 0): GameState {
    let state = fresh()
    state = gameReducer(state, { type: 'SET_ACTIVE_TEAM', team: activeTeam })
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    for (let i = 0; i < MAX_STRIKES; i += 1) {
      state = gameReducer(state, { type: 'STRIKE' })
    }
    expect(state.awaitingSteal).toBe(true)
    return state
  }

  it('awards the pot to the other team on a successful steal', () => {
    const state = toAwaitingSteal(0)
    const after = gameReducer(state, { type: 'RESOLVE_STEAL', success: true })
    expect(after.teams[1].score).toBe(40)
    expect(after.teams[0].score).toBe(0)
    expect(after.pot).toBe(0)
    expect(after.awaitingSteal).toBe(false)
  })

  it('awards the pot to the original team on a failed steal', () => {
    const state = toAwaitingSteal(0)
    const after = gameReducer(state, { type: 'RESOLVE_STEAL', success: false })
    expect(after.teams[0].score).toBe(40)
    expect(after.teams[1].score).toBe(0)
    expect(after.awaitingSteal).toBe(false)
  })

  it('no-ops when not awaiting a steal', () => {
    const state = fresh()
    const after = gameReducer(state, { type: 'RESOLVE_STEAL', success: true })
    expect(after).toBe(state)
  })
})

describe('SET_ACTIVE_TEAM / SET_TEAM_NAME', () => {
  it('sets the active team', () => {
    const state = gameReducer(fresh(), { type: 'SET_ACTIVE_TEAM', team: 1 })
    expect(state.activeTeam).toBe(1)
  })

  it('renames only the targeted team', () => {
    const state = gameReducer(fresh(), { type: 'SET_TEAM_NAME', team: 1, name: 'The Champs' })
    expect(state.teams[1].name).toBe('The Champs')
    expect(state.teams[0].name).toBe('Team 1')
  })
})

describe('round navigation (RESET_ROUND / NEXT_ROUND / PREV_ROUND)', () => {
  it('RESET_ROUND clears strikes, pot, and revealed state for the current round', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    state = gameReducer(state, { type: 'STRIKE' })
    state = gameReducer(state, { type: 'RESET_ROUND' })
    expect(state.currentRoundIndex).toBe(0)
    expect(state.strikes).toBe(0)
    expect(state.pot).toBe(0)
    expect(state.revealed.every((r) => r === false)).toBe(true)
    expect(state.isRoundOver).toBe(false)
  })

  it('NEXT_ROUND advances to the next round', () => {
    const state = gameReducer(fresh(), { type: 'NEXT_ROUND' })
    expect(state.currentRoundIndex).toBe(1)
    expect(state.isRoundOver).toBe(false)
  })

  it('NEXT_ROUND past the last round clamps the index but marks the round over', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'NEXT_ROUND' }) // -> index 1 (last round)
    state = gameReducer(state, { type: 'NEXT_ROUND' }) // -> would be index 2, out of bounds
    expect(state.currentRoundIndex).toBe(rounds.length - 1)
    expect(state.isRoundOver).toBe(true)
  })

  it('PREV_ROUND at index 0 stays clamped at 0 and does not mark the round over', () => {
    const state = gameReducer(fresh(), { type: 'PREV_ROUND' })
    expect(state.currentRoundIndex).toBe(0)
    expect(state.isRoundOver).toBe(false)
  })

  it('PREV_ROUND moves back a round from a later index', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'NEXT_ROUND' })
    state = gameReducer(state, { type: 'PREV_ROUND' })
    expect(state.currentRoundIndex).toBe(0)
  })
})

describe('RESET_GAME', () => {
  it('resets to a fresh initial state while keeping the rounds', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'REVEAL_ANSWER', index: 0 })
    state = gameReducer(state, { type: 'AWARD_POINTS', team: 0 })
    state = gameReducer(state, { type: 'RESET_GAME' })
    expect(state).toEqual(initialState(rounds))
  })
})

describe('ASSIGN_TEAM', () => {
  it('records a player-to-team assignment without clobbering existing ones', () => {
    let state = fresh()
    state = gameReducer(state, { type: 'ASSIGN_TEAM', userId: 'alice', team: 0 })
    state = gameReducer(state, { type: 'ASSIGN_TEAM', userId: 'bob', team: 1 })
    expect(state.teamAssignments).toEqual({ alice: 0, bob: 1 })
  })
})

describe('captainOfTeam', () => {
  function presence(userId: string, joinedAt: number): PlayerPresence {
    return { userId, nickname: userId, joinedAt }
  }

  it('returns the earliest joiner still assigned to the team', () => {
    const players = [presence('alice', 1), presence('bob', 2), presence('carol', 3)]
    const teamAssignments = { alice: 0 as const, bob: 0 as const, carol: 1 as const }
    expect(captainOfTeam(0, players, teamAssignments)).toBe('alice')
    expect(captainOfTeam(1, players, teamAssignments)).toBe('carol')
  })

  it('returns null for a team nobody has joined', () => {
    const players = [presence('alice', 1)]
    expect(captainOfTeam(1, players, { alice: 0 })).toBeNull()
  })

  it('shifts to the next earliest joiner when the captain switches teams', () => {
    const players = [presence('alice', 1), presence('bob', 2)]
    // Alice switches to team 1 — bob, having joined team 0 second, is now
    // the only (and therefore earliest) member left on team 0.
    const teamAssignments = { alice: 1 as const, bob: 0 as const }
    expect(captainOfTeam(0, players, teamAssignments)).toBe('bob')
    expect(captainOfTeam(1, players, teamAssignments)).toBe('alice')
  })

  it('shifts to the next earliest joiner when the captain disconnects', () => {
    // Alice joined first but is no longer present (dropped from `players`).
    const players = [presence('bob', 2), presence('carol', 3)]
    const teamAssignments = { alice: 0 as const, bob: 0 as const, carol: 0 as const }
    expect(captainOfTeam(0, players, teamAssignments)).toBe('bob')
  })
})

describe('BEGIN_GAME / SET_ROUNDS re-entrancy guards', () => {
  it('BEGIN_GAME sets gameStarted once', () => {
    const state = gameReducer(fresh(), { type: 'BEGIN_GAME' })
    expect(state.gameStarted).toBe(true)
  })

  it('BEGIN_GAME is a no-op once the game has already started', () => {
    const started = gameReducer(fresh(), { type: 'BEGIN_GAME' })
    const after = gameReducer(started, { type: 'BEGIN_GAME' })
    expect(after).toBe(started)
  })

  it('SET_ROUNDS replaces rounds and starts the game', () => {
    const newRounds: Category[] = [{ name: 'Custom', answers: [{ text: 'X', points: 10 }] }]
    const state = gameReducer(fresh(), { type: 'SET_ROUNDS', rounds: newRounds })
    expect(state.rounds).toBe(newRounds)
    expect(state.gameStarted).toBe(true)
  })

  it('SET_ROUNDS no-ops with an empty rounds array', () => {
    const state = fresh()
    const after = gameReducer(state, { type: 'SET_ROUNDS', rounds: [] })
    expect(after).toBe(state)
  })

  it('SET_ROUNDS no-ops once the game has already started', () => {
    const started = gameReducer(fresh(), { type: 'BEGIN_GAME' })
    const newRounds: Category[] = [{ name: 'Custom', answers: [{ text: 'X', points: 10 }] }]
    const after = gameReducer(started, { type: 'SET_ROUNDS', rounds: newRounds })
    expect(after).toBe(started)
  })
})
