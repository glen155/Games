# Family Feud

A single-screen, host-controlled Family Feud board game — no accounts, no backend, just point-and-click (or keyboard) fun on whatever screen you gather around.

## Features

- 8 built-in rounds with survey-style answers and point values
- Flip-reveal answer board with a game-show look
- Two-team scoreboard with editable names and an "active team" highlight
- Strikes (up to 3) with a buzzer sound and a big red flash
- Synthesized sound effects (no audio files, works fully offline once loaded)
- Full keyboard shortcuts for the host, with on-screen button equivalents for mouse/touch

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL — on a laptop connected to a TV works great, or just pass the device around.

To sanity-check a production build locally:

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

Pushing to `main` automatically builds and deploys this app to GitHub Pages via `.github/workflows/deploy.yml`, publishing to `https://glen155.github.io/Games/`. (One-time setup: in the repo's Settings → Pages, set "Source" to "GitHub Actions".)
