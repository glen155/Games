import { getSupabase } from './supabase';

export interface GameResult {
  id: string;
  roomId: string | null;
  gameSlug: string;
  finishedAt: string;
  summary: Record<string, unknown>;
}

/**
 * Records one finished hosted game to the shared, family-wide history. Best
 * effort — a failure here shouldn't interrupt the game, so it only warns.
 * No-ops in solo mode (no room, nothing to record) or when multiplayer isn't
 * configured.
 */
export async function recordGameResult(
  gameSlug: string,
  roomId: string,
  summary: Record<string, unknown>,
): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from('game_results').insert({ room_id: roomId, game_slug: gameSlug, summary });
  if (error) console.warn('Failed to record game result:', error.message);
}

/** Most recent finished games across all rooms, newest first. */
export async function fetchRecentResults(limit = 50): Promise<GameResult[]> {
  const client = getSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from('game_results')
    .select('id, room_id, game_slug, finished_at, summary')
    .order('finished_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('Failed to fetch game results:', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    roomId: row.room_id as string | null,
    gameSlug: row.game_slug as string,
    finishedAt: row.finished_at as string,
    summary: row.summary as Record<string, unknown>,
  }));
}
