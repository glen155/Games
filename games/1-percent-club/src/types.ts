export interface QuestionTier {
  percent: number; // % of the original 100 who answered correctly, descending
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export type GamePhase = 'setup' | 'playing' | 'reveal' | 'won' | 'eliminated';

export interface GameState {
  questions: QuestionTier[];
  phase: GamePhase;
  currentTierIndex: number;
  selectedOptionIndex: number | null;
  jackpotAmount: number;
  poolRemaining: number; // simulated contestants left, out of STARTING_POOL
  lastAnswerCorrect: boolean | null; // meaningful only during 'reveal'
  eliminatedAtTierIndex: number | null;
}
