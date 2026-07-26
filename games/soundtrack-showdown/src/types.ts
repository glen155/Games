export type MediaType = 'movie' | 'tv';

/**
 * Hosted-mode only setup choice. 'multiple_choice' is the original,
 * auto-scored flow. 'open_guess' has players call out their guess out loud
 * and the host taps who got it right — no player device ever sees options.
 * Solo play always behaves as 'multiple_choice', since there's no remote
 * host to judge a spoken guess.
 */
export type AnswerStyle = 'multiple_choice' | 'open_guess';

/**
 * One theme-song clue. `cueTitle`/`performedBy`/`correctTitle`/`sourceNote`
 * must never render before that round's reveal — see ClueLoader.tsx, which is
 * the one place this game touches a clue before reveal, and deliberately
 * never reads those fields.
 */
export interface SoundtrackClue {
  id: string;
  spotifyUri: string; // 'spotify:track:<id>' — deep-link target for the host device
  spotifyUrl: string; // 'https://open.spotify.com/track/<id>' — QR code target
  cueTitle: string; // theme/song title, e.g. "Hedwig's Theme" — reveal-only
  performedBy: string; // composer/artist, e.g. "John Williams" — reveal-only
  mediaType: MediaType;
  correctTitle: string; // must equal options[correctIndex] — reveal-only
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** Curator's citation for the movie/show attribution. Never rendered in-game. */
  sourceNote?: string;
}

/** One real player's submitted pick for the clue currently in play. */
export interface PlayerAnswer {
  nickname: string;
  index: number;
}

/** One real player's outcome for the clue that was just revealed. */
export interface PlayerClueResult {
  nickname: string;
  index: number | null; // null if they never locked in an answer
  correct: boolean;
}

/** Hosted-mode only: how the per-clue countdown behaves. */
export interface TimerConfig {
  mode: 'auto' | 'manual';
  durationSeconds: number;
}

// 'summary' is the solo-mode ending (single actor, no elimination — everyone
// answers every clue). 'ended' is the hosted-mode ending.
export type GamePhase =
  | 'setup'
  | 'loading_clue' // QR shown, host hasn't confirmed playback yet — both solo and hosted
  | 'answering'
  | 'reveal'
  | 'summary'
  | 'ended';

export interface GameState {
  clues: SoundtrackClue[];
  phase: GamePhase;
  currentClueIndex: number;
  /** Hosted-mode setup choice; stays at its default 'multiple_choice' in solo play. */
  answerStyle: AnswerStyle;

  // Solo-only.
  selectedOptionIndex: number | null;
  lastAnswerCorrect: boolean | null; // meaningful only during 'reveal'
  soloCorrectCount: number;

  // Hosted-mode only — always present but empty/unused in solo.
  playerAnswers: Record<string, PlayerAnswer>; // userId -> this clue's live pick
  lastPlayerResults: Record<string, PlayerClueResult> | null; // set on reveal
  playerCorrectCounts: Record<string, number>; // cumulative, across all clues

  // Hosted-mode only: per-clue countdown. timerEndsAt is an absolute epoch-ms
  // deadline (not a ticking counter), same design as 1% Club — every device
  // computes its own remaining time from one synced value. Set once the host
  // confirms playback (HOST_CONFIRMED_PLAYING), not at round start, since the
  // clock shouldn't run while the host is still scanning the QR code.
  timerConfig: TimerConfig;
  timerEndsAt: number | null;
}
