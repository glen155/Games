import type { PlayerPresence } from '@games/platform';
import { VOWEL_COST, WHEEL } from '../data/wheel';
import type { CashWedge, GameState, Puzzle, Team, TeamId } from '../types';

export const ROUND_COUNT = 3;

const VOWELS = 'AEIOU';

export type WheelAction =
  // Hosted-mode only — a real joined player picking their own team, exactly
  // like Family Feud's ASSIGN_TEAM.
  | { type: 'ASSIGN_TEAM'; userId: string; team: TeamId }
  | { type: 'SET_TEAM_NAME'; team: TeamId; name: string }
  | { type: 'BEGIN_GAME' }
  | { type: 'SPIN'; userId: string }
  | { type: 'GUESS_LETTER'; userId: string; letter: string }
  | { type: 'BUY_VOWEL'; userId: string; letter: string }
  | { type: 'SOLVE'; userId: string; guess: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET_GAME' };

/** Proper Fisher-Yates shuffle — same helper as Weakest Link's, duplicated
 * per game rather than lifted into packages/platform (nothing game-specific
 * lives there, and this is the only other game that currently needs it). */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function initialState(puzzles: Puzzle[]): GameState {
  return {
    phase: 'setup',
    puzzles,
    puzzleIndex: 0,
    roundNumber: 1,
    teams: [
      { name: 'Team 1', score: 0 },
      { name: 'Team 2', score: 0 },
    ],
    activeTeam: 0,
    teamAssignments: {},
    roundPot: 0,
    guessedLetters: [],
    spinResult: null,
    lastSpin: null,
    spinSeq: 0,
    lastRoundWinner: null,
    solvedSolution: null,
  };
}

/** The puzzle currently in play. Cycles the pool with modulo rather than
 * tracking "used" puzzles, same trade-off every other game's content pool
 * accepts (Family Feud's rounds, Weakest Link's questions). */
export function currentPuzzle(state: GameState): Puzzle {
  return state.puzzles[state.puzzleIndex % state.puzzles.length];
}

/**
 * A team's captain is derived, not stored — identical to Family Feud's
 * captainOfTeam. Whichever currently-connected player has been on this team
 * the longest (players comes pre-sorted ascending by join time) is captain;
 * captaincy automatically follows if they switch teams or disconnect.
 */
export function captainOfTeam(
  team: TeamId,
  players: PlayerPresence[],
  teamAssignments: Record<string, TeamId>,
): string | null {
  return players.find((p) => teamAssignments[p.userId] === team)?.userId ?? null;
}

/** Normalizes a phrase for SOLVE comparison: uppercase, letters/digits/
 * spaces only, collapsed whitespace. Punctuation and exact spacing on the
 * board are cosmetic — "JURASSIC PARK AVENUE" and "jurassic   park-avenue!"
 * both compare equal. */
export function normalize(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function isVowel(letter: string): boolean {
  return VOWELS.includes(letter);
}

function otherTeam(team: TeamId): TeamId {
  return team === 0 ? 1 : 0;
}

function countOccurrences(solution: string, letter: string): number {
  return solution.split('').filter((c) => c === letter).length;
}

/** True once every distinct letter actually present in the solution has
 * been guessed — nothing left to reveal. */
function allLettersRevealed(solution: string, guessedLetters: string[]): boolean {
  const distinctLetters = new Set(solution.split('').filter((c) => /[A-Z]/.test(c)));
  for (const letter of distinctLetters) {
    if (!guessedLetters.includes(letter)) return false;
  }
  return true;
}

/** Banks the round pot for `winner` and ends the round — shared by a
 * correct SOLVE and the auto-resolve when nothing's left to guess. */
function solveRound(state: GameState, winner: TeamId): GameState {
  const teams: [Team, Team] = [{ ...state.teams[0] }, { ...state.teams[1] }];
  teams[winner].score += state.roundPot;
  return {
    ...state,
    teams,
    phase: 'puzzle-solved',
    roundPot: 0,
    spinResult: null,
    lastRoundWinner: winner,
    solvedSolution: currentPuzzle(state).solution,
  };
}

export function gameReducer(state: GameState, action: WheelAction): GameState {
  switch (action.type) {
    case 'ASSIGN_TEAM':
      return {
        ...state,
        teamAssignments: { ...state.teamAssignments, [action.userId]: action.team },
      };

    case 'SET_TEAM_NAME': {
      const teams: [Team, Team] = [{ ...state.teams[0] }, { ...state.teams[1] }];
      teams[action.team].name = action.name;
      return { ...state, teams };
    }

    case 'BEGIN_GAME':
      if (state.phase !== 'setup') return state;
      return { ...state, phase: 'playing' };

    case 'SPIN': {
      if (state.phase !== 'playing' || state.spinResult !== null) return state;
      if (state.teamAssignments[action.userId] !== state.activeTeam) return state;

      const wedge = WHEEL[Math.floor(Math.random() * WHEEL.length)];
      const spinSeq = state.spinSeq + 1;

      if (wedge.type === 'bankrupt') {
        return { ...state, roundPot: 0, lastSpin: wedge, spinSeq, activeTeam: otherTeam(state.activeTeam) };
      }
      if (wedge.type === 'lose-turn') {
        return { ...state, lastSpin: wedge, spinSeq, activeTeam: otherTeam(state.activeTeam) };
      }
      return { ...state, spinResult: wedge, lastSpin: wedge, spinSeq };
    }

    case 'GUESS_LETTER': {
      if (state.phase !== 'playing' || !state.spinResult) return state;
      if (state.teamAssignments[action.userId] !== state.activeTeam) return state;
      const letter = action.letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter) || isVowel(letter) || state.guessedLetters.includes(letter)) return state;

      const cashWedge: CashWedge = state.spinResult;
      const solution = currentPuzzle(state).solution.toUpperCase();
      const occurrences = countOccurrences(solution, letter);
      const guessedLetters = [...state.guessedLetters, letter];

      if (occurrences === 0) {
        return { ...state, guessedLetters, spinResult: null, activeTeam: otherTeam(state.activeTeam) };
      }

      const next: GameState = {
        ...state,
        guessedLetters,
        roundPot: state.roundPot + cashWedge.value * occurrences,
        spinResult: null,
      };
      if (allLettersRevealed(solution, guessedLetters)) return solveRound(next, state.activeTeam);
      return next;
    }

    case 'BUY_VOWEL': {
      if (state.phase !== 'playing' || state.spinResult !== null) return state;
      if (state.teamAssignments[action.userId] !== state.activeTeam) return state;
      if (state.roundPot < VOWEL_COST) return state;
      const letter = action.letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter) || !isVowel(letter) || state.guessedLetters.includes(letter)) return state;

      const solution = currentPuzzle(state).solution.toUpperCase();
      const occurrences = countOccurrences(solution, letter);
      const guessedLetters = [...state.guessedLetters, letter];
      const roundPot = state.roundPot - VOWEL_COST;

      if (occurrences === 0) {
        return { ...state, guessedLetters, roundPot, activeTeam: otherTeam(state.activeTeam) };
      }

      const next: GameState = { ...state, guessedLetters, roundPot };
      if (allLettersRevealed(solution, guessedLetters)) return solveRound(next, state.activeTeam);
      return next;
    }

    case 'SOLVE': {
      if (state.phase !== 'playing' || state.spinResult !== null) return state;
      if (state.teamAssignments[action.userId] !== state.activeTeam) return state;
      const solution = currentPuzzle(state).solution;
      if (normalize(action.guess) === normalize(solution)) {
        return solveRound(state, state.activeTeam);
      }
      return { ...state, activeTeam: otherTeam(state.activeTeam) };
    }

    case 'NEXT_ROUND': {
      if (state.phase !== 'puzzle-solved') return state;
      const roundNumber = state.roundNumber + 1;
      if (roundNumber > ROUND_COUNT) {
        return { ...state, phase: 'game-over' };
      }
      return {
        ...state,
        phase: 'playing',
        puzzleIndex: state.puzzleIndex + 1,
        roundNumber,
        activeTeam: roundNumber % 2 === 0 ? 1 : 0,
        roundPot: 0,
        guessedLetters: [],
        spinResult: null,
        lastSpin: null,
        lastRoundWinner: null,
        solvedSolution: null,
      };
    }

    case 'RESET_GAME':
      // Reshuffle rather than reuse the same order — otherwise playing
      // again in one sitting would replay the exact same puzzle sequence.
      return initialState(shuffle(state.puzzles));

    default:
      return state;
  }
}
