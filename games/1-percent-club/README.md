# 1% Club

A trivia game based on the TV show — a jackpot chased against a simulated crowd of 100, all the way to the 1% question. Built on the [games platform](../../README.md): play solo on one device, or host it and let friends join from their phones to answer along.

## Features

- A simulated crowd of 100 pretend contestants drives the jackpot narrative — the same in solo *and* hosted play, so the tension of "who'd survive this one" is never diluted by real players' answers
- An original, 12-tier descending-difficulty question ladder (92% down to 1%), from easy general knowledge to lateral-thinking riddles
- **Solo mode** — the classic single-player game: one wrong answer and you're eliminated, survive to the final 1% question to win it all
- **Hosted mode** — host on the big screen, everyone else joins from their phones with a room code and answers each question for bragging rights. The host walks the group through a live "who got it right" reveal each round; one miss takes you out of the running for the leaderboard, but you keep answering every remaining question for fun — no one has to stop playing
- **Host-configurable countdown timer** (hosted mode) — set it to auto-start the
  moment each question appears (default: 30s) or start it manually per
  question, so games don't stall waiting on slow answers. The host can always
  reveal early regardless of the clock
- Synthesized sound effects (no audio files, works fully offline once loaded)
- Full keyboard shortcuts in solo mode, with on-screen button equivalents for mouse/touch

## Getting started

Run from the **repo root** (this is an npm-workspaces monorepo):

```bash
npm install            # once, at the root
npm run dev:1-percent-club
```

Open the printed local URL. Multiplayer (host/join across devices) turns on when a root `.env` with Supabase keys is present; otherwise it runs solo. See the root [README](../../README.md) and [supabase/README.md](../../supabase/README.md).

To sanity-check a production build locally, from this folder:

```bash
npm run build
npm run preview
```

## How to play solo

1. Enter a jackpot amount and start the game.
2. Answer each multiple-choice question — questions get harder as you go, and each is labelled with the percentage of the original 100 who'd get it right.
3. Get one wrong and you're eliminated — the jackpot rolls over.
4. Answer the final 1% question correctly and you win the whole jackpot.

| Key | Action |
|---|---|
| `1`–`4` | Select an option |
| `Enter` | Confirm answer / advance to the next question |
| `R` | Restart |
| `M` | Toggle mute |

Every shortcut also has an on-screen button, so you can play entirely with a mouse or touchscreen.

## How to host a game

1. From the landing screen, choose **Host a game** and set the jackpot amount.
2. Share the room code (or QR) — everyone joins from their own phone with a nickname.
3. Each question, players pick an answer on their phone. By default a 30-second
   timer starts automatically and auto-reveals when it runs out — switch it to
   **Manual** in the timer controls to start it yourself instead, or adjust the
   duration. The host can also click **Reveal Answers** any time to skip ahead.
4. The simulated crowd always makes it to the end (that's the point of it being simulated) — the game concludes with a leaderboard of real players, ranked by correct answers, with a shout-out to anyone who never missed one.

## Adding your own questions

Edit `src/data/questions.ts`. Each tier needs a `percent` (the % of the original 100 who'd answer correctly), a `prompt`, exactly 4 `options`, and a `correctIndex`. Keep the list sorted from highest percent to lowest:

```ts
{
  percent: 45,
  prompt: 'Your question here?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctIndex: 0,
},
```

## Deployment

This game is published at `https://glen155.github.io/Games/1-percent-club/`, alongside the other games in this repo. See the root [README](../../README.md) for how the overall site and deploy workflow are structured.
