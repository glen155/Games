import type { Track } from '../types';

/**
 * Curated pool for Timeline mode. `year` is the field the whole game hinges on
 * — it's the verified ORIGINAL SINGLE release year (per Wikipedia's infobox
 * "Released" date for each song), not an album date, remaster date, or the
 * year a song happened to chart. Two entries below (Sweet Child o' Mine,
 * Toxic) were deliberately re-checked and corrected during curation — their
 * album years are a year earlier than their actual single release, exactly
 * the kind of trap this field exists to avoid.
 *
 * Spotify links were sourced via web search against real open.spotify.com
 * track pages, not guessed — but this sandbox's network policy blocks direct
 * fetches to open.spotify.com, so none of them were independently re-loaded
 * and eyeballed after picking. Do a quick scan-and-listen pass on each before
 * relying on this pool for real play.
 */
export const tracks: Track[] = [
  {
    id: 'beatles-hey-jude-1968',
    spotifyUri: 'spotify:track:0eY0YgyLAZ4gtM57wwYN7H',
    spotifyUrl: 'https://open.spotify.com/track/0eY0YgyLAZ4gtM57wwYN7H',
    title: 'Hey Jude',
    artist: 'The Beatles',
    year: 1968,
    sourceNote: 'Wikipedia: released as a non-album single, August 1968.',
  },
  {
    id: 'gaye-whats-going-on-1971',
    spotifyUri: 'spotify:track:7ro3Wru6pHfSUYTh8U0snG',
    spotifyUrl: 'https://open.spotify.com/track/7ro3Wru6pHfSUYTh8U0snG',
    title: "What's Going On",
    artist: 'Marvin Gaye',
    year: 1971,
    sourceNote: 'Wikipedia: released January 21, 1971 (Tamla/Motown).',
  },
  {
    id: 'queen-bohemian-rhapsody-1975',
    spotifyUri: 'spotify:track:32mwlJqE38D1qCoFwVjgpZ',
    spotifyUrl: 'https://open.spotify.com/track/32mwlJqE38D1qCoFwVjgpZ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    year: 1975,
    sourceNote: 'Widely documented single release, October 31, 1975 (EMI).',
  },
  {
    id: 'abba-dancing-queen-1976',
    spotifyUri: 'spotify:track:0GjEhVFGZW8afUYGChu3Rr',
    spotifyUrl: 'https://open.spotify.com/track/0GjEhVFGZW8afUYGChu3Rr',
    title: 'Dancing Queen',
    artist: 'ABBA',
    year: 1976,
    sourceNote: 'Lead single from Arrival (1976); Swedish release August 1976.',
  },
  {
    id: 'jackson-billie-jean-1983',
    spotifyUri: 'spotify:track:6aLWY1Lax3ASlHzNAl2xRZ',
    spotifyUrl: 'https://open.spotify.com/track/6aLWY1Lax3ASlHzNAl2xRZ',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    year: 1983,
    sourceNote: 'Wikipedia infobox: released January 2, 1983 (single, not the 1982 Thriller album date).',
  },
  {
    id: 'madonna-like-a-virgin-1984',
    spotifyUri: 'spotify:track:1iaIEmZHrjGzWUmJ9BaFr6',
    spotifyUrl: 'https://open.spotify.com/track/1iaIEmZHrjGzWUmJ9BaFr6',
    title: 'Like a Virgin',
    artist: 'Madonna',
    year: 1984,
    sourceNote: 'Lead single, released October 31, 1984.',
  },
  {
    id: 'gnr-sweet-child-o-mine-1988',
    spotifyUri: 'spotify:track:7snQQk1zcKl8gZ92AnueZW',
    spotifyUrl: 'https://open.spotify.com/track/7snQQk1zcKl8gZ92AnueZW',
    title: "Sweet Child o' Mine",
    artist: "Guns N' Roses",
    year: 1988,
    sourceNote:
      'Wikipedia infobox: single released June 3, 1988 — corrected from an earlier placeholder of 1987 (the Appetite for Destruction album year).',
  },
  {
    id: 'nirvana-smells-like-teen-spirit-1991',
    spotifyUri: 'spotify:track:1f3yAtsJtY87CTmM8RLnxf',
    spotifyUrl: 'https://open.spotify.com/track/1f3yAtsJtY87CTmM8RLnxf',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    year: 1991,
    sourceNote: 'Lead single from Nevermind, released September 10, 1991.',
  },
  {
    id: 'oasis-wonderwall-1995',
    spotifyUri: 'spotify:track:0dD4myangln1RRBzwWUcIQ',
    spotifyUrl: 'https://open.spotify.com/track/0dD4myangln1RRBzwWUcIQ',
    title: 'Wonderwall',
    artist: 'Oasis',
    year: 1995,
    sourceNote: 'Released October 30, 1995 (Creation Records).',
  },
  {
    id: 'spears-baby-one-more-time-1998',
    spotifyUri: 'spotify:track:52SrRaRC2SlJ2dno1flkg2',
    spotifyUrl: 'https://open.spotify.com/track/52SrRaRC2SlJ2dno1flkg2',
    title: '...Baby One More Time',
    artist: 'Britney Spears',
    year: 1998,
    sourceNote: 'Wikipedia infobox: released September 29, 1998 (Jive) — a year ahead of the 1999 album.',
  },
  {
    id: 'outkast-hey-ya-2003',
    spotifyUri: 'spotify:track:4lgacVkp03sUCDEItoksAS',
    spotifyUrl: 'https://open.spotify.com/track/4lgacVkp03sUCDEItoksAS',
    title: 'Hey Ya!',
    artist: 'OutKast',
    year: 2003,
    sourceNote: 'Released August 25, 2003, from Speakerboxxx/The Love Below.',
  },
  {
    id: 'spears-toxic-2004',
    spotifyUri: 'spotify:track:6y86DN9dY6SMLuJjGNpGNI',
    spotifyUrl: 'https://open.spotify.com/track/6y86DN9dY6SMLuJjGNpGNI',
    title: 'Toxic',
    artist: 'Britney Spears',
    year: 2004,
    sourceNote:
      'Wikipedia infobox: single released January 13, 2004 — corrected from an earlier placeholder of 2003 (the In the Zone album year).',
  },
  {
    id: 'adele-rolling-in-the-deep-2010',
    spotifyUri: 'spotify:track:1CkvWZme3pRgbzaxZnTl5X',
    spotifyUrl: 'https://open.spotify.com/track/1CkvWZme3pRgbzaxZnTl5X',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    year: 2010,
    sourceNote: 'Wikipedia infobox: released November 29, 2010 (a year ahead of the 2011 album 21).',
  },
  {
    id: 'ronson-uptown-funk-2014',
    spotifyUri: 'spotify:track:6jZdYcQXv0XIdOwn3BFVrc',
    spotifyUrl: 'https://open.spotify.com/track/6jZdYcQXv0XIdOwn3BFVrc',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    year: 2014,
    sourceNote: 'Released November 10, 2014.',
  },
  {
    id: 'sheeran-shape-of-you-2017',
    spotifyUri: 'spotify:track:3kisQ0qktDJIGbOfjL22eG',
    spotifyUrl: 'https://open.spotify.com/track/3kisQ0qktDJIGbOfjL22eG',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    year: 2017,
    sourceNote: 'Released January 6, 2017, from ÷ (Divide).',
  },
  {
    id: 'weeknd-blinding-lights-2019',
    spotifyUri: 'spotify:track:0sf12qNH5qcw8qpgymFOqD',
    spotifyUrl: 'https://open.spotify.com/track/0sf12qNH5qcw8qpgymFOqD',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    year: 2019,
    sourceNote: 'Released November 29, 2019.',
  },
];
