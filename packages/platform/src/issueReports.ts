import { getSupabase } from './supabase';

export interface IssueReport {
  id: string;
  roomId: string | null;
  gameSlug: string;
  itemId: string;
  itemLabel: string | null;
  reason: string;
  reportedAt: string;
  reviewed: boolean;
}

/**
 * Flags a broken/incorrect item (a track, a clue) for later review. Best
 * effort — never throws; no-ops when multiplayer isn't configured. `roomId`
 * is null for solo play.
 */
export async function reportIssue(
  gameSlug: string,
  itemId: string,
  itemLabel: string | null,
  reason: string,
  roomId: string | null = null,
): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client
    .from('issue_reports')
    .insert({ room_id: roomId, game_slug: gameSlug, item_id: itemId, item_label: itemLabel, reason });
  if (error) console.warn('Failed to report issue:', error.message);
}

/** All reported issues, newest first — used by the Leaderboard app's review tab. */
export async function fetchIssueReports(limit = 200): Promise<IssueReport[]> {
  const client = getSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from('issue_reports')
    .select('id, room_id, game_slug, item_id, item_label, reason, reported_at, reviewed')
    .order('reported_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('Failed to fetch issue reports:', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    roomId: row.room_id as string | null,
    gameSlug: row.game_slug as string,
    itemId: row.item_id as string,
    itemLabel: row.item_label as string | null,
    reason: row.reason as string,
    reportedAt: row.reported_at as string,
    reviewed: row.reviewed as boolean,
  }));
}

/** Marks (or unmarks) a report reviewed. Best effort, warn-only. */
export async function setIssueReportReviewed(id: string, reviewed: boolean): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from('issue_reports').update({ reviewed }).eq('id', id);
  if (error) console.warn('Failed to update issue report:', error.message);
}
