import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * The two PUBLIC values needed to reach Supabase from the browser. They are
 * injected at build time via Vite env vars. Shipping them to the client is safe
 * by design — Row Level Security on the database, not the secrecy of the anon
 * key, is what actually protects the data.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when the app was built with Supabase credentials. When false, games fall
 * back to fully local single-device play and never attempt any network calls.
 */
export const isMultiplayerConfigured = Boolean(url && anonKey);

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a lazily-created, shared Supabase client, or null when multiplayer is
 * not configured. Anonymous auth is persisted so a device keeps a stable
 * identity across refreshes (important: RLS keys off auth.uid()).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isMultiplayerConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

/**
 * Ensures the current device is signed in (anonymously) and returns its stable
 * user id. No password, no UX — but every device gets a real auth.uid() that
 * RLS policies can trust.
 */
export async function ensureSignedIn(client: SupabaseClient): Promise<string> {
  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session?.user) {
    return sessionData.session.user.id;
  }
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(error?.message ?? 'Anonymous sign-in failed');
  }
  return data.user.id;
}
