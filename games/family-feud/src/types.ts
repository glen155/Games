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
}
