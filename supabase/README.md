# Supabase backend

The multiplayer backbone runs on a single free-tier Supabase project (Postgres +
Realtime + anonymous Auth). This folder holds the versioned schema.

## One-time setup

1. **Create a project** at [supabase.com](https://supabase.com) (the free tier
   is plenty for family-scale use).

2. **Enable anonymous sign-ins.** Dashboard → Authentication → Providers →
   **Anonymous** → enable. This is what gives every device a stable identity for
   Row Level Security without any login UX.

3. **Apply the schema.** Either:
   - Paste [`migrations/0001_init.sql`](./migrations/0001_init.sql) into the
     Dashboard → SQL Editor and run it, or
   - Use the Supabase CLI: `supabase db push`.

4. **Copy your public keys** into the app. Dashboard → Project Settings → API:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

   Put these in a root `.env` (see `.env.example`) for local dev, and in the
   repo's GitHub Actions secrets for the deployed site. **Never** put the
   `service_role` key in the app — only these two public values belong there.

## What's in the schema

| Table          | Purpose                                                        |
|----------------|-----------------------------------------------------------------|
| `rooms`        | One row per live game session — code, game slug, host, expiry. |
| `players`      | Who has joined which room (used for read permissions).         |
| `game_state`   | The authoritative game state (jsonb), one row per room.        |
| `game_results` | Cross-night history — one row per finished hosted game, shared family-wide (not room-scoped). |

Row Level Security is enabled on all four and is the real security boundary:

- Anyone signed in can look up a room **by code** (you need the code to find it).
- Only a room's **host** can write its `game_state`.
- Only the **host or a joined member** can read a room's state / roster.
- Any signed-in device can **read** `game_results` (it's the shared family
  leaderboard, not scoped to a single room); only a room's **host** can insert
  the one result row for that room. Append-only — no update/delete policy.

See the comments in `migrations/0001_init.sql` and `migrations/0002_game_results.sql`
for the exact policies. Apply new migrations the same way as the initial schema
(paste into the SQL Editor, or `supabase db push`).

## Deploying the `generate-round` Edge Function

Both games can optionally generate fresh round content on demand (a themed
Family Feud round, or a themed set of 1% Club trivia questions) instead of
using the built-in static question bank. This is powered by one Edge
Function, [`functions/generate-round/index.ts`](./functions/generate-round/index.ts):

- **Family Feud** rounds are LLM-generated via the Anthropic API — a human
  host always judges correctness in this game, so creative/subjective content
  generation is a safe fit.
- **1% Club** questions are sourced from the free, keyless
  [Open Trivia DB](https://opentdb.com/) instead of an LLM — this game's
  correctness is objective and asserted by the app with no human check,
  exactly where an LLM is most likely to confidently hallucinate a wrong
  "fact". A vetted trivia dataset is the safer choice here.

To deploy it (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
supabase link --project-ref <your-project-ref>   # find it in the dashboard URL
supabase functions deploy generate-round
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Until this is deployed, both games' "Generate a round" buttons will fail
with "Failed to send a request to the Edge Function" — that's expected, and
falling back to "Play the classic rounds" / the static question bank works
fine without it.

The Anthropic key is only needed for the Family Feud path — 1% Club's Open
Trivia DB calls need no secret. Leave the function's default "Verify JWT"
setting **on**, so only signed-in (anonymous-auth) devices can call it.

If the function isn't deployed, or a generation call fails for any reason,
both games fall back to their built-in static question bank — generation is
a pure enhancement, never a requirement to play.

## Housekeeping (optional but recommended)

Rooms carry an `expires_at` (default 12h). To auto-purge them, enable the
`pg_cron` extension and schedule the included function:

```sql
select cron.schedule('purge-expired-rooms', '0 * * * *',
  $$ select public.purge_expired_rooms(); $$);
```

`players` and `game_state` cascade-delete with their room.

## Hardening notes (residual trust model)

For family/friends use, the layered defense here — anonymous auth + RLS +
unguessable, short-lived room codes — is a sensible stopping point. Two things
to be aware of if you ever open this up more widely:

- **Realtime broadcast** (the live host→player state channel) is reachable by
  anyone who is signed in and knows the room code, same as the code itself. It
  carries only game state, not secrets. For stricter control, Supabase supports
  RLS-authorized Realtime channels.
- There is no per-IP **rate limiting** on room-code guessing. The keyspace
  (~887M codes) plus short room lifetimes make this impractical to abuse at this
  scale, but a public deployment could add an edge function or Supabase's
  built-in rate limits.
