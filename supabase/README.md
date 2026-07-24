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

| Table        | Purpose                                                        |
|--------------|----------------------------------------------------------------|
| `rooms`      | One row per live game session — code, game slug, host, expiry. |
| `players`    | Who has joined which room (used for read permissions).         |
| `game_state` | The authoritative game state (jsonb), one row per room.        |

Row Level Security is enabled on all three and is the real security boundary:

- Anyone signed in can look up a room **by code** (you need the code to find it).
- Only a room's **host** can write its `game_state`.
- Only the **host or a joined member** can read a room's state / roster.

See the comments in `migrations/0001_init.sql` for the exact policies.

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
