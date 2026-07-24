import { getSupabase } from './supabase';

/**
 * Thin wrapper over a Supabase Edge Function call. Returns null when
 * multiplayer isn't configured (no Supabase project) — callers should treat
 * that the same as any other failure and fall back to their static content.
 */
export async function callEdgeFunction<T>(name: string, body: object): Promise<T> {
  const client = getSupabase();
  if (!client) throw new Error('Multiplayer is not configured for this app.');

  const { data, error } = await client.functions.invoke(name, { body });
  if (error) throw new Error(error.message ?? `Edge function "${name}" failed`);
  return data as T;
}
