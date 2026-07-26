// Shapes of the `summary` jsonb written by each game's recordGameResult call.
// Kept in sync by hand with games/family-feud and games/1-percent-club.

export interface FeudPlayerSummary {
  userId: string;
  nickname: string;
  team: 0 | 1 | null;
}

export interface FeudSummary {
  teams: [{ name: string; score: number }, { name: string; score: number }];
  winner: string | null;
  players: FeudPlayerSummary[];
}

export interface ClubPlayerSummary {
  userId: string;
  nickname: string;
  correctCount: number;
  neverMissed: boolean;
}

export interface ClubSummary {
  jackpotAmount: number;
  players: ClubPlayerSummary[];
}

export interface SoundtrackPlayerSummary {
  userId: string;
  nickname: string;
  correctCount: number;
}

export interface SoundtrackSummary {
  totalClues: number;
  players: SoundtrackPlayerSummary[];
}
