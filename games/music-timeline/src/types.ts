/** One song in the curated pool. `year` must be the verified ORIGINAL release
 * year, not a reissue/remaster/compilation date — a wrong year here silently
 * breaks Timeline mode's trust with players. */
export interface Track {
  id: string;
  spotifyUri: string; // 'spotify:track:<id>' — deep-link target for the host device
  spotifyUrl: string; // 'https://open.spotify.com/track/<id>' — QR code target
  title: string;
  artist: string;
  year: number;
  /** Curator's citation for the year (Discogs/MusicBrainz/label press kit). Never rendered in-game. */
  sourceNote?: string;
}

/** A song that has been placed correctly and now lives in a player's timeline. */
export interface Card {
  trackId: string;
  year: number;
  title: string;
  artist: string;
}

export interface TimelinePlayer {
  /** Platform PlayerPresence.userId for a remote (phone) player, or a
   * synthetic 'local-<uuid>' for a player sharing the host screen. */
  userId: string;
  nickname: string;
  /** Sorted ascending by year. */
  timeline: Card[];
  /** Total wrong placements across the game — used only for tiebreaks. */
  misses: number;
}

export interface GuessLock {
  userId: string;
  gapIndex: number;
  /** Host-captured receipt time. Never trust a client-supplied timestamp for this. */
  receivedAt: number;
}

export type GamePhase =
  | 'lobby'
  | 'loading_track'
  | 'playing'
  | 'locked'
  | 'reveal'
  | 'game_over';

export interface RoundResult {
  userId: string;
  correct: boolean;
  gapIndex: number;
  /** Present only when correct. */
  card?: Card;
}

export interface Round {
  index: number;
  trackId: string;
  trueYear: number;
  /** null = every current player is eligible; set to a subset during sudden death. */
  eligibleUserIds: string[] | null;
  startedAt: number | null;
  shotClockMs: number;
  deadline: number | null;
  locks: Record<string, GuessLock>;
  results: Record<string, RoundResult> | null;
}

export interface SuddenDeath {
  active: boolean;
  contenders: string[];
}

export interface GameState {
  mode: 'timeline';
  phase: GamePhase;
  trackPool: Track[];
  usedTrackIds: string[];
  targetCards: number;
  shotClockMs: number;
  players: Record<string, TimelinePlayer>;
  /** Registration order — Record key order isn't guaranteed for UI iteration. */
  playerOrder: string[];
  round: Round | null;
  roundHistory: Round[];
  winnerUserIds: string[];
  suddenDeath: SuddenDeath | null;
  poolExhausted: boolean;
}
