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
- **Private host judging panel** — when hosting, the host's own device shows every
  answer and point value up front (not just after reveal) so you can judge a
  spoken guess before tapping it. Solo/pass-the-device mode keeps the classic
  blind flip-board, since that screen is shared with the group; a TV or laptop
  can also join a hosted room as a plain player to act as an optional public
  board — nothing extra to set up
- **Steal mechanic** — three strikes hands the other team one shot to steal the
  pot, in both solo and hosted play
- **Team self-assignment** — joined players pick Team 1 or Team 2 for themselves
  from their phone; the host sees a live roster of who's on which team
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

- If you're hosting a room, your device shows every answer + point value up
  front (the **judging panel**) — check a spoken guess against it, then click
  the matching row to reveal it. In solo/pass-the-device mode the board stays
  blind (flip-to-reveal) since it's shared with the group.
- If a guess isn't on the board, press `X` (or click **Strike**) — three
  strikes hands control to the other team for a single **steal** attempt.
  Judge their guess the same way, then click **Steal Successful!** or **No
  Steal** to award the pot.
- Use `←` / `→` (or click a team panel) to mark which team currently has control
- Once a team locks in the round's pot, press `A` (or click that team's **Award** button) to add it to their score
- Press `N` to move to the next round, or `R` to reset the current round without touching scores
- Joined players can tap either team's score on their phone to join it — the
  host sees a live roster of who picked which team

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
