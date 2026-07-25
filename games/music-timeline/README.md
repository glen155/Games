# Music Timeline

A Hitster-style music game built on the [games platform](../../README.md). A
song plays; every player secretly places it into their own chronological
timeline. Guess right and the card joins your timeline; guess wrong and it's
discarded, no penalty. First to fill their timeline wins. Play it three ways:

- **Host a game** — put it on the big screen and let everyone join from their
  phones with a room code (or QR) to place their guesses.
- **Join a game** — enter a host's room code + a nickname.
- **Play on this device** — add players by name on the lobby screen and pass
  the device around (or call out placements) for a shared-screen game.

## How a round works

1. The host scans the on-screen QR code (or opens the link) on whatever
   device is playing music, to start the next song in Spotify — the game
   doesn't stream audio itself.
2. Once it's playing, the host taps **Started Playing**, which starts the
   25-second shot clock.
3. Every player taps a gap in their own timeline (`‹ 1974 › 1988 ›`) and locks
   it in. The round resolves once everyone's locked in or the clock runs out.
4. The true year, title, and artist are revealed. Correct placements add the
   card to that player's timeline; wrong ones are discarded.
5. First player to reach the target card count (default 10) wins. A
   simultaneous finish is broken by fewest total misses, then by a
   sudden-death round between whoever's still tied.

**Keeping the year secret is the whole game.** Neither the host screen nor
any player device ever renders a track's year, title, or artist before that
round's reveal — check `TrackLoader.tsx` and `PlayerView.tsx` if you're
auditing this. Note this repo's platform is fully client-authoritative (see
the root [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)), so this is UI-level
hiding, the same trust model Family Feud already uses for its unrevealed
answers — not literal server-side secrecy. Good enough for a family game
night; don't rely on it against a player determined to open dev tools.

Playback control is manual by design for v1: no Spotify account
authorization, no Premium requirement — just a QR/deep-link handoff and a
host tap once the track is audibly playing. Whatever device is playing the
music should stay out of everyone's sight (including the host's) until
reveal, since Spotify's own now-playing screen shows the title/artist/art.

## Getting started

Run from the **repo root** (this is an npm-workspaces monorepo):

```bash
npm install            # once, at the root
npm run dev:music-timeline
```

Open the printed local URL. Multiplayer (host/join across devices) turns on
when a root `.env` with Supabase keys is present; otherwise it runs solo. See
the root [README](../../README.md) and [supabase/README.md](../../supabase/README.md).

To sanity-check a production build locally, from this folder:

```bash
npm run build
npm run preview
```

## Adding your own tracks

Edit `src/data/tracks.ts`. The placeholder pool ships with 16 well-known
songs, but every `spotifyUri`/`spotifyUrl` in it is a **placeholder** —
`spotify:track:PLACEHOLDER_...` — not a real Spotify track. Before real play:

1. Replace `spotifyUri`/`spotifyUrl` with the real track's Spotify URI/link.
2. Verify `year` against an authoritative source (Discogs, MusicBrainz, or
   the label's original press/release info) — **not** whatever Spotify's
   `album.release_date` says, since that field is frequently a reissue,
   remaster, or compilation date. A wrong year here is what breaks a
   Timeline game's trust fastest: a player who reasoned correctly still
   loses their card.
3. Record your source in `sourceNote` (never rendered in-game, it's just a
   citation for whoever curates the pool next).

```ts
{
  id: 'unique-slug-year',
  spotifyUri: 'spotify:track:REAL_22_CHAR_ID',
  spotifyUrl: 'https://open.spotify.com/track/REAL_22_CHAR_ID',
  title: 'Song Title',
  artist: 'Artist Name',
  year: 1999, // verified ORIGINAL release year
  sourceNote: 'Discogs: <link>',
},
```

Spread years across decades and include the occasional same-year pair — the
game handles duplicate years correctly (either adjacent gap counts as
correct), but it's worth testing.

## Deployment

Handled at the repo level: pushing to `main` builds every game plus the
landing page and deploys to GitHub Pages, so this game lands at
`https://glen155.github.io/Games/music-timeline/`. See the root
[README](../../README.md#building-for-deployment) for the one-time Pages
setup and the Supabase secrets that enable multiplayer.
