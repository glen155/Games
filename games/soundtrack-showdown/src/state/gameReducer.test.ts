import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameReducer, initialState } from './gameReducer'
import type { GameState, SoundtrackClue } from '../types'

function clue(id: string, correctIndex: 0 | 1 | 2 | 3): SoundtrackClue {
  return {
    id,
    spotifyUri: `spotify:track:${id}`,
    spotifyUrl: `https://open.spotify.com/track/${id}`,
    cueTitle: `Theme ${id}`,
    performedBy: 'Composer',
    mediaType: 'movie',
    correctTitle: 'Right Answer',
    options: ['a', 'b', 'c', 'd'],
    correctIndex,
  }
}

const clues: SoundtrackClue[] = [clue('c0', 0), clue('c1', 1)]

function fresh(): GameState {
  return initialState(clues)
}

function loadingClue(): GameState {
  return gameReducer(fresh(), { type: 'START_GAME' })
}

function answering(): GameState {
  return gameReducer(loadingClue(), { type: 'HOST_CONFIRMED_PLAYING' })
}

describe('START_GAME', () => {
  it('transitions setup -> loading_clue and resets per-run fields', () => {
    const state = loadingClue()
    expect(state.phase).toBe('loading_clue')
    expect(state.currentClueIndex).toBe(0)
    expect(state.soloCorrectCount).toBe(0)
  })

  it('no-ops with no clues', () => {
    const state = initialState([])
    expect(gameReducer(state, { type: 'START_GAME' })).toBe(state)
  })

  it('no-ops outside the setup phase', () => {
    const state = loadingClue()
    expect(gameReducer(state, { type: 'START_GAME' })).toBe(state)
  })
})

describe('HOST_CONFIRMED_PLAYING', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('moves loading_clue -> answering and starts the auto timer', () => {
    const state = answering()
    expect(state.phase).toBe('answering')
    expect(state.timerEndsAt).toBe(Date.now() + 20_000)
  })

  it('no-ops outside loading_clue', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'HOST_CONFIRMED_PLAYING' })).toBe(state)
  })
})

describe('SELECT_OPTION / CONFIRM_ANSWER (solo)', () => {
  it('SELECT_OPTION is ignored outside answering', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'SELECT_OPTION', index: 1 })).toBe(state)
  })

  it('CONFIRM_ANSWER is ignored with no option selected', () => {
    const state = answering()
    expect(gameReducer(state, { type: 'CONFIRM_ANSWER' })).toBe(state)
  })

  it('scores a correct answer and increments soloCorrectCount', () => {
    let state = answering()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    expect(state.phase).toBe('reveal')
    expect(state.lastAnswerCorrect).toBe(true)
    expect(state.soloCorrectCount).toBe(1)
  })

  it('leaves soloCorrectCount unchanged on an incorrect answer', () => {
    let state = answering()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 3 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    expect(state.lastAnswerCorrect).toBe(false)
    expect(state.soloCorrectCount).toBe(0)
  })
})

describe('ADVANCE (solo)', () => {
  it('moves to the next clue before the last one', () => {
    let state = answering()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.phase).toBe('loading_clue')
    expect(state.currentClueIndex).toBe(1)
    expect(state.selectedOptionIndex).toBeNull()
  })

  it('ends in "summary" after the last clue', () => {
    let state = answering()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' }) // -> clue 1
    state = gameReducer(state, { type: 'HOST_CONFIRMED_PLAYING' })
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 1 })
    state = gameReducer(state, { type: 'CONFIRM_ANSWER' })
    state = gameReducer(state, { type: 'ADVANCE' })
    expect(state.phase).toBe('summary')
  })

  it('is ignored outside the reveal phase', () => {
    const state = answering()
    expect(gameReducer(state, { type: 'ADVANCE' })).toBe(state)
  })
})

describe('hosted mode: PLAYER_ANSWER / REVEAL_CLUE / NEXT_CLUE (multiple_choice)', () => {
  it('PLAYER_ANSWER records a pick while answering', () => {
    const state = gameReducer(answering(), {
      type: 'PLAYER_ANSWER',
      userId: 'u1',
      nickname: 'Alice',
      index: 0,
    })
    expect(state.playerAnswers.u1).toEqual({ nickname: 'Alice', index: 0 })
  })

  it('REVEAL_CLUE auto-scores every submitted answer', () => {
    let state = answering()
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u2', nickname: 'Bob', index: 3 })
    state = gameReducer(state, { type: 'REVEAL_CLUE' })
    expect(state.phase).toBe('reveal')
    expect(state.lastPlayerResults?.u1.correct).toBe(true)
    expect(state.lastPlayerResults?.u2.correct).toBe(false)
    expect(state.playerCorrectCounts.u1).toBe(1)
    expect(state.playerCorrectCounts.u2).toBeUndefined()
  })

  it('NEXT_CLUE clears per-clue player state and resumes on non-last clues', () => {
    let state = answering()
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'REVEAL_CLUE' })
    state = gameReducer(state, { type: 'NEXT_CLUE' })
    expect(state.phase).toBe('loading_clue')
    expect(state.currentClueIndex).toBe(1)
    expect(state.playerAnswers).toEqual({})
    expect(state.lastPlayerResults).toBeNull()
  })

  it('NEXT_CLUE on the last clue ends hosted play in "ended"', () => {
    let state = answering()
    state = gameReducer(state, { type: 'REVEAL_CLUE' })
    state = gameReducer(state, { type: 'NEXT_CLUE' }) // -> clue 1
    state = gameReducer(state, { type: 'HOST_CONFIRMED_PLAYING' })
    state = gameReducer(state, { type: 'REVEAL_CLUE' })
    state = gameReducer(state, { type: 'NEXT_CLUE' })
    expect(state.phase).toBe('ended')
  })
})

describe('open_guess mode', () => {
  function answeringOpenGuess(): GameState {
    let state = gameReducer(fresh(), { type: 'SET_ANSWER_STYLE', answerStyle: 'open_guess' })
    state = gameReducer(state, { type: 'START_GAME' })
    state = gameReducer(state, { type: 'HOST_CONFIRMED_PLAYING' })
    return state
  }

  it('REVEAL_CLUE skips auto-scoring entirely, even with submitted answers', () => {
    let state = answeringOpenGuess()
    state = gameReducer(state, { type: 'PLAYER_ANSWER', userId: 'u1', nickname: 'Alice', index: 0 })
    state = gameReducer(state, { type: 'REVEAL_CLUE' })
    expect(state.phase).toBe('reveal')
    expect(state.lastPlayerResults).toEqual({})
    expect(state.playerCorrectCounts).toEqual({})
  })

  describe('HOST_MARK_PLAYER', () => {
    function revealed(): GameState {
      return gameReducer(answeringOpenGuess(), { type: 'REVEAL_CLUE' })
    }

    it('awards a correct mark', () => {
      const state = gameReducer(revealed(), {
        type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true,
      })
      expect(state.playerCorrectCounts.u1).toBe(1)
      expect(state.lastPlayerResults?.u1).toEqual({ nickname: 'Alice', index: null, correct: true })
    })

    it('re-marking the same verdict is idempotent', () => {
      let state = gameReducer(revealed(), {
        type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true,
      })
      state = gameReducer(state, { type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true })
      expect(state.playerCorrectCounts.u1).toBe(1)
    })

    it('toggling correct -> incorrect -> correct returns to the original count', () => {
      let state = gameReducer(revealed(), {
        type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true,
      })
      state = gameReducer(state, { type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: false })
      expect(state.playerCorrectCounts.u1).toBe(0)
      state = gameReducer(state, { type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true })
      expect(state.playerCorrectCounts.u1).toBe(1)
    })

    it('clamps at 0 rather than going negative', () => {
      const state: GameState = {
        ...revealed(),
        lastPlayerResults: { u1: { nickname: 'Alice', index: null, correct: true } },
        playerCorrectCounts: {},
      }
      const after = gameReducer(state, { type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: false })
      expect(after.playerCorrectCounts.u1).toBe(0)
    })

    it('no-ops when answerStyle is multiple_choice', () => {
      const state = gameReducer(answering(), { type: 'REVEAL_CLUE' })
      const after = gameReducer(state, { type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true })
      expect(after).toBe(state)
    })

    it('no-ops outside the reveal phase', () => {
      const state = answeringOpenGuess()
      const after = gameReducer(state, { type: 'HOST_MARK_PLAYER', userId: 'u1', nickname: 'Alice', correct: true })
      expect(after).toBe(state)
    })
  })
})

describe('SET_ANSWER_STYLE', () => {
  it('is settable during setup', () => {
    const state = gameReducer(fresh(), { type: 'SET_ANSWER_STYLE', answerStyle: 'open_guess' })
    expect(state.answerStyle).toBe('open_guess')
  })

  it('is locked once the game has started', () => {
    const state = loadingClue()
    const after = gameReducer(state, { type: 'SET_ANSWER_STYLE', answerStyle: 'open_guess' })
    expect(after).toBe(state)
  })
})

describe('SET_TIMER_CONFIG / START_TIMER / CLEAR_TIMER', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('rejects a non-positive duration', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'SET_TIMER_CONFIG', mode: 'auto', durationSeconds: 0 })).toBe(state)
  })

  it('updates the timer config', () => {
    const state = gameReducer(fresh(), { type: 'SET_TIMER_CONFIG', mode: 'manual', durationSeconds: 45 })
    expect(state.timerConfig).toEqual({ mode: 'manual', durationSeconds: 45 })
  })

  it('START_TIMER sets an absolute deadline while answering', () => {
    const state = gameReducer(answering(), { type: 'START_TIMER' })
    expect(state.timerEndsAt).toBe(Date.now() + 20_000)
  })

  it('START_TIMER is ignored outside the answering phase', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'START_TIMER' })).toBe(state)
  })

  it('CLEAR_TIMER nulls out the deadline while answering', () => {
    let state = gameReducer(answering(), { type: 'START_TIMER' })
    state = gameReducer(state, { type: 'CLEAR_TIMER' })
    expect(state.timerEndsAt).toBeNull()
  })
})

describe('SET_CLUES', () => {
  it('replaces clues during setup', () => {
    const newClues = [clue('new', 0)]
    const state = gameReducer(fresh(), { type: 'SET_CLUES', clues: newClues })
    expect(state.clues).toBe(newClues)
  })

  it('no-ops with an empty clues array', () => {
    const state = fresh()
    expect(gameReducer(state, { type: 'SET_CLUES', clues: [] })).toBe(state)
  })

  it('no-ops outside the setup phase', () => {
    const state = loadingClue()
    expect(gameReducer(state, { type: 'SET_CLUES', clues: [clue('new', 0)] })).toBe(state)
  })
})

describe('RESTART', () => {
  it('resets fully back to a fresh setup state, keeping the clue list', () => {
    let state = answering()
    state = gameReducer(state, { type: 'SELECT_OPTION', index: 0 })
    state = gameReducer(state, { type: 'RESTART' })
    expect(state).toEqual(initialState(clues))
  })
})
