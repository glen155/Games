# Architecture

This document explains how the games platform is put together and why. It's the
map for adding new games and for understanding the multiplayer + security model.

## Goals

- **Many games, shared plumbing.** Each game implements only its own rules and
  screens; rooms, joining, live sync, and presence come from one shared package.
- **Zero-friction joining.** Family and friends join from their phones with a
  room code + a nickname. No accounts, no installs.
- **Safe by construction.** "Protected against hackers" without a login wall —
  the database enforces who can do what, so a determined guest can't cheat or
  snoop other rooms.
- **Cheap and low-ops.** Static frontend on GitHub Pages; a managed Supabase
  free-tier backend with no server to run.

## The pieces

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Host device (TV / laptop)  │        │  Player devices (phones)     │
│  GameShell → HostView       │        │  GameShell → PlayerView      │
│  owns authoritative state   │        │  live read-only mirror       │
└──────────────┬──────────────┘        └───────────────┬──────────────┘
               │                                        │
               │        Supabase Realtime channel       │
               │   room:<CODE>  (broadcast + presence)   │
               └────────────────────┬───────────────────┘
                                    │
                     ┌──────────────┴───────────────┐
                     │  Supabase Postgres (+ RLS)   │
                     │  rooms · players · game_state│
                     └──────────────────────────────┘
```

- **`packages/platform`** — the shared engine. Nothing game-specific lives here.
- **`games/*`** — each game, consuming the platform from source via an alias.
- **`supabase/`** — schema + Row Level Security, versioned as SQL.

## Core concepts

- **Room** — one running instance of one game, keyed by a random 6-char code.
  Has a game slug, a host, a status, and an expiry.
- **Host** — the device that created the room. The *only* device allowed to
  change authoritative game state.
- **Player** — any device that joined with a code + nickname. Sees live state
  and can send actions (buzz, guess) back to the host.

## The game plugin contract

A game plugs in by implementing `GameDefinition<State, Action>`
(`packages/platform/src/types.ts`):

```ts
interface GameDefinition<State, Action> {
  slug: string;
  displayName: string;
  createInitialState: () => State;
  reducer: (state: State, action: Action) => State;
  HostView: ComponentType<HostViewProps<State, Action>>;
  PlayerView: ComponentType<PlayerViewProps<State>>;
}
```

The game's reducer *is* the authoritative state machine. `GameShell` drives it —
locally in solo mode, or over a room when hosted — so the same `HostView` renders
either way. Family Feud's existing reducer moved onto this contract essentially
unchanged.

Mounting a game is one line:

```tsx
<GameShell game={familyFeud} />
```

`GameShell` handles the whole flow: **Host a game** / **Join a game** / **Play on
this device**, the join form, QR + room-code sharing, and the connecting/error
states.

## State synchronization

The source of truth is the host's in-memory reducer state. On every host
dispatch the platform:

1. applies the action locally (synchronously, so it has the resulting state),
2. **broadcasts** the new state on the room channel — fast live sync to all
   players, and
3. **upserts** it into the `game_state` Postgres row — durable, for catch-up.

A player device, on join, **fetches `game_state` once** to catch up to the game
in progress, then applies live broadcasts. When a new player appears (presence
sync), the host re-broadcasts current state so late joiners sync immediately.
This means a player can refresh mid-game and land back on the current board
instead of a reset. **Presence** on the same channel gives the live "who's in
the room" list for free.

Why broadcast for live sync instead of Postgres change-streams? It avoids a DB
read per client per update and keeps the hot path off the database, while the
`game_state` row still provides durability and late-join catch-up.

## Security model

The design keeps joining trivial while making the **database** the enforcement
point — not a secret stored in the client.

- **Anonymous auth.** Every device (host and players) silently signs in
  anonymously on load. No password UX, but each device gets a real, stable
  `auth.uid()` that policies can trust.
- **Row Level Security** (`supabase/migrations/0001_init.sql`) is the boundary:
  - any signed-in device may look up a room *by code* (the code is the gate);
  - only the room's host may write `game_state`;
  - only the host or a joined member may read a room's state / roster —
    preventing cross-room snooping or enumerating active games.
- **Unguessable, short-lived codes.** 6 chars over a 31-symbol,
  ambiguity-free alphabet (~887M combinations) plus a room expiry make
  brute-forcing impractical at this scale.
- **Only public values ship to the browser** — the Supabase URL + anon key.
  That's safe by design; the `service_role` key never touches the frontend.
- **No untrusted HTML.** Nicknames and other free text render through React's
  default escaping — no `dangerouslySetInnerHTML` anywhere.

Residual trust notes (acceptable for family use, worth knowing before opening it
wider) live in [`supabase/README.md`](../supabase/README.md#hardening-notes-residual-trust-model).

## Deployment

`scripts/build-pages.mjs` builds each game with its GitHub Pages base
(`/Games/<slug>/`) and assembles a single `_site/`: the landing page at the root
and each game under its slug. `.github/workflows/deploy.yml` runs it on push to
`main` and publishes to Pages, injecting the Supabase env vars from repository
secrets (absent → the site still deploys and runs in local single-device mode).

## Extending

To add a game: create `games/<slug>/`, implement a `GameDefinition`, mount it
with `<GameShell>`, and add a card to `landing/index.html`. Only build a second
game's abstractions once you actually have a second game — the platform contract
was validated against Family Feud first, on purpose.
