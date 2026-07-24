export interface Answer {
  text: string;
  points: number;
}

export interface Category {
  name: string;
  answers: Answer[];
}

export type TeamId = 0 | 1;

export interface Team {
  name: string;
  score: number;
}

export interface GameState {
  rounds: Category[];
  currentRoundIndex: number;
  revealed: boolean[];
  strikes: number;
  activeTeam: TeamId;
  teams: [Team, Team];
  pot: number;
  isRoundOver: boolean;
  /** True once strikes hit MAX_STRIKES — the other team gets one shot to steal the pot. */
  awaitingSteal: boolean;
  /** Hosted-mode only: which team each joined player picked for themselves. */
  teamAssignments: Record<string, TeamId>;
  /** False until the host dismisses the pre-game setup screen (classic vs generated rounds). */
  gameStarted: boolean;
}
