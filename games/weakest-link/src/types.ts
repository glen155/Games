/** One multiple-choice trivia question — self-graded, same shape as 1% Club's
 * QuestionTier. The correct index lives in shared state like everything
 * else; nothing renders it to anyone but the current turn's own device until
 * after they've answered (same "don't render it" trust model as Family
 * Feud's unrevealed answers). */
export interface Question {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface WeakestLinkPlayer {
  /** Platform PlayerPresence.userId for a remote (phone) player, or a
   * synthetic 'local-<uuid>' for a player sharing the host screen. */
  userId: string;
  nickname: string;
  eliminated: boolean;
  /** Career totals across the whole game — shown on the final standings. */
  totalCorrect: number;
  totalWrong: number;
}

/** This round's performance only — reset every round, used purely to break
 * a tied vote (the round's best performer decides who's really weakest). */
export interface RoundStats {
  correct: number;
  wrong: number;
}

export interface VoteOffResult {
  eliminatedId: string;
  nickname: string;
  tally: Record<string, number>;
  /** True when the vote was tied and the round's strongest link's
   * performance broke it, rather than a clean vote majority. */
  tieBroken: boolean;
}

export type GamePhase =
  | 'lobby'
  | 'money'
  | 'voting'
  | 'vote-reveal'
  | 'final'
  | 'game-over';

export interface GameState {
  phase: GamePhase;

  questions: Question[];
  questionIndex: number;

  players: Record<string, WeakestLinkPlayer>;
  /** Full roster in join order — includes eliminated players, for history/display. */
  playerOrder: string[];
  /** Rotation of userIds still in the game — whoever's turn it is next. */
  turnOrder: string[];
  turnIndex: number;

  roundNumber: number;
  questionsAskedThisRound: number;
  roundStats: Record<string, RoundStats>;

  currentChain: number;
  /** Index into CHAIN_LADDER — how far the current chain has climbed. */
  chainStep: number;
  /** Banked this round, safe from a wrong answer — merges into `bank` at round end. */
  roundPot: number;
  /** Total banked money across the whole game so far. */
  bank: number;

  /** Absolute epoch-ms deadline for the whole current money round, or null
   * outside a money round. Every device computes its own countdown locally
   * from this synced value — same pattern as Music Timeline's shot clock. */
  roundEndsAt: number | null;
  /** Absolute epoch-ms deadline for the current turn's question (money or
   * final round), or null when nobody's currently on the clock. */
  questionEndsAt: number | null;

  votes: Record<string, string>; // voterId -> targetId
  /** Voters (userIds) who have flipped their own card to reveal who they
   * voted for so far — free-for-all, in whatever order they actually do it.
   * Once this covers everyone in `turnOrder`, `lastVoteOff` is computed. */
  revealedVoterIds: string[];
  /** Only populated once every voter has revealed their own card. */
  lastVoteOff: VoteOffResult | null;

  finalists: [string, string] | null;
  finalScores: Record<string, number> | null;
  finalQuestionsAsked: Record<string, number> | null;
  finalTurn: 0 | 1;

  winnerId: string | null;
}
