import { describe, expect, it } from 'vitest'
import { familyFeud } from './game'
import { rounds } from './data/rounds'

describe('familyFeud.createInitialState', () => {
  it('shuffles the round order without dropping or duplicating any round', () => {
    const state = familyFeud.createInitialState()
    expect(state.rounds).toHaveLength(rounds.length)
    expect(state.rounds.map((r) => r.name).sort()).toEqual(rounds.map((r) => r.name).sort())
  })

  it('does not always produce the same order across calls', () => {
    // Statistical sanity check, not a strict guarantee: with 45 rounds the
    // odds of 20 independent shuffles all matching the original order (or
    // each other) are astronomically small.
    const orders = new Set(
      Array.from({ length: 20 }, () => familyFeud.createInitialState().rounds.map((r) => r.name).join('|')),
    )
    expect(orders.size).toBeGreaterThan(1)
  })
})
