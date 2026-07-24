export interface QuestionTier {
  percent: number; // % of the original 100 who answered correctly, descending
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

// 'won' / 'eliminated' are solo-mode-only endings (single actor). 'ended' is the
// hosted-mode ending — the simulated crowd always reaches the last tier, so
// hosted play never "loses"; it just concludes once all tiers are revealed.
export type GamePhase = 'setup' | 'playing' | 'reveal' | 'won' | 'eliminated' | 'ended';

/** One real player's submitted pick for the tier currently in play. */
export interface PlayerAnswer {
  nickname: string;
  index: number;
}

/** One real player's outcome for the tier that was just revealed. */
export interface PlayerTierResult {
  nickname: string;
  index: number; // what they picked
  correct: boolean;
}

export interface GameState {
  questions: QuestionTier[];
  phase: GamePhase;
  currentTierIndex: number;
  selectedOptionIndex: number | null;
  jackpotAmount: number;
  poolRemaining: number; // simulated contestants left, out of STARTING_POOL
  lastAnswerCorrect: boolean | null; // meaningful only during 'reveal'
  eliminatedAtTierIndex: number | null;

  // Hosted-mode only (real joined players answering for bragging rights — the
  // simulated crowd above still drives the jackpot narrative, untouched by
  // these). Always present but empty/null in solo mode.
  playerAnswers: Record<string, PlayerAnswer>; // userId -> this tier's live pick
  lastPlayerResults: Record<string, PlayerTierResult> | null; // set on reveal
  playerCorrectCounts: Record<string, number>; // cumulative, across all tiers
  outOfRunningIds: string[]; // first wrong answer = permanent, persists across tiers
}
