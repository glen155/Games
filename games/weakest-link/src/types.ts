/** One trivia question. The answer is only ever shown on the host's own
 * device (a judge-panel cheat sheet, same trust model as Family Feud's
 * AnswerJudgePanel) — free-text answers can't be auto-graded, so the host
 * judges a spoken answer against it. */
export interface Question {
  id: string;
  prompt: string;
  answer: string;
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

  votes: Record<string, string>; // voterId -> targetId
  lastVoteOff: VoteOffResult | null;

  finalists: [string, string] | null;
  finalScores: Record<string, number> | null;
  finalQuestionsAsked: Record<string, number> | null;
  finalTurn: 0 | 1;

  winnerId: string | null;
}
