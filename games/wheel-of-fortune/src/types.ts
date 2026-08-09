export type TeamId = 0 | 1;

export interface Team {
  name: string;
  score: number;
}

/** One puzzle: a category label and its solution phrase. The solution lives
 * in shared state like every other game's hidden content (Family Feud's
 * answers, Weakest Link's correctIndex) — nothing renders an unguessed
 * letter, that's the only thing keeping it spoiler-free. */
export interface Puzzle {
  id: string;
  category: string;
  solution: string;
}

export interface CashWedge {
  type: 'cash';
  value: number;
}

export type Wedge = CashWedge | { type: 'bankrupt' } | { type: 'lose-turn' };

export type GamePhase = 'setup' | 'playing' | 'puzzle-solved' | 'game-over';

export interface GameState {
  phase: GamePhase;

  puzzles: Puzzle[];
  puzzleIndex: number;
  roundNumber: number;

  teams: [Team, Team];
  activeTeam: TeamId;
  /** Hosted-mode only: which team each joined player picked for themselves. */
  teamAssignments: Record<string, TeamId>;

  /** This round's unbanked winnings — lost on Bankrupt, banked on a correct solve. */
  roundPot: number;
  /** Letters (consonants and vowels alike) already tried this round. */
  guessedLetters: string[];
  /** A pending cash wedge awaiting a letter guess — null means "nothing
   * spun yet this turn", so the active team may spin, buy a vowel, or
   * attempt to solve. Bankrupt/Lose a Turn resolve (and pass the turn)
   * immediately on SPIN, so they never live here. */
  spinResult: CashWedge | null;
  /** The most recent spin outcome of *any* kind (including Bankrupt/Lose a
   * Turn), purely for the wheel animation/banner — never gates game logic. */
  lastSpin: Wedge | null;
  /** Increments on every SPIN so the UI can re-key its animation even when
   * the same wedge value comes up twice in a row. */
  spinSeq: number;

  /** Set once a round ends (solved or auto-resolved), for the round-end screen. */
  lastRoundWinner: TeamId | null;
  solvedSolution: string | null;
}
