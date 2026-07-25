import type { Card, GameState, Round, RoundResult, Track } from '../types';

export const DEFAULT_TARGET_CARDS = 10;
export const DEFAULT_SHOT_CLOCK_MS = 25000;

export type MusicTimelineAction =
  | { type: 'PLAYER_JOINED'; userId: string; nickname: string }
  | { type: 'START_ROUND'; at: number }
  | { type: 'HOST_CONFIRMED_PLAYING'; at: number }
  | { type: 'LOCK_GUESS'; userId: string; gapIndex: number; receivedAt: number }
  | { type: 'SHOT_CLOCK_EXPIRED' }
  | { type: 'REVEAL_ROUND' }
  | { type: 'ADVANCE_ROUND'; at: number }
  | { type: 'RESET_GAME' };

export function createInitialState(trackPool: Track[]): GameState {
  return {
    mode: 'timeline',
    phase: 'lobby',
    trackPool,
    usedTrackIds: [],
    targetCards: DEFAULT_TARGET_CARDS,
    shotClockMs: DEFAULT_SHOT_CLOCK_MS,
    players: {},
    playerOrder: [],
    round: null,
    roundHistory: [],
    winnerUserIds: [],
    suddenDeath: null,
    poolExhausted: false,
  };
}

export function gameReducer(state: GameState, action: MusicTimelineAction): GameState {
  switch (action.type) {
    case 'PLAYER_JOINED': {
      if (state.phase !== 'lobby' || state.players[action.userId]) return state;
      return {
        ...state,
        players: {
          ...state.players,
          [action.userId]: {
            userId: action.userId,
            nickname: action.nickname,
            timeline: [],
            misses: 0,
          },
        },
        playerOrder: [...state.playerOrder, action.userId],
      };
    }

    case 'START_ROUND': {
      if (state.phase !== 'lobby' || state.playerOrder.length === 0) return state;
      return beginNextRound(state);
    }

    case 'HOST_CONFIRMED_PLAYING': {
      if (state.phase !== 'loading_track' || !state.round) return state;
      return {
        ...state,
        phase: 'playing',
        round: {
          ...state.round,
          startedAt: action.at,
          deadline: action.at + state.round.shotClockMs,
        },
      };
    }

    case 'LOCK_GUESS': {
      if (state.phase !== 'playing' || !state.round) return state;
      const player = state.players[action.userId];
      if (!player) return state;
      const eligible = state.round.eligibleUserIds;
      if (eligible && !eligible.includes(action.userId)) return state;
      if (action.gapIndex < 0 || action.gapIndex > player.timeline.length) return state;
      return {
        ...state,
        round: {
          ...state.round,
          locks: {
            ...state.round.locks,
            [action.userId]: {
              userId: action.userId,
              gapIndex: action.gapIndex,
              receivedAt: action.receivedAt,
            },
          },
        },
      };
    }

    case 'SHOT_CLOCK_EXPIRED': {
      if (state.phase !== 'playing' || !state.round) return state;
      return { ...state, phase: 'locked' };
    }

    case 'REVEAL_ROUND': {
      if (state.phase !== 'locked' || !state.round) return state;
      return revealRound(state);
    }

    case 'ADVANCE_ROUND': {
      if (state.phase !== 'reveal' || !state.round) return state;
      const archivedHistory = [...state.roundHistory, state.round].slice(-20);
      const stateWithHistory = { ...state, roundHistory: archivedHistory };
      if (state.winnerUserIds.length > 0) {
        return { ...stateWithHistory, phase: 'game_over', round: null };
      }
      return beginNextRound(stateWithHistory);
    }

    case 'RESET_GAME':
      return createInitialState(state.trackPool);

    default:
      return state;
  }
}

/** Picks a random unused track and moves the game into `loading_track`. If the
 * pool is exhausted, ends the game with a best-effort standings winner instead. */
function beginNextRound(state: GameState): GameState {
  const available = state.trackPool.filter((t) => !state.usedTrackIds.includes(t.id));
  if (available.length === 0) {
    return {
      ...state,
      phase: 'game_over',
      poolExhausted: true,
      round: null,
      winnerUserIds:
        state.winnerUserIds.length > 0 ? state.winnerUserIds : standingsLeaders(state),
    };
  }

  const track = available[Math.floor(Math.random() * available.length)];
  const round: Round = {
    index: state.roundHistory.length,
    trackId: track.id,
    trueYear: track.year,
    eligibleUserIds: state.suddenDeath?.active ? state.suddenDeath.contenders : null,
    startedAt: null,
    shotClockMs: state.shotClockMs,
    deadline: null,
    locks: {},
    results: null,
  };

  return {
    ...state,
    phase: 'loading_track',
    usedTrackIds: [...state.usedTrackIds, track.id],
    round,
  };
}

/** Best-effort winner when the pool runs out mid-game: most cards, fewest misses. */
function standingsLeaders(state: GameState): string[] {
  if (state.playerOrder.length === 0) return [];
  const maxCards = Math.max(...state.playerOrder.map((id) => state.players[id].timeline.length));
  const leaders = state.playerOrder.filter((id) => state.players[id].timeline.length === maxCards);
  const minMisses = Math.min(...leaders.map((id) => state.players[id].misses));
  return leaders.filter((id) => state.players[id].misses === minMisses);
}

/** Range of gap indices that are correct for placing `trueYear` into `timeline`. */
function resolveGapRange(timeline: Card[], trueYear: number): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const card of timeline) {
    if (card.year < trueYear) {
      min += 1;
      max += 1;
    } else if (card.year === trueYear) {
      max += 1;
    }
  }
  return { min, max };
}

function insertCardSorted(timeline: Card[], card: Card): Card[] {
  const next = [...timeline];
  let i = 0;
  while (i < next.length && next[i].year <= card.year) i += 1;
  next.splice(i, 0, card);
  return next;
}

function revealRound(state: GameState): GameState {
  const round = state.round!;
  const track = state.trackPool.find((t) => t.id === round.trackId)!;
  const players = { ...state.players };
  const results: Record<string, RoundResult> = {};

  for (const userId of Object.keys(round.locks)) {
    const lock = round.locks[userId];
    const player = players[userId];
    if (!player) continue;

    const { min, max } = resolveGapRange(player.timeline, round.trueYear);
    const correct = lock.gapIndex >= min && lock.gapIndex <= max;

    if (correct) {
      const card: Card = {
        trackId: track.id,
        year: track.year,
        title: track.title,
        artist: track.artist,
      };
      players[userId] = { ...player, timeline: insertCardSorted(player.timeline, card) };
      results[userId] = { userId, correct: true, gapIndex: lock.gapIndex, card };
    } else {
      players[userId] = { ...player, misses: player.misses + 1 };
      results[userId] = { userId, correct: false, gapIndex: lock.gapIndex };
    }
  }

  return applyWinCheck({
    ...state,
    phase: 'reveal',
    players,
    round: { ...round, results },
  });
}

/** Decides whether this reveal ends the game outright, keeps playing, or opens
 * (or continues) a sudden-death round. Mirrors the same round/reveal machinery
 * for both normal rounds and sudden-death rounds — only the candidate pool and
 * "who improved" test differ. */
function applyWinCheck(state: GameState): GameState {
  const round = state.round!;

  if (round.eligibleUserIds) {
    // Sudden-death round: contenders already share the game lead with equal
    // misses. Whoever placed correctly this round wins outright; if the
    // outcome is still tied, narrow the contenders and loop.
    const contenders = round.eligibleUserIds;
    const results = round.results!;
    const correctIds = contenders.filter((id) => results[id]?.correct);
    const pool = correctIds.length > 0 ? correctIds : contenders;
    const minMisses = Math.min(...pool.map((id) => state.players[id].misses));
    const stillTied = pool.filter((id) => state.players[id].misses === minMisses);

    return stillTied.length === 1
      ? { ...state, winnerUserIds: stillTied, suddenDeath: null }
      : { ...state, suddenDeath: { active: true, contenders: stillTied } };
  }

  const winCandidates = state.playerOrder.filter(
    (id) => state.players[id].timeline.length >= state.targetCards,
  );
  if (winCandidates.length === 0) return state;
  if (winCandidates.length === 1) return { ...state, winnerUserIds: winCandidates };

  const minMisses = Math.min(...winCandidates.map((id) => state.players[id].misses));
  const stillTied = winCandidates.filter((id) => state.players[id].misses === minMisses);

  return stillTied.length === 1
    ? { ...state, winnerUserIds: stillTied }
    : { ...state, suddenDeath: { active: true, contenders: stillTied } };
}
