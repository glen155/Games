# Family Feud

A Family Feud board game built on the [games platform](../../README.md). Play it
three ways:

- **Host a game** — put it on the big screen and let everyone join from their
  phones with a room code (or QR) to follow along and buzz in.
- **Join a game** — enter a host's room code + a nickname.
- **Play on this device** — one screen, pass it around, works fully offline.

## Features

- 8 built-in rounds with survey-style answers and point values
- Flip-reveal answer board with a game-show look
- Two-team scoreboard with editable names and an "active team" highlight
- Strikes (up to 3) with a buzzer sound and a big red flash
- Live player view on phones — the board mirrors the host (revealed answers only,
  so nothing leaks) with a big **Buzz** button that lights up the host screen
- Synthesized sound effects (no audio files, works fully offline once loaded)
- Full keyboard shortcuts for the host, with on-screen button equivalents for mouse/touch

## Getting started

Run from the **repo root** (this is an npm-workspaces monorepo):

```bash
npm install            # once, at the root
npm run dev:family-feud
```

Open the printed local URL — on a laptop connected to a TV works great, or just
pass the device around. Multiplayer (host/join across devices) turns on when a
root `.env` with Supabase keys is present; otherwise it runs solo. See the root
[README](../../README.md) and [supabase/README.md](../../supabase/README.md).

To sanity-check a production build locally, from this folder:

```bash
npm run build
npm run preview
```

## How to host a game

Split into two teams. For each round, read the category out loud. As players guess answers:

- Click an answer slot (or press `1`–`8`) to reveal it if it's on the board
- If a guess isn't on the board, press `X` (or click **Strike**) — three strikes and control passes
- Use `←` / `→` (or click a team panel) to mark which team currently has control
- Once a team locks in the round's pot, press `A` (or click that team's **Award** button) to add it to their score
- Press `N` to move to the next round, or `R` to reset the current round without touching scores

| Key | Action |
|---|---|
| `1`–`8` | Reveal that answer slot |
| `X` | Strike |
| `←` / `→` | Set active team (Team 1 / Team 2) |
| `A` | Award current pot to the active team |
| `R` | Reset round (keeps scores) |
| `N` / `P` | Next / previous round |
| `M` | Toggle mute |

Every shortcut also has an on-screen button, so a host can play entirely with a mouse or touchscreen.

## Adding your own rounds

Edit `src/data/rounds.ts`. Each category needs exactly 8 answers (descending by points) to keep the board layout consistent:

```ts
{
  name: 'Your Category Name',
  answers: [
    { text: 'Top answer', points: 32 },
    // ... 7 more, descending points
  ],
},
```

## Deployment

Handled at the repo level: pushing to `main` builds every game plus the landing
page and deploys to GitHub Pages, so this game lands at
`https://glen155.github.io/Games/family-feud/`. See the root
[README](../../README.md#building-for-deployment) for the one-time Pages setup
and the Supabase secrets that enable multiplayer.
