# Family Leaderboard

A small read-only companion app (not a game) that shows the shared, family-wide history of finished hosted games — recent results plus a running "who's won the most" standings table. Built on the [games platform](../../README.md).

## What it shows

- **Recent games** — every finished hosted match across both games, newest first, with a one-line summary (final scores/winner for Family Feud, jackpot + who never missed a question for 1% Club).
- **Standings** — games played / games won, aggregated per nickname across every recorded game.

Filter by game with the tabs at the top.

## How results get here

Each game's `HostView` calls `recordGameResult(gameSlug, roomId, summary)` (from `@games/platform`) once a hosted match finishes — solo play never writes here, since there's no room to record against. This app just reads the `game_results` table via `fetchRecentResults()`.

## A known limitation, on purpose

There are no accounts in this platform (by design — see the root [README](../../README.md)), so standings are grouped by the **exact nickname string** a player typed when joining. If someone types a different name next time, it shows up as a new row. Fine if a family is consistent about names; not a robust identity system, and not meant to be one.

## Getting started

Run from the **repo root** (this is an npm-workspaces monorepo):

```bash
npm install            # once, at the root
npm run dev:leaderboard
```

Requires a root `.env` with Supabase keys (see [supabase/README.md](../../supabase/README.md)) — without one, this app just shows a "not configured" message, since it has nothing local to fall back to (unlike the games, it has no offline/solo mode).

## Deployment

Published at `https://glen155.github.io/Games/leaderboard/`, picked up automatically by the root `build:pages` script alongside the games. See the root [README](../../README.md#building-for-deployment).
