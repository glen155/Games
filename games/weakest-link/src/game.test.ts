import { describe, expect, it } from 'vitest'
import { weakestLink } from './game'
import { questions } from './data/questions'

describe('weakestLink.createInitialState', () => {
  it('shuffles the question order without dropping or duplicating any question', () => {
    const state = weakestLink.createInitialState()
    expect(state.questions).toHaveLength(questions.length)
    expect(state.questions.map((q) => q.id).sort()).toEqual(questions.map((q) => q.id).sort())
  })

  it('does not always produce the same order across calls', () => {
    // Statistical sanity check, not a strict guarantee — with 75 questions the
    // odds of 20 independent shuffles all matching are astronomically small.
    const orders = new Set(
      Array.from({ length: 20 }, () => weakestLink.createInitialState().questions.map((q) => q.id).join('|')),
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('starts in the lobby with an empty roster', () => {
    const state = weakestLink.createInitialState()
    expect(state.phase).toBe('lobby')
    expect(state.playerOrder).toEqual([])
  })
})
