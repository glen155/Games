import type { Track } from '../types';

/**
 * Curated pool for Timeline mode. `year` is the field the whole game hinges on
 * — it must be the verified ORIGINAL release year, not a reissue/remaster/
 * compilation date. `spotifyUri`/`spotifyUrl` below are PLACEHOLDERS
 * ('spotify:track:PLACEHOLDER_...') and must be replaced with real track URIs
 * before real play; see this game's README for how to add verified entries.
 */
export const tracks: Track[] = [
  {
    id: 'beatles-hey-jude-1968',
    spotifyUri: 'spotify:track:PLACEHOLDER_HEY_JUDE',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_HEY_JUDE',
    title: 'Hey Jude',
    artist: 'The Beatles',
    year: 1968,
  },
  {
    id: 'gaye-whats-going-on-1971',
    spotifyUri: 'spotify:track:PLACEHOLDER_WHATS_GOING_ON',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_WHATS_GOING_ON',
    title: "What's Going On",
    artist: 'Marvin Gaye',
    year: 1971,
  },
  {
    id: 'queen-bohemian-rhapsody-1975',
    spotifyUri: 'spotify:track:PLACEHOLDER_BOHEMIAN_RHAPSODY',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_BOHEMIAN_RHAPSODY',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    year: 1975,
  },
  {
    id: 'abba-dancing-queen-1976',
    spotifyUri: 'spotify:track:PLACEHOLDER_DANCING_QUEEN',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_DANCING_QUEEN',
    title: 'Dancing Queen',
    artist: 'ABBA',
    year: 1976,
  },
  {
    id: 'jackson-billie-jean-1983',
    spotifyUri: 'spotify:track:PLACEHOLDER_BILLIE_JEAN',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_BILLIE_JEAN',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    year: 1983,
  },
  {
    id: 'madonna-like-a-virgin-1984',
    spotifyUri: 'spotify:track:PLACEHOLDER_LIKE_A_VIRGIN',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_LIKE_A_VIRGIN',
    title: 'Like a Virgin',
    artist: 'Madonna',
    year: 1984,
  },
  {
    id: 'gnr-sweet-child-o-mine-1987',
    spotifyUri: 'spotify:track:PLACEHOLDER_SWEET_CHILD',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_SWEET_CHILD',
    title: "Sweet Child o' Mine",
    artist: "Guns N' Roses",
    year: 1987,
    // Deliberately paired with Bohemian Rhapsody's decade-mate below to exercise
    // the duplicate-year gap-range logic during testing.
  },
  {
    id: 'nirvana-smells-like-teen-spirit-1991',
    spotifyUri: 'spotify:track:PLACEHOLDER_TEEN_SPIRIT',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_TEEN_SPIRIT',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    year: 1991,
  },
  {
    id: 'oasis-wonderwall-1995',
    spotifyUri: 'spotify:track:PLACEHOLDER_WONDERWALL',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_WONDERWALL',
    title: 'Wonderwall',
    artist: 'Oasis',
    year: 1995,
  },
  {
    id: 'spears-baby-one-more-time-1998',
    spotifyUri: 'spotify:track:PLACEHOLDER_BABY_ONE_MORE_TIME',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_BABY_ONE_MORE_TIME',
    title: '...Baby One More Time',
    artist: 'Britney Spears',
    year: 1998,
  },
  {
    id: 'outkast-hey-ya-2003',
    spotifyUri: 'spotify:track:PLACEHOLDER_HEY_YA',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_HEY_YA',
    title: 'Hey Ya!',
    artist: 'OutKast',
    year: 2003,
  },
  {
    id: 'spears-toxic-2003',
    spotifyUri: 'spotify:track:PLACEHOLDER_TOXIC',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_TOXIC',
    title: 'Toxic',
    artist: 'Britney Spears',
    year: 2003,
    // Same year as Hey Ya! above — exercises the duplicate-year gap-range logic.
  },
  {
    id: 'adele-rolling-in-the-deep-2010',
    spotifyUri: 'spotify:track:PLACEHOLDER_ROLLING_IN_THE_DEEP',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_ROLLING_IN_THE_DEEP',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    year: 2010,
  },
  {
    id: 'ronson-uptown-funk-2014',
    spotifyUri: 'spotify:track:PLACEHOLDER_UPTOWN_FUNK',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_UPTOWN_FUNK',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    year: 2014,
  },
  {
    id: 'sheeran-shape-of-you-2017',
    spotifyUri: 'spotify:track:PLACEHOLDER_SHAPE_OF_YOU',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_SHAPE_OF_YOU',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    year: 2017,
  },
  {
    id: 'weeknd-blinding-lights-2019',
    spotifyUri: 'spotify:track:PLACEHOLDER_BLINDING_LIGHTS',
    spotifyUrl: 'https://open.spotify.com/track/PLACEHOLDER_BLINDING_LIGHTS',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    year: 2019,
  },
];
