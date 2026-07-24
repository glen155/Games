# 1% Club

A single-player trivia game based on the TV show — you against a simulated crowd of 100 and a jackpot, chasing the 1% question. No accounts, no backend, just point-and-click (or keyboard) fun.

## Features

- Single-player vs. a simulated crowd of 100 pretend contestants
- An original, 12-tier descending-difficulty question ladder (92% down to 1%), from easy general knowledge to lateral-thinking riddles
- Simulated pool-shrink after every correct answer, so you can see how many pretend contestants would still be with you
- All-or-nothing jackpot: one wrong answer and you're eliminated, survive to the final 1% question to win it all
- Synthesized sound effects (no audio files, works fully offline once loaded)
- Full keyboard shortcuts, with on-screen button equivalents for mouse/touch

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL.

To sanity-check a production build locally:

```bash
npm run build
npm run preview
```

## How to play

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

This game is published at `https://glen155.github.io/Games/1-percent-club/`, alongside the other games in this repo. See the root [README](../README.md) for how the overall site and deploy workflow are structured.
