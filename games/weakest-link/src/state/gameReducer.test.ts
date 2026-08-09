import { describe, expect, it } from 'vitest'
import {
  CHAIN_LADDER,
  FINAL_QUESTION_TARGET,
  QUESTION_TIME_MS,
  ROUND_QUESTION_TARGET,
  ROUND_TIME_MS,
  currentTurnUserId,
  gameReducer,
  initialState,
  roundStandings,
} from './gameReducer'
import type { GameState } from '../types'
import type { WeakestLinkAction } from './gameReducer'

const AT = 1_000_000

const questions = Array.from({ length: 20 }, (_, i) => ({
  id: `q${i}`,
  prompt: `Question ${i}?`,
  options: ['Right', 'Wrong A', 'Wrong B', 'Wrong C'] as [string, string, string, string],
  correctIndex: 0 as const,
}))

function fresh(): GameState {
  return initialState(questions)
}

function apply(state: GameState, ...actions: WeakestLinkAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

function join(state: GameState, ...nicknames: string[]): GameState {
  return nicknames.reduce(
    (s, nickname) => gameReducer(s, { type: 'PLAYER_JOINED', userId: nickname.toLowerCase(), nickname }),
    state,
  )
}

/** Three-player game, past the lobby, ready for a money round. */
function threePlayerGame(): GameState {
  const joined = join(fresh(), 'Alice', 'Bob', 'Carol')
  return apply(joined, { type: 'START_GAME', at: AT })
}

function answer(userId: string, correct: boolean): WeakestLinkAction {
  return { type: 'SUBMIT_ANSWER', userId, index: correct ? 0 : 1, at: AT }
}

describe('PLAYER_JOINED', () => {
  it('adds players in join order', () => {
    const state = join(fresh(), 'Alice', 'Bob')
    expect(state.playerOrder).toEqual(['alice', 'bob'])
    expect(state.players.alice.nickname).toBe('Alice')
    expect(state.players.alice.eliminated).toBe(false)
  })

  it('ignores a duplicate userId', () => {
    let state = join(fresh(), 'Alice')
    state = gameReducer(state, { type: 'PLAYER_JOINED', userId: 'alice', nickname: 'Alice Again' })
    expect(state.playerOrder).toEqual(['alice'])
    expect(state.players.alice.nickname).toBe('Alice')
  })

  it('no-ops once the game has left the lobby', () => {
    const started = threePlayerGame()
    const after = gameReducer(started, { type: 'PLAYER_JOINED', userId: 'dave', nickname: 'Dave' })
    expect(after).toBe(started)
  })
})

describe('START_GAME', () => {
  it('no-ops with fewer than two players', () => {
    const state = join(fresh(), 'Alice')
    const after = gameReducer(state, { type: 'START_GAME', at: AT })
    expect(after).toBe(state)
  })

  it('with exactly two players, skips straight to the final and starts only the question clock', () => {
    const state = join(fresh(), 'Alice', 'Bob')
    const after = gameReducer(state, { type: 'START_GAME', at: AT })
    expect(after.phase).toBe('final')
    expect(after.finalists).toEqual(['alice', 'bob'])
    expect(after.finalScores).toEqual({ alice: 0, bob: 0 })
    expect(after.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
    expect(after.roundEndsAt).toBeNull()
  })

  it('with three or more players, starts a money round in join order with both clocks running', () => {
    const state = threePlayerGame()
    expect(state.phase).toBe('money')
    expect(state.turnOrder).toEqual(['alice', 'bob', 'carol'])
    expect(state.turnIndex).toBe(0)
    expect(state.roundNumber).toBe(1)
    expect(state.roundEndsAt).toBe(AT + ROUND_TIME_MS)
    expect(state.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
  })
})

describe('SUBMIT_ANSWER (chain + turn rotation)', () => {
  it('climbs the chain ladder on consecutive correct answers', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true))
    expect(state.currentChain).toBe(CHAIN_LADDER[0])
    state = gameReducer(state, answer('bob', true))
    expect(state.currentChain).toBe(CHAIN_LADDER[1])
  })

  it('resets the chain to zero on a wrong answer, banking nothing', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true))
    state = gameReducer(state, answer('bob', false))
    expect(state.currentChain).toBe(0)
    expect(state.roundPot).toBe(0)
  })

  it('is judged against the question\'s correctIndex, not asserted by the caller', () => {
    let state = threePlayerGame()
    // index 0 is the fixture's actual correct option.
    state = gameReducer(state, { type: 'SUBMIT_ANSWER', userId: 'alice', index: 0, at: AT })
    expect(state.currentChain).toBe(CHAIN_LADDER[0])
  })

  it('no-ops for anyone but the current player', () => {
    const state = threePlayerGame()
    const after = gameReducer(state, answer('bob', true))
    expect(after).toBe(state)
  })

  it('rotates the turn to the next player after every judged question', () => {
    let state = threePlayerGame()
    expect(currentTurnUserId(state)).toBe('alice')
    state = gameReducer(state, answer('alice', true))
    expect(currentTurnUserId(state)).toBe('bob')
    state = gameReducer(state, answer('bob', true))
    expect(currentTurnUserId(state)).toBe('carol')
    state = gameReducer(state, answer('carol', true))
    expect(currentTurnUserId(state)).toBe('alice')
  })

  it('tracks career totals per player', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true))
    expect(state.players.alice.totalCorrect).toBe(1)
    expect(state.players.alice.totalWrong).toBe(0)
    state = gameReducer(state, answer('bob', false))
    expect(state.players.bob.totalWrong).toBe(1)
  })

  it('reseeds the question clock for the next turn', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true))
    expect(state.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
  })

  it('ends the round once the question target is hit, banking the pot, clearing both clocks, and moving to voting', () => {
    let state = threePlayerGame()
    for (let i = 0; i < ROUND_QUESTION_TARGET; i += 1) {
      const id = currentTurnUserId(state)!
      state = gameReducer(state, answer(id, true))
    }
    expect(state.questionsAskedThisRound).toBe(ROUND_QUESTION_TARGET)
    expect(state.phase).toBe('voting')
    expect(state.roundPot).toBe(0)
    expect(state.currentChain).toBe(0)
    expect(state.roundEndsAt).toBeNull()
    expect(state.questionEndsAt).toBeNull()
    // Every question was correct and never banked, so the final chain value
    // was lost when the round ended — bank stays at 0.
    expect(state.bank).toBe(0)
  })
})

describe('QUESTION_TIME_EXPIRED', () => {
  it('behaves exactly like a wrong answer — chain resets, turn passes, no index needed', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true)) // chain -> rung 0, turn -> bob
    state = gameReducer(state, { type: 'QUESTION_TIME_EXPIRED', at: AT })
    expect(state.currentChain).toBe(0)
    expect(state.players.bob.totalWrong).toBe(1)
    expect(currentTurnUserId(state)).toBe('carol')
  })

  it('no-ops outside the money round', () => {
    const state = fresh()
    const after = gameReducer(state, { type: 'QUESTION_TIME_EXPIRED', at: AT })
    expect(after).toBe(state)
  })
})

describe('ROUND_TIME_EXPIRED', () => {
  it('force-ends the round early, banking whatever is in the pot and losing an un-banked chain', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true)) // chain -> 20
    state = gameReducer(state, { type: 'BANK', userId: 'bob', at: AT }) // banks 20 into roundPot
    state = gameReducer(state, answer('carol', true)) // chain -> 20 again, unbanked

    expect(state.questionsAskedThisRound).toBeLessThan(ROUND_QUESTION_TARGET)
    const after = gameReducer(state, { type: 'ROUND_TIME_EXPIRED' })
    expect(after.phase).toBe('voting')
    expect(after.bank).toBe(20) // only the banked pot survives
    expect(after.roundPot).toBe(0)
    expect(after.currentChain).toBe(0)
    expect(after.roundEndsAt).toBeNull()
    expect(after.questionEndsAt).toBeNull()
  })

  it('no-ops outside the money round', () => {
    const state = fresh()
    const after = gameReducer(state, { type: 'ROUND_TIME_EXPIRED' })
    expect(after).toBe(state)
  })
})

describe('BANK', () => {
  it('no-ops for anyone but the current player', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true)) // chain climbs, turn -> bob
    const after = gameReducer(state, { type: 'BANK', userId: 'alice', at: AT })
    expect(after).toBe(state)
  })

  it('no-ops when the chain is empty', () => {
    const state = threePlayerGame()
    const after = gameReducer(state, { type: 'BANK', userId: 'alice', at: AT })
    expect(after).toBe(state)
  })

  it('transfers the current chain into the round pot, resets the chain, passes the turn, and reseeds the question clock', () => {
    // The chain is shared across the whole team for the round — it keeps
    // climbing as each teammate answers correctly, not reset per player.
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true)) // -> chain rung 0, turn -> bob
    state = gameReducer(state, answer('bob', true)) // -> chain rung 1, turn -> carol
    const after = gameReducer(state, { type: 'BANK', userId: 'carol', at: AT })
    expect(after.roundPot).toBe(CHAIN_LADDER[1])
    expect(after.currentChain).toBe(0)
    expect(currentTurnUserId(after)).toBe('alice')
    expect(after.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
  })

  it('does not count toward the round question target', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true))
    state = gameReducer(state, { type: 'BANK', userId: 'bob', at: AT })
    expect(state.questionsAskedThisRound).toBe(1)
  })
})

/** Drives a 3-player game through a full money round (all correct, nobody
 * banks) to the voting phase. */
function toVoting(): GameState {
  let state = threePlayerGame()
  for (let i = 0; i < ROUND_QUESTION_TARGET; i += 1) {
    const id = currentTurnUserId(state)!
    state = gameReducer(state, answer(id, true))
  }
  return state
}

describe('roundStandings', () => {
  it('identifies this round\'s strongest and weakest performer', () => {
    let state = threePlayerGame()
    state = gameReducer(state, answer('alice', true)) // alice: +1
    state = gameReducer(state, answer('bob', false)) // bob: -1
    // carol untouched so far: 0, strictly between alice and bob.
    const { strongestId, weakestId } = roundStandings(state)
    expect(strongestId).toBe('alice')
    expect(weakestId).toBe('bob')
  })

  it('returns nulls when there is no active round', () => {
    expect(roundStandings(fresh())).toEqual({ strongestId: null, weakestId: null })
  })
})

describe('CAST_VOTE / START_VOTE_REVEAL / REVEAL_NEXT_VOTE / ADVANCE_AFTER_VOTE', () => {
  it('records a vote, rejecting a self-vote', () => {
    let state = toVoting()
    const rejected = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'alice' })
    expect(rejected).toBe(state)
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    expect(state.votes.alice).toBe('bob')
  })

  it('START_VOTE_REVEAL no-ops until everyone has voted', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    const after = gameReducer(state, { type: 'START_VOTE_REVEAL' })
    expect(after).toBe(state)
  })

  it('reveals votes one at a time, only resolving the outcome once every vote is revealed', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'START_VOTE_REVEAL' })

    expect(state.phase).toBe('vote-reveal')
    expect(state.voteRevealOrder).toHaveLength(3)
    expect(state.voteRevealIndex).toBe(0)
    expect(state.lastVoteOff).toBeNull()

    state = gameReducer(state, { type: 'REVEAL_NEXT_VOTE' })
    expect(state.voteRevealIndex).toBe(1)
    expect(state.lastVoteOff).toBeNull() // still not fully revealed

    state = gameReducer(state, { type: 'REVEAL_NEXT_VOTE' })
    expect(state.voteRevealIndex).toBe(2)
    expect(state.lastVoteOff).toBeNull()

    state = gameReducer(state, { type: 'REVEAL_NEXT_VOTE' })
    expect(state.voteRevealIndex).toBe(3)
    expect(state.lastVoteOff?.eliminatedId).toBe('bob')
    expect(state.lastVoteOff?.tieBroken).toBe(false)
  })

  it('REVEAL_NEXT_VOTE no-ops once every vote has already been revealed', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'START_VOTE_REVEAL' })
    state = apply(
      state,
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
    )
    const after = gameReducer(state, { type: 'REVEAL_NEXT_VOTE' })
    expect(after).toBe(state)
  })

  it('breaks a tie using this round\'s weakest performer', () => {
    let state = threePlayerGame()
    // Bob's only wrong answer of the round — everyone else answers correctly
    // every turn, so bob ends the round with the worst record.
    state = gameReducer(state, answer('alice', true))
    state = gameReducer(state, answer('bob', false))
    state = gameReducer(state, answer('carol', true))
    for (let i = 0; i < ROUND_QUESTION_TARGET - 3; i += 1) {
      const id = currentTurnUserId(state)!
      state = gameReducer(state, answer(id, true))
    }
    expect(state.phase).toBe('voting')

    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'alice' })
    // One vote each -> tied three ways -> weakest round performance decides.
    state = gameReducer(state, { type: 'START_VOTE_REVEAL' })
    state = apply(
      state,
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
    )
    expect(state.lastVoteOff?.tieBroken).toBe(true)
    expect(state.lastVoteOff?.eliminatedId).toBe('bob')
  })

  function fullyRevealedElimination(target: 'bob' | 'carol' = 'bob'): GameState {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: target })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: target === 'bob' ? 'carol' : 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: target })
    state = gameReducer(state, { type: 'START_VOTE_REVEAL' })
    return apply(
      state,
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
    )
  }

  it('ADVANCE_AFTER_VOTE no-ops before the reveal is finished', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'START_VOTE_REVEAL' })
    const after = gameReducer(state, { type: 'ADVANCE_AFTER_VOTE', at: AT })
    expect(after).toBe(state)
  })

  it('removes the eliminated player and starts the next round (both clocks reseeded) once 3+ remain', () => {
    let state = apply(join(fresh(), 'Alice', 'Bob', 'Carol', 'Dave'), { type: 'START_GAME', at: AT })
    for (let i = 0; i < ROUND_QUESTION_TARGET; i += 1) {
      const id = currentTurnUserId(state)!
      state = gameReducer(state, answer(id, true))
    }
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'dave', targetId: 'bob' })
    state = gameReducer(state, { type: 'START_VOTE_REVEAL' })
    state = apply(
      state,
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
      { type: 'REVEAL_NEXT_VOTE' },
    )
    state = gameReducer(state, { type: 'ADVANCE_AFTER_VOTE', at: AT })

    expect(state.players.bob.eliminated).toBe(true)
    expect(state.turnOrder).toEqual(['alice', 'carol', 'dave'])
    expect(state.phase).toBe('money')
    expect(state.roundNumber).toBe(2)
    expect(state.questionsAskedThisRound).toBe(0)
    expect(state.roundEndsAt).toBe(AT + ROUND_TIME_MS)
    expect(state.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
  })

  it('goes straight to the final (question clock only) once exactly 2 remain', () => {
    const state = gameReducer(fullyRevealedElimination('bob'), { type: 'ADVANCE_AFTER_VOTE', at: AT })
    expect(state.phase).toBe('final')
    expect(state.finalists).toEqual(['alice', 'carol'])
    expect(state.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
    expect(state.roundEndsAt).toBeNull()
  })
})

describe('SUBMIT_FINAL_ANSWER / FINAL_QUESTION_TIME_EXPIRED', () => {
  function toFinal(): GameState {
    return apply(join(fresh(), 'Alice', 'Bob'), { type: 'START_GAME', at: AT })
  }

  it('alternates turns between the two finalists and reseeds the question clock', () => {
    let state = toFinal()
    expect(state.finalTurn).toBe(0)
    state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'alice', index: 0, at: AT })
    expect(state.finalTurn).toBe(1)
    expect(state.finalScores?.alice).toBe(1)
    expect(state.questionEndsAt).toBe(AT + QUESTION_TIME_MS)
    state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'bob', index: 1, at: AT })
    expect(state.finalTurn).toBe(0)
    expect(state.finalScores?.bob).toBe(0)
  })

  it('no-ops if it is not that finalist\'s turn', () => {
    const state = toFinal()
    const after = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'bob', index: 0, at: AT })
    expect(after).toBe(state)
  })

  it('FINAL_QUESTION_TIME_EXPIRED behaves like a wrong answer with no index', () => {
    let state = toFinal()
    state = gameReducer(state, { type: 'FINAL_QUESTION_TIME_EXPIRED', at: AT })
    expect(state.finalScores?.alice).toBe(0)
    expect(state.finalTurn).toBe(1)
  })

  it('declares a winner once both have answered the target and scores differ, clearing the question clock', () => {
    let state = toFinal()
    // Alice answers correctly every turn, Bob never does.
    for (let i = 0; i < FINAL_QUESTION_TARGET; i += 1) {
      state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'alice', index: 0, at: AT })
      state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'bob', index: 1, at: AT })
    }
    expect(state.phase).toBe('game-over')
    expect(state.winnerId).toBe('alice')
    expect(state.questionEndsAt).toBeNull()
  })

  it('keeps going in sudden death when still tied after the target', () => {
    let state = toFinal()
    for (let i = 0; i < FINAL_QUESTION_TARGET; i += 1) {
      state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'alice', index: 0, at: AT })
      state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'bob', index: 0, at: AT })
    }
    expect(state.phase).toBe('final')
    expect(state.finalQuestionsAsked?.alice).toBe(FINAL_QUESTION_TARGET)
    // One more sudden-death pair, alice pulls ahead.
    state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'alice', index: 0, at: AT })
    state = gameReducer(state, { type: 'SUBMIT_FINAL_ANSWER', userId: 'bob', index: 1, at: AT })
    expect(state.phase).toBe('game-over')
    expect(state.winnerId).toBe('alice')
  })
})

describe('RESET_GAME', () => {
  it('returns to a fresh lobby state with the same question pool', () => {
    const state = toVoting()
    const after = gameReducer(state, { type: 'RESET_GAME' })
    expect(after).toEqual(initialState(questions))
  })
})
