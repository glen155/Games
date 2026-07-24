# Games

A small platform for family & friends party games. One screen hosts the game
(the TV/laptop), and anyone can join from their own phone with a short room
code — no accounts, no app installs.

Play at **https://glen155.github.io/Games/**.

## How it's built

This is an npm-workspaces monorepo:

```
packages/platform     Shared multiplayer engine — every game builds on this.
                      Rooms, join-by-code + QR, live sync, presence, the
                      Host / Player / Solo flow (GameShell).
games/family-feud     The first game, built on the platform.
supabase/migrations   Database schema + Row Level Security (the security model).
landing/              The static landing page listing all games.
scripts/              build-pages.mjs — builds every game for GitHub Pages.
```

### The multiplayer model (in one paragraph)

Each game session is a **room** with a random 6-character code. The **host**
device owns the authoritative game state; every **player** device gets a live,
read-only mirror over Supabase Realtime and can send actions back (buzz, guess).
Joining takes a code + a nickname — nothing else. See
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full design and
[supabase/README.md](./supabase/README.md) to stand up the backend.

**Security**, in short: every device signs in anonymously (so it has a real,
stable identity), and **Row Level Security** on the database — not the secrecy
of any client value — is what actually enforces "only the host can change the
game, only members can read a room." Room codes are unguessable and rooms
expire. Nothing but the public Supabase URL + anon key ever reaches the browser.

## Running locally

```bash
npm install                 # once, at the repo root — installs all workspaces
npm run dev:family-feud      # start Family Feud in dev mode
```

Without Supabase configured, games run in **local single-device mode** (pass the
device around — works fully offline). To enable "host / join from other
devices," copy `.env.example` to `.env` and fill in your Supabase project's URL
and anon key (see [supabase/README.md](./supabase/README.md)).

## Building for deployment

```bash
npm run build:pages          # builds every game + landing into _site/
```

Pushing to `main` runs `.github/workflows/deploy.yml`, which does the same and
publishes to GitHub Pages. (One-time setup: repo Settings → Pages → Source =
"GitHub Actions", and add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as
repository secrets to enable multiplayer on the deployed site.)

## Adding a new game

1. Create `games/<slug>/` (copy `games/family-feud/`'s config as a starting
   point; set its Vite `base` to `/Games/<slug>/`).
2. Implement a `GameDefinition` — your reducer plus a `HostView` and
   `PlayerView` — and mount it with `<GameShell game={yourGame} />`.
3. Add a card to `landing/index.html`.

The platform handles rooms, joining, sync, and presence for you — a game only
implements its own rules and screens.
