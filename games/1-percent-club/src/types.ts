import type { ReactNode } from 'react';

export interface QuestionTier {
  percent: number; // % of the original 100 who answered correctly, descending
  prompt: string;
  /** Optional inline diagram shown alongside the prompt (e.g. a clock face, a shape sequence). */
  promptVisual?: ReactNode;
  options: [string, string, string, string]; // always the accessible text label, even when a visual is shown
  /** Optional inline visual per option, parallel to `options` — when present, the option renders
   * this instead of its plain text, but `options[i]` is still used for aria-label/reveal text. */
  optionVisuals?: [ReactNode, ReactNode, ReactNode, ReactNode];
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
  index: number; // what they picked (-1 if they passed instead of answering)
  correct: boolean;
  /** True if they used their one-per-game Pass instead of answering — never
   * counted as a miss and never scored, unlike a genuine wrong answer. */
  passed: boolean;
}

/** Hosted-mode only: how the per-question countdown behaves. */
export interface TimerConfig {
  mode: 'auto' | 'manual';
  durationSeconds: number;
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
  /** Hosted-mode only: who chose to Pass this tier instead of answering — like
   * `playerAnswers`, cleared every NEXT_TIER. Mutually exclusive per player
   * with `playerAnswers` for the same tier. */
  playerPasses: Record<string, { nickname: string }>;
  lastPlayerResults: Record<string, PlayerTierResult> | null; // set on reveal
  playerCorrectCounts: Record<string, number>; // cumulative, across all tiers
  outOfRunningIds: string[]; // first wrong answer = permanent, persists across tiers
  /** Hosted-mode only: userIds who have used their one-per-game Pass. Unlike
   * `playerPasses`, this never clears between tiers — it's a cumulative,
   * whole-game record enforcing "one Pass per player per game." */
  passUsedIds: string[];

  // Hosted-mode only: per-question countdown. timerEndsAt is an absolute
  // epoch-ms deadline (not a ticking counter) so every device can compute its
  // own remaining time from one synced value without spamming the room
  // channel every second.
  timerConfig: TimerConfig;
  timerEndsAt: number | null;
}
