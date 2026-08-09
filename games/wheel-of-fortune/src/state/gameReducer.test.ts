import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ROUND_COUNT,
  captainOfTeam,
  currentPuzzle,
  gameReducer,
  initialState,
  normalize,
  shuffle,
} from './gameReducer'
import { WHEEL } from '../data/wheel'
import type { GameState, Puzzle, TeamId } from '../types'
import type { WheelAction } from './gameReducer'
import type { PlayerPresence } from '@games/platform'

const puzzles: Puzzle[] = [
  { id: 't1', category: 'Test', solution: 'CAT' },
  { id: 't2', category: 'Test', solution: 'DOG' },
  { id: 't3', category: 'Test', solution: 'BIRD' },
]

function fresh(): GameState {
  return initialState(puzzles)
}

function apply(state: GameState, ...actions: WheelAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

function join(state: GameState, userId: string, team: TeamId): GameState {
  return gameReducer(state, { type: 'ASSIGN_TEAM', userId, team })
}

/** Alice on team 0, bob on team 1, game started, team 0 active by default. */
function started(): GameState {
  let state = fresh()
  state = join(state, 'alice', 0)
  state = join(state, 'bob', 1)
  return gameReducer(state, { type: 'BEGIN_GAME' })
}

/** Forces the next SPIN to land on the wedge at `index` in WHEEL. */
function mockSpinIndex(index: number) {
  vi.spyOn(Math, 'random').mockReturnValue(index / WHEEL.length)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ASSIGN_TEAM / SET_TEAM_NAME / BEGIN_GAME', () => {
  it('records a team assignment', () => {
    const state = join(fresh(), 'alice', 0)
    expect(state.teamAssignments.alice).toBe(0)
  })

  it('renames only the targeted team', () => {
    const state = gameReducer(fresh(), { type: 'SET_TEAM_NAME', team: 1, name: 'The Champs' })
    expect(state.teams[1].name).toBe('The Champs')
    expect(state.teams[0].name).toBe('Team 1')
  })

  it('BEGIN_GAME moves from setup to playing, and is a no-op once already playing', () => {
    const state = started()
    expect(state.phase).toBe('playing')
    const after = gameReducer(state, { type: 'BEGIN_GAME' })
    expect(after).toBe(state)
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

  it('shifts to the next earliest joiner when the captain switches teams or disconnects', () => {
    const players = [presence('bob', 2), presence('carol', 3)]
    const teamAssignments = { alice: 0 as const, bob: 0 as const, carol: 0 as const }
    expect(captainOfTeam(0, players, teamAssignments)).toBe('bob')
  })
})

describe('SPIN', () => {
  it('no-ops for anyone not on the active team', () => {
    const state = started()
    const after = gameReducer(state, { type: 'SPIN', userId: 'bob' })
    expect(after).toBe(state)
  })

  it('no-ops while a cash spin is already pending', () => {
    const cashIndex = WHEEL.findIndex((w) => w.type === 'cash')
    mockSpinIndex(cashIndex)
    let state = started()
    state = gameReducer(state, { type: 'SPIN', userId: 'alice' })
    const after = gameReducer(state, { type: 'SPIN', userId: 'alice' })
    expect(after).toBe(state)
  })

  it('landing on a cash wedge sets a pending spinResult without changing the active team', () => {
    const cashIndex = WHEEL.findIndex((w) => w.type === 'cash')
    mockSpinIndex(cashIndex)
    const state = gameReducer(started(), { type: 'SPIN', userId: 'alice' })
    expect(state.spinResult).toEqual(WHEEL[cashIndex])
    expect(state.lastSpin).toEqual(WHEEL[cashIndex])
    expect(state.spinSeq).toBe(1)
    expect(state.activeTeam).toBe(0)
  })

  it('landing on Bankrupt zeroes the round pot and passes the turn immediately', () => {
    const bankruptIndex = WHEEL.findIndex((w) => w.type === 'bankrupt')
    mockSpinIndex(bankruptIndex)
    let state = started()
    // Give team 0 some money first via a direct cash spin + guess.
    const cashIndex = WHEEL.findIndex((w) => w.type === 'cash')
    mockSpinIndex(cashIndex)
    state = gameReducer(state, { type: 'SPIN', userId: 'alice' })
    state = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'C' })
    expect(state.roundPot).toBeGreaterThan(0)

    mockSpinIndex(bankruptIndex)
    state = gameReducer(state, { type: 'SPIN', userId: 'alice' })
    expect(state.roundPot).toBe(0)
    expect(state.spinResult).toBeNull()
    expect(state.activeTeam).toBe(1)
    expect(state.lastSpin).toEqual({ type: 'bankrupt' })
  })

  it('landing on Lose a Turn passes the turn without touching the pot', () => {
    const loseTurnIndex = WHEEL.findIndex((w) => w.type === 'lose-turn')
    mockSpinIndex(loseTurnIndex)
    const state = gameReducer(started(), { type: 'SPIN', userId: 'alice' })
    expect(state.roundPot).toBe(0)
    expect(state.activeTeam).toBe(1)
    expect(state.spinResult).toBeNull()
  })
})

describe('GUESS_LETTER', () => {
  function toCashPending(): GameState {
    const cashIndex = WHEEL.findIndex((w) => w.type === 'cash')
    mockSpinIndex(cashIndex)
    return gameReducer(started(), { type: 'SPIN', userId: 'alice' })
  }

  it('no-ops with no pending spin', () => {
    const state = started()
    const after = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'C' })
    expect(after).toBe(state)
  })

  it('no-ops for a vowel', () => {
    const state = toCashPending()
    const after = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'A' })
    expect(after).toBe(state)
  })

  it('no-ops for a letter already guessed', () => {
    const state = toCashPending()
    const guessed = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'C' })
    // Spin again (same mocked wedge) so a cash guess is pending once more.
    const pendingAgain = gameReducer(guessed, { type: 'SPIN', userId: 'alice' })
    const after = gameReducer(pendingAgain, { type: 'GUESS_LETTER', userId: 'alice', letter: 'C' })
    expect(after).toBe(pendingAgain)
  })

  it('a correct guess reveals the letter, adds value × occurrences, and keeps the turn', () => {
    const state = toCashPending()
    const value = state.spinResult!.value
    const after = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'C' })
    expect(after.guessedLetters).toContain('C')
    expect(after.roundPot).toBe(value) // 'C' appears once in "CAT"
    expect(after.spinResult).toBeNull()
    expect(after.activeTeam).toBe(0) // turn retained
  })

  it('a wrong guess passes the turn and adds nothing', () => {
    const state = toCashPending()
    const after = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'Z' })
    expect(after.roundPot).toBe(0)
    expect(after.activeTeam).toBe(1)
    expect(after.spinResult).toBeNull()
  })

  it('auto-resolves the round once every letter in the solution is revealed', () => {
    let state = toCashPending()
    state = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'C' })
    state = apply(state, { type: 'SPIN', userId: 'alice' })
    state = gameReducer(state, { type: 'GUESS_LETTER', userId: 'alice', letter: 'T' })
    // "CAT" has one vowel (A) left — buy it to finish revealing.
    state = gameReducer(state, { type: 'BUY_VOWEL', userId: 'alice', letter: 'A' })
    expect(state.phase).toBe('puzzle-solved')
    expect(state.lastRoundWinner).toBe(0)
    expect(state.solvedSolution).toBe('CAT')
  })
})

describe('BUY_VOWEL', () => {
  it('no-ops while a cash spin is pending', () => {
    const cashIndex = WHEEL.findIndex((w) => w.type === 'cash')
    mockSpinIndex(cashIndex)
    const state = gameReducer(started(), { type: 'SPIN', userId: 'alice' })
    const after = gameReducer(state, { type: 'BUY_VOWEL', userId: 'alice', letter: 'A' })
    expect(after).toBe(state)
  })

  it('no-ops when the round pot cannot afford it', () => {
    const state = started()
    expect(state.roundPot).toBe(0)
    const after = gameReducer(state, { type: 'BUY_VOWEL', userId: 'alice', letter: 'A' })
    expect(after).toBe(state)
  })

  it('no-ops for a consonant', () => {
    let state = started()
    state = { ...state, roundPot: 1000 }
    const after = gameReducer(state, { type: 'BUY_VOWEL', userId: 'alice', letter: 'C' })
    expect(after).toBe(state)
  })

  it('deducts the cost and reveals the vowel when present, keeping the turn', () => {
    let state = started()
    state = { ...state, roundPot: 1000 }
    const after = gameReducer(state, { type: 'BUY_VOWEL', userId: 'alice', letter: 'A' })
    expect(after.roundPot).toBe(1000 - 250)
    expect(after.guessedLetters).toContain('A')
    expect(after.activeTeam).toBe(0)
  })

  it('deducts the cost even when the vowel is absent, and passes the turn', () => {
    let state = started()
    state = { ...state, roundPot: 1000 }
    // "CAT" has no 'O'.
    const after = gameReducer(state, { type: 'BUY_VOWEL', userId: 'alice', letter: 'O' })
    expect(after.roundPot).toBe(1000 - 250)
    expect(after.activeTeam).toBe(1)
  })
})

describe('SOLVE', () => {
  it('no-ops while a cash spin is pending', () => {
    const cashIndex = WHEEL.findIndex((w) => w.type === 'cash')
    mockSpinIndex(cashIndex)
    const state = gameReducer(started(), { type: 'SPIN', userId: 'alice' })
    const after = gameReducer(state, { type: 'SOLVE', userId: 'alice', guess: 'CAT' })
    expect(after).toBe(state)
  })

  it('no-ops for anyone not on the active team', () => {
    const state = started()
    const after = gameReducer(state, { type: 'SOLVE', userId: 'bob', guess: 'CAT' })
    expect(after).toBe(state)
  })

  it('a correct solve banks the round pot and ends the round', () => {
    let state = started()
    state = { ...state, roundPot: 750 }
    const after = gameReducer(state, { type: 'SOLVE', userId: 'alice', guess: 'CAT' })
    expect(after.phase).toBe('puzzle-solved')
    expect(after.teams[0].score).toBe(750)
    expect(after.roundPot).toBe(0)
    expect(after.lastRoundWinner).toBe(0)
    expect(after.solvedSolution).toBe('CAT')
  })

  it('tolerates case, punctuation, and extra whitespace', () => {
    const state = started()
    const solution = currentPuzzle(state).solution
    const messyGuess = `  ${solution.toLowerCase()}!!  `.replace(/ /g, '   ')
    const after = gameReducer(state, { type: 'SOLVE', userId: 'alice', guess: messyGuess })
    expect(after.phase).toBe('puzzle-solved')
  })

  it('an incorrect solve passes the turn without ending the round', () => {
    const state = started()
    const after = gameReducer(state, { type: 'SOLVE', userId: 'alice', guess: 'WRONG' })
    expect(after.phase).toBe('playing')
    expect(after.activeTeam).toBe(1)
  })
})

describe('NEXT_ROUND', () => {
  function solvedState(): GameState {
    let state = started()
    state = { ...state, roundPot: 500 }
    return gameReducer(state, { type: 'SOLVE', userId: 'alice', guess: 'CAT' })
  }

  it('no-ops unless the current round is solved', () => {
    const state = started()
    const after = gameReducer(state, { type: 'NEXT_ROUND' })
    expect(after).toBe(state)
  })

  it('advances to the next puzzle, resets round fields, and alternates the starting team', () => {
    const state = gameReducer(solvedState(), { type: 'NEXT_ROUND' })
    expect(state.phase).toBe('playing')
    expect(state.roundNumber).toBe(2)
    expect(state.puzzleIndex).toBe(1)
    expect(state.activeTeam).toBe(1)
    expect(state.roundPot).toBe(0)
    expect(state.guessedLetters).toEqual([])
    expect(state.lastRoundWinner).toBeNull()
  })

  it('ends the game after ROUND_COUNT rounds', () => {
    let state = solvedState()
    for (let round = 1; round < ROUND_COUNT; round += 1) {
      state = gameReducer(state, { type: 'NEXT_ROUND' })
      state = { ...state, roundPot: 100 }
      state = gameReducer(state, { type: 'SOLVE', userId: state.teamAssignments.alice === state.activeTeam ? 'alice' : 'bob', guess: currentPuzzle(state).solution })
    }
    expect(state.roundNumber).toBe(ROUND_COUNT)
    state = gameReducer(state, { type: 'NEXT_ROUND' })
    expect(state.phase).toBe('game-over')
  })
})

describe('RESET_GAME', () => {
  it('returns to a fresh setup state with the same puzzle pool, reshuffled', () => {
    const state = gameReducer(started(), { type: 'RESET_GAME' })
    expect(state.phase).toBe('setup')
    expect(state.puzzles.map((p) => p.id).sort()).toEqual(puzzles.map((p) => p.id).sort())
    expect(state).toEqual({ ...initialState(puzzles), puzzles: state.puzzles })
  })
})

describe('shuffle', () => {
  it('returns a permutation with the same elements without mutating the input', () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    const original = [...items]
    const shuffled = shuffle(items)
    expect(shuffled).toHaveLength(items.length)
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items)
    expect(items).toEqual(original)
  })

  it('does not always produce the same order across calls', () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    const orders = new Set(Array.from({ length: 20 }, () => shuffle(items).join('|')))
    expect(orders.size).toBeGreaterThan(1)
  })
})

describe('normalize', () => {
  it('uppercases, strips punctuation, and collapses whitespace', () => {
    expect(normalize("  jurassic   park-avenue!! ")).toBe('JURASSIC PARK AVENUE')
    expect(normalize('Star Wars & Peace')).toBe('STAR WARS PEACE')
  })
})
