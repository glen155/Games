#!/usr/bin/env node
// Live end-to-end check of a Supabase project against this app's schema + RLS.
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the environment or a
// root .env file. Run: node scripts/verify-supabase.mjs
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader (no dependency), env vars still win.
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const info = (m) => console.log(`\n${m}`);

if (!url || !anonKey) {
  bad('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found (env or .env).');
  process.exit(1);
}
console.log(`Checking Supabase project: ${url}`);

let failures = 0;
const fail = (m) => { bad(m); failures += 1; };

const makeClient = () => createClient(url, anonKey, { auth: { persistSession: false } });

const CODE = 'TEST' + Math.floor(Math.random() * 90 + 10); // 6 chars, e.g. TEST42
let roomId = null;
let hostClient = null;

try {
  // 1) Anonymous auth (host)
  info('1. Anonymous sign-in (host device)');
  hostClient = makeClient();
  {
    const { data, error } = await hostClient.auth.signInAnonymously();
    if (error) fail(`Anonymous sign-in failed — enable it in Auth → Providers → Anonymous. (${error.message})`);
    else ok(`Signed in anonymously as ${data.user.id.slice(0, 8)}…`);
  }
  const { data: hostSession } = await hostClient.auth.getUser();
  const hostId = hostSession.user?.id;

  // 2) Host creates a room
  info('2. Host creates a room (rooms insert + RLS)');
  {
    const { data, error } = await hostClient
      .from('rooms')
      .insert({ code: CODE, game_slug: 'family-feud', host_user_id: hostId, status: 'lobby' })
      .select('id, code')
      .single();
    if (error) fail(`Could not create room — is the schema applied? (${error.message})`);
    else { roomId = data.id; ok(`Room ${data.code} created`); }
  }

  // 3) Host writes game state
  if (roomId) {
    info('3. Host writes game_state (host-only write policy)');
    const { error } = await hostClient.from('game_state').insert({ room_id: roomId, state: { hello: 'world' } });
    if (error) fail(`Host could not write game_state (${error.message})`);
    else ok('Host wrote authoritative state');
  }

  // 4) A DIFFERENT anonymous device (a player)
  info('4. Second device joins as a player');
  const playerClient = makeClient();
  const { data: pAuth, error: pErr } = await playerClient.auth.signInAnonymously();
  if (pErr) fail(`Player sign-in failed (${pErr.message})`);
  const playerId = pAuth?.user?.id;

  if (roomId && playerId) {
    // 4a) Player can look up the room by code
    const { data: found, error: lookErr } = await playerClient
      .from('rooms').select('id').eq('code', CODE).maybeSingle();
    if (lookErr || !found) fail(`Player could not look up room by code (${lookErr?.message ?? 'not found'})`);
    else ok('Player can find the room by code');

    // 4b) SECURITY: player must NOT be able to write game_state
    info('5. RLS enforcement — a non-host must be blocked from writing');
    const { error: hackErr } = await playerClient
      .from('game_state').update({ state: { hacked: true } }).eq('room_id', roomId);
    // With RLS, the update matches no permitted rows → no error but 0 rows changed.
    const { data: check } = await hostClient
      .from('game_state').select('state').eq('room_id', roomId).single();
    if (check?.state?.hacked) fail('SECURITY: a non-host was able to modify game state! Check RLS policies.');
    else ok('Non-host write was correctly blocked by RLS');

    // 4c) Player records membership, then can read state (member read policy)
    await playerClient.from('players').upsert(
      { room_id: roomId, user_id: playerId, nickname: 'Verifier' },
      { onConflict: 'room_id,user_id' },
    );
    const { data: readState, error: readErr } = await playerClient
      .from('game_state').select('state').eq('room_id', roomId).maybeSingle();
    if (readErr || !readState) fail(`Joined player could not read game_state (${readErr?.message ?? 'no row'})`);
    else ok('Joined player can read live state');
  }

  await playerClient.auth.signOut();
} catch (e) {
  fail(`Unexpected error: ${e.message}`);
} finally {
  // Cleanup: host deletes the test room (players/game_state cascade).
  if (roomId && hostClient) {
    await hostClient.from('rooms').delete().eq('id', roomId);
    await hostClient.auth.signOut();
  }
}

info(failures === 0
  ? '\x1b[32mAll checks passed — your Supabase backend is correctly configured.\x1b[0m'
  : `\x1b[31m${failures} check(s) failed — see above.\x1b[0m`);
process.exit(failures === 0 ? 0 : 1);
