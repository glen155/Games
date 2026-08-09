import { describe, expect, it } from 'vitest'
import {
  CHAIN_LADDER,
  FINAL_QUESTION_TARGET,
  ROUND_QUESTION_TARGET,
  currentTurnUserId,
  gameReducer,
  initialState,
} from './gameReducer'
import type { GameState } from '../types'
import type { WeakestLinkAction } from './gameReducer'

const questions = Array.from({ length: 20 }, (_, i) => ({
  id: `q${i}`,
  prompt: `Question ${i}?`,
  answer: `Answer ${i}`,
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
  return apply(joined, { type: 'START_GAME' })
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
    const after = gameReducer(state, { type: 'START_GAME' })
    expect(after).toBe(state)
  })

  it('with exactly two players, skips straight to the final', () => {
    const state = join(fresh(), 'Alice', 'Bob')
    const after = gameReducer(state, { type: 'START_GAME' })
    expect(after.phase).toBe('final')
    expect(after.finalists).toEqual(['alice', 'bob'])
    expect(after.finalScores).toEqual({ alice: 0, bob: 0 })
  })

  it('with three or more players, starts a money round in join order', () => {
    const state = threePlayerGame()
    expect(state.phase).toBe('money')
    expect(state.turnOrder).toEqual(['alice', 'bob', 'carol'])
    expect(state.turnIndex).toBe(0)
    expect(state.roundNumber).toBe(1)
  })
})

describe('JUDGE_ANSWER (chain + turn rotation)', () => {
  it('climbs the chain ladder on consecutive correct answers', () => {
    let state = threePlayerGame()
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    expect(state.currentChain).toBe(CHAIN_LADDER[0])
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    expect(state.currentChain).toBe(CHAIN_LADDER[1])
  })

  it('resets the chain to zero on a wrong answer, banking nothing', () => {
    let state = threePlayerGame()
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: false })
    expect(state.currentChain).toBe(0)
    expect(state.roundPot).toBe(0)
  })

  it('rotates the turn to the next player after every judged question', () => {
    let state = threePlayerGame()
    expect(currentTurnUserId(state)).toBe('alice')
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    expect(currentTurnUserId(state)).toBe('bob')
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    expect(currentTurnUserId(state)).toBe('carol')
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    expect(currentTurnUserId(state)).toBe('alice')
  })

  it('tracks career totals per player', () => {
    let state = threePlayerGame()
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    expect(state.players.alice.totalCorrect).toBe(1)
    expect(state.players.alice.totalWrong).toBe(0)
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: false }) // bob
    expect(state.players.bob.totalWrong).toBe(1)
  })

  it('ends the round once the question target is hit, banking the pot and moving to voting', () => {
    let state = threePlayerGame()
    for (let i = 0; i < ROUND_QUESTION_TARGET; i += 1) {
      state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    }
    expect(state.questionsAskedThisRound).toBe(ROUND_QUESTION_TARGET)
    expect(state.phase).toBe('voting')
    expect(state.roundPot).toBe(0)
    expect(state.currentChain).toBe(0)
    // Every question was correct and never banked, so the final chain value
    // was lost when the round ended — bank stays at 0.
    expect(state.bank).toBe(0)
  })
})

describe('BANK', () => {
  it('no-ops for anyone but the current player', () => {
    let state = threePlayerGame()
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true }) // alice climbs the chain, turn -> bob
    const after = gameReducer(state, { type: 'BANK', userId: 'alice' })
    expect(after).toBe(state)
  })

  it('no-ops when the chain is empty', () => {
    const state = threePlayerGame()
    const after = gameReducer(state, { type: 'BANK', userId: 'alice' })
    expect(after).toBe(state)
  })

  it('transfers the current chain into the round pot, resets the chain, and passes the turn', () => {
    // The chain is shared across the whole team for the round — it keeps
    // climbing as each teammate answers correctly, not reset per player.
    let state = threePlayerGame()
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true }) // alice -> chain rung 0, turn -> bob
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true }) // bob -> chain rung 1, turn -> carol
    const after = gameReducer(state, { type: 'BANK', userId: 'carol' })
    expect(after.roundPot).toBe(CHAIN_LADDER[1])
    expect(after.currentChain).toBe(0)
    expect(currentTurnUserId(after)).toBe('alice')
  })

  it('does not count toward the round question target', () => {
    let state = threePlayerGame()
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    state = gameReducer(state, { type: 'BANK', userId: 'bob' })
    expect(state.questionsAskedThisRound).toBe(1)
  })
})

/** Drives a 3-player game through a full money round (all correct, nobody
 * banks) to the voting phase. */
function toVoting(): GameState {
  let state = threePlayerGame()
  for (let i = 0; i < ROUND_QUESTION_TARGET; i += 1) {
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
  }
  return state
}

describe('CAST_VOTE / REVEAL_VOTES / ADVANCE_AFTER_VOTE', () => {
  it('records a vote, rejecting a self-vote', () => {
    let state = toVoting()
    const rejected = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'alice' })
    expect(rejected).toBe(state)
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    expect(state.votes.alice).toBe('bob')
  })

  it('REVEAL_VOTES no-ops until everyone has voted', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    const after = gameReducer(state, { type: 'REVEAL_VOTES' })
    expect(after).toBe(state)
  })

  it('eliminates the majority vote target', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'REVEAL_VOTES' })
    expect(state.phase).toBe('vote-reveal')
    expect(state.lastVoteOff?.eliminatedId).toBe('bob')
    expect(state.lastVoteOff?.tieBroken).toBe(false)
  })

  it('breaks a tie using this round\'s weakest performer', () => {
    let state = threePlayerGame()
    // Bob's only wrong answer of the round — everyone else answers correctly
    // every turn, so bob ends the round with the worst record.
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true }) // alice
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: false }) // bob
    state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true }) // carol
    for (let i = 0; i < ROUND_QUESTION_TARGET - 3; i += 1) {
      state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    }
    expect(state.phase).toBe('voting')

    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'alice' })
    // One vote each -> tied three ways -> weakest round performance decides.
    state = gameReducer(state, { type: 'REVEAL_VOTES' })
    expect(state.lastVoteOff?.tieBroken).toBe(true)
    expect(state.lastVoteOff?.eliminatedId).toBe('bob')
  })

  it('ADVANCE_AFTER_VOTE removes the eliminated player and starts the next round', () => {
    let state = toVoting()
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'REVEAL_VOTES' })
    state = gameReducer(state, { type: 'ADVANCE_AFTER_VOTE' })

    expect(state.players.bob.eliminated).toBe(true)
    expect(state.turnOrder).toEqual(['alice', 'carol'])
    // Down to two — straight into the final, not another money round.
    expect(state.phase).toBe('final')
    expect(state.finalists).toEqual(['alice', 'carol'])
  })

  it('goes to another money round instead of the final when 3+ players remain', () => {
    let state = apply(join(fresh(), 'Alice', 'Bob', 'Carol', 'Dave'), { type: 'START_GAME' })
    for (let i = 0; i < ROUND_QUESTION_TARGET; i += 1) {
      state = gameReducer(state, { type: 'JUDGE_ANSWER', correct: true })
    }
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'alice', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'bob', targetId: 'carol' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'carol', targetId: 'bob' })
    state = gameReducer(state, { type: 'CAST_VOTE', voterId: 'dave', targetId: 'bob' })
    state = gameReducer(state, { type: 'REVEAL_VOTES' })
    state = gameReducer(state, { type: 'ADVANCE_AFTER_VOTE' })

    expect(state.phase).toBe('money')
    expect(state.turnOrder).toEqual(['alice', 'carol', 'dave'])
    expect(state.roundNumber).toBe(2)
    expect(state.questionsAskedThisRound).toBe(0)
  })
})

describe('FINAL_JUDGE', () => {
  function toFinal(): GameState {
    return apply(join(fresh(), 'Alice', 'Bob'), { type: 'START_GAME' })
  }

  it('alternates turns between the two finalists', () => {
    let state = toFinal()
    expect(state.finalTurn).toBe(0)
    state = gameReducer(state, { type: 'FINAL_JUDGE', correct: true })
    expect(state.finalTurn).toBe(1)
    expect(state.finalScores?.alice).toBe(1)
    state = gameReducer(state, { type: 'FINAL_JUDGE', correct: false })
    expect(state.finalTurn).toBe(0)
    expect(state.finalScores?.bob).toBe(0)
  })

  it('declares a winner once both have answered the target and scores differ', () => {
    let state = toFinal()
    // Alice answers correctly every turn, Bob never does.
    for (let i = 0; i < FINAL_QUESTION_TARGET; i += 1) {
      state = gameReducer(state, { type: 'FINAL_JUDGE', correct: true }) // alice
      state = gameReducer(state, { type: 'FINAL_JUDGE', correct: false }) // bob
    }
    expect(state.phase).toBe('game-over')
    expect(state.winnerId).toBe('alice')
  })

  it('keeps going in sudden death when still tied after the target', () => {
    let state = toFinal()
    for (let i = 0; i < FINAL_QUESTION_TARGET; i += 1) {
      state = gameReducer(state, { type: 'FINAL_JUDGE', correct: true }) // alice
      state = gameReducer(state, { type: 'FINAL_JUDGE', correct: true }) // bob
    }
    expect(state.phase).toBe('final')
    expect(state.finalQuestionsAsked?.alice).toBe(FINAL_QUESTION_TARGET)
    // One more sudden-death pair, alice pulls ahead.
    state = gameReducer(state, { type: 'FINAL_JUDGE', correct: true }) // alice
    state = gameReducer(state, { type: 'FINAL_JUDGE', correct: false }) // bob
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
