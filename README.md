# Games

A small collection of party/web games, built one at a time. Each game lives in its own self-contained subfolder with its own `package.json` and README.

## Games in this repo

- **[Family Feud](./family-feud/)** — a single-screen, host-controlled Family Feud board game for playing with friends. Play at https://glen155.github.io/Games/family-feud/. See [family-feud/README.md](./family-feud/README.md) for setup and how to host a game.
- **[1% Club](./1-percent-club/)** — a single-player trivia game where you answer increasingly hard questions against a simulated crowd of 100, chasing a jackpot. Play at https://glen155.github.io/Games/1-percent-club/. See [1-percent-club/README.md](./1-percent-club/README.md) for setup and how to play.

The hub page at https://glen155.github.io/Games/ (served from [`landing/`](./landing/)) links out to both games, each deployed under its own subpath.

## Conventions

Each new game gets its own top-level folder plus its own README explaining how to run and play it. The root `landing/` folder holds the static hub page linking to every game; it is not itself a game.
