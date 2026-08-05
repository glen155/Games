import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTING_POOL, gameReducer, initialState } from './gameReducer'
import type { GameState, QuestionTier } from '../types'

const questions: QuestionTier[] = [
  { prompt: 'Q1', options: ['a', 'b', 'c', 'd'], correctIndex: 0, percent: 80 },
  { prompt: 'Q2', options: ['a', 'b', 'c', 'd'], correctIndex: 1, percent: 0.4 },
]

// A longer ladder (7 tiers, indices 0-6) for exercising Pass eligibility,
// which only opens up from tier index MIN_PASS_TIER_INDEX (4) onward and
// closes again on the final tier (index 6 here).
const passLadder: QuestionTier[] = Array.from({ length: 7 }, (_, i) => ({
  prompt: `Q${i}`,
  options: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correctIndex: 0 as const,
  percent: 90 - i * 10,
}))

function fresh(): GameState {
  return initialState(questions)
}

function playing(jackpotAmount = 500): GameState {
  return gameReducer(fresh(), { type: 'START_GAME', jackpotAmount })
}

function playingPassLadder(): GameState {
  return gameReducer(initialState(passLadder), { type: 'START_GAME', jackpotAmount: 500 })
}

/** Advances an empty-lobby game forward with no player answers/passes, tier by tier. */
function advanceToTier(state: GameState, targetIndex: number): GameState {
  let next = state
  while (next.currentTierIndex < targetIndex) {
    next = gameReducer(next, { type: 'REVEAL_TIER' })
    next = gameReducer(next, { type: 'NEXT_TIER' })
  }
  return next
}

describe('START_GAME', () => {
  it('transitions setup -> playing and resets per-run fields', () => {
    const state = playing(500)
    expect(state.phase).toBe('playing')
    expect(state.jackpotAmount).toBe(500)
    expect(state.poolRemaining).toBe(STARTING_POOL)
    expect(state.currentTierIndex).toBe(0)
  })

  it('no-ops with a non-positive jackpot amount', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'START_GAME', jackpotAmount: 0 })).toBe(state)
    expect(gameReducer(state, { type: 'START_GAME', jackpotAmount: -10 })).toBe(state)
  })

  it('no-ops when not in the setup phase', () => {
    const state = playing()
    const after = gameReducer(state, { type: 'START_GAME', jackpotAmount: 999 })
    expect(after).toBe(state)
  })
})

describe('SELECT_OPTION / CONFIRM_ANSWER', () => {
  it('SELECT_OPTION is ignored outside the playing phase', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'SELECT_OPTION', index: 1 })).toBe(state)
  })

  it('CONFIRM_ANSWER is ignored with no option selected', () => {
    const state = playing()
    expect(gameReducer(state, { type: 'CONFIRM_ANSWER' })).toBe(state)
  })

  it('computes pool remaining from tier percent on a correct answer', () => {
    let state = playing()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 }) // correct for tier 0
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    expect(state.phase).toBe('reveal')
    expect(state.lastAnswerCorrect).toBe(true)
    expect(state.poolRemaining).toBe(80) // round(100 * 80/100)
  })

  it('leaves pool remaining untouched on an incorrect answer', () => {
    let state = playing()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 3 }) // wrong for tier 0
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    expect(state.lastAnswerCorrect).toBe(false)
    expect(state.poolRemaining).toBe(STARTING_POOL)
  })

  it('floors pool remaining at 1 when the tier percent rounds to 0', () => {
    let state = gameReducer(playing(), { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' }) // move to tier 1 (percent: 0.4)
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 1 }) // correct for tier 1
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    expect(state.poolRemaining).toBe(1)
  })
})

describe('ADVANCE', () => {
  it('moves to eliminated on an incorrect answer', () => {
    let state = playing()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 3 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.phase).toBe('eliminated')
    expect(state.eliminatedAtTierIndex).toBe(0)
  })

  it('advances to the next tier on a correct answer before the last tier', () => {
    let state = playing()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.phase).toBe('playing')
    expect(state.currentTierIndex).toBe(1)
    expect(state.selectedOptionIndex).toBeNull()
  })

  it('reaching the last tier correctly ends in "won" (solo path)', () => {
    let state = playing()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' }) // -> tier 1
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 1 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' }) // last tier correct
    expect(state.phase).toBe('won')
  })

  it('is ignored outside the reveal phase', () => {
    const state = playing()
    expect(gameReducer(state, { type: 'ADVANCE' })).toBe(state)
  })
})

describe('hosted mode: PLAYER_ANSWER / REVEAL_TIER / NEXT_TIER', () => {
  it('PLAYER_ANSWER records a pick while playing', () => {
    const state = gameReducer(playing(), {
      type: 'PLAYER_ANSWER',
      userId: 'u1',
      nickname: 'Alice',
      index: 2,
    })
    expect(state.playerAnswers.u1).toEqual({ nickname: 'Alice', index: 2 })
  })

  it('REVEAL_TIER scores each player and tracks who is out of the running', () => {
    let state = playing()
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u2', nickname: 'Bob', index: 3 })
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    expect(state.phase).toBe('reveal')
    expect(state.lastPlayerResults?.u1.correct).toBe(true)
    expect(state.lastPlayerResults?.u2.correct).toBe(false)
    expect(state.playerCorrectCounts.u1).toBe(1)
    expect(state.outOfRunningIds).toEqual(['u2'])
  })

  it('REVEAL_TIER computes pool from the simulated crowd regardless of real player correctness', () => {
    // No players answered at all -- pool math must still fire from tier.percent alone.
    const state = gameReducer(playing(), { type: 'REVEAL_TIER' })
    expect(state.poolRemaining).toBe(80)
  })

  it('outOfRunningIds is a one-way ratchet: repeat wrong answers do not duplicate an id', () => {
    let state = playing()
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 3 })
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    state = gameReducer(state, { type: 'NEXT_TIER' })
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    expect(state.outOfRunningIds).toEqual(['u1'])
  })

  it('NEXT_TIER on the last tier ends hosted play in "ended", not "won"', () => {
    let state = playing()
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    state = gameReducer(state, { type: 'NEXT_TIER' }) // -> tier 1
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    state = gameReducer(state, { type: 'NEXT_TIER' }) // last tier revealed -> ended
    expect(state.phase).toBe('ended')
  })

  it('NEXT_TIER before the last tier clears per-tier player state and resumes play', () => {
    let state = playing()
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    state = gameReducer(state, { type: 'NEXT_TIER' })
    expect(state.phase).toBe('playing')
    expect(state.currentTierIndex).toBe(1)
    expect(state.playerAnswers).toEqual({})
    expect(state.lastPlayerResults).toBeNull()
  })
})

describe('PLAYER_PASS (hosted mode)', () => {
  it('rejects a pass before the eligible tier range (tiers 0-3)', () => {
    const state = playingPassLadder()
    const after = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    expect(after).toBe(state)
  })

  it('accepts a pass from tier index 4 (the 50% tier) onward', () => {
    const state = advanceToTier(playingPassLadder(), 4)
    const after = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    expect(after.playerPasses.u1).toEqual({ nickname: 'Alice' })
    expect(after.passUsedIds).toEqual(['u1'])
  })

  it('rejects a pass on the final tier', () => {
    const state = advanceToTier(playingPassLadder(), 6) // last tier, index 6
    const after = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    expect(after).toBe(state)
  })

  it('enforces one pass per player per game', () => {
    let state = advanceToTier(playingPassLadder(), 4)
    state = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    state = gameReducer(state, { type: 'NEXT_TIER' }) // -> tier 5, still eligible
    const after = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    expect(after).toBe(state)
  })

  it('is mutually exclusive with PLAYER_ANSWER for the same tier', () => {
    let state = advanceToTier(playingPassLadder(), 4)
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    expect(state.playerAnswers.u1).toBeUndefined()
    expect(state.playerPasses.u1).toEqual({ nickname: 'Alice' })

    // Answering back cancels the pass but does NOT refund the used-pass slot.
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    expect(state.playerPasses.u1).toBeUndefined()
    expect(state.playerAnswers.u1).toEqual({ nickname: 'Alice', index: 0 })
    expect(state.passUsedIds).toEqual(['u1'])
  })

  it('REVEAL_TIER marks a passed player as passed, not correct or wrong, without eliminating them', () => {
    let state = advanceToTier(playingPassLadder(), 4)
    state = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u2', nickname: 'Bob', index: 1 }) // wrong
    state = gameReducer(state, { type: 'REVEAL_TIER' })

    expect(state.lastPlayerResults?.u1).toEqual({ nickname: 'Alice', index: -1, correct: false, passed: true })
    expect(state.outOfRunningIds).toEqual(['u2'])
    expect(state.playerCorrectCounts.u1).toBeUndefined()
  })

  it('clears playerPasses on NEXT_TIER but keeps passUsedIds', () => {
    let state = advanceToTier(playingPassLadder(), 4)
    state = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    state = gameReducer(state, { type: 'REVEAL_TIER' })
    state = gameReducer(state, { type: 'NEXT_TIER' })
    expect(state.playerPasses).toEqual({})
    expect(state.passUsedIds).toEqual(['u1'])
  })

  it('resets passUsedIds on RESTART', () => {
    let state = advanceToTier(playingPassLadder(), 4)
    state = gameReducer(state, { type: 'PLAYER_PASS', userId: 'u1', nickname: 'Alice' })
    state = gameReducer(state, { type: 'RESTART' })
    expect(state.passUsedIds).toEqual([])
    expect(state.playerPasses).toEqual({})
  })
})

describe('SET_TIMER_CONFIG / START_TIMER / CLEAR_TIMER', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rejects a non-positive duration', () => {
    const state = fresh()
    const after = gameReducer(state, { type: 'SET_TIMER_CONFIG', mode: 'auto', durationSeconds: 0 })
    expect(after).toBe(state)
  })

  it('updates the timer config', () => {
    const state = gameReducer(fresh(), { type: 'SET_TIMER_CONFIG', mode: 'manual', durationSeconds: 15 })
    expect(state.timerConfig).toEqual({ mode: 'manual', durationSeconds: 15 })
  })

  it('START_TIMER sets an absolute deadline while playing', () => {
    const state = gameReducer(playing(), { type: 'START_TIMER' })
    expect(state.timerEndsAt).toBe(Date.now() + 30_000)
  })

  it('START_TIMER is ignored outside the playing phase', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'START_TIMER' })).toBe(state)
  })

  it('CLEAR_TIMER nulls out the deadline while playing', () => {
    let state = gameReducer(playing(), { type: 'START_TIMER' })
    state = gameReducer(state, { type: 'CLEAR_TIMER' })
    expect(state.timerEndsAt).toBeNull()
  })

  it('START_GAME computes an initial deadline for auto mode and null for manual mode', () => {
    const auto = gameReducer(fresh(), { type: 'START_GAME', jackpotAmount: 100 })
    expect(auto.timerEndsAt).toBe(Date.now() + 30_000)

    const manualSetup = gameReducer(fresh(), {
      type: 'SET_TIMER_CONFIG',
      mode: 'manual',
      durationSeconds: 20,
    })
    const manual = gameReducer(manualSetup, { type: 'START_GAME', jackpotAmount: 100 })
    expect(manual.timerEndsAt).toBeNull()
  })
})

describe('SET_QUESTIONS', () => {
  it('replaces questions during setup', () => {
    const newQuestions: QuestionTier[] = [
      { prompt: 'New', options: ['a', 'b', 'c', 'd'], correctIndex: 0, percent: 50 },
    ]
    const state = gameReducer(fresh(), { type: 'SET_QUESTIONS', questions: newQuestions })
    expect(state.questions).toBe(newQuestions)
  })

  it('no-ops with an empty questions array', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'SET_QUESTIONS', questions: [] })).toBe(state)
  })

  it('no-ops outside the setup phase', () => {
    const state = playing()
    const newQuestions: QuestionTier[] = [
      { prompt: 'New', options: ['a', 'b', 'c', 'd'], correctIndex: 0, percent: 50 },
    ]
    expect(gameReducer(state, { type: 'SET_QUESTIONS', questions: newQuestions })).toBe(state)
  })
})

describe('RESTART', () => {
  it('resets fully back to a fresh setup state, keeping the question list', () => {
    let state = playing()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'RESTART' })
    expect(state).toEqual(initialState(questions))
  })
})
