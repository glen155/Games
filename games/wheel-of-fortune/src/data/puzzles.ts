import type { Puzzle } from '../types';

/**
 * Puzzle bank across classic categories. `solution` is the exact phrase as
 * it appears on the board — SOLVE compares a normalized form of it (see
 * `normalize` in state/gameReducer.ts), so exact spacing/punctuation here
 * only matters for how the board displays, not for what counts as correct.
 */
export const puzzles: Puzzle[] = [
  { id: 'p1', category: 'Phrase', solution: 'BEST OF LUCK' },
  { id: 'p2', category: 'Phrase', solution: 'BETTER LATE THAN NEVER' },
  { id: 'p3', category: 'Phrase', solution: 'PRACTICE MAKES PERFECT' },
  { id: 'p4', category: 'Phrase', solution: 'ACTIONS SPEAK LOUDER THAN WORDS' },
  { id: 'p5', category: 'Phrase', solution: 'THE EARLY BIRD CATCHES THE WORM' },
  { id: 'p6', category: 'Person', solution: 'ALBERT EINSTEIN' },
  { id: 'p7', category: 'Person', solution: 'WILLIAM SHAKESPEARE' },
  { id: 'p8', category: 'Person', solution: 'LEONARDO DA VINCI' },
  { id: 'p9', category: 'Person', solution: 'MARIE CURIE' },
  { id: 'p10', category: 'Place', solution: 'NEW YORK CITY' },
  { id: 'p11', category: 'Place', solution: 'GRAND CANYON' },
  { id: 'p12', category: 'Place', solution: 'EIFFEL TOWER' },
  { id: 'p13', category: 'Place', solution: 'GREAT WALL OF CHINA' },
  { id: 'p14', category: 'Thing', solution: 'KITCHEN SINK' },
  { id: 'p15', category: 'Thing', solution: 'SWISS ARMY KNIFE' },
  { id: 'p16', category: 'Thing', solution: 'GRANDFATHER CLOCK' },
  { id: 'p17', category: 'Thing', solution: 'MAGNIFYING GLASS' },
  { id: 'p18', category: 'Event', solution: 'SUMMER OLYMPICS' },
  { id: 'p19', category: 'Event', solution: 'NEW YEARS EVE' },
  { id: 'p20', category: 'Event', solution: 'GRADUATION CEREMONY' },
  { id: 'p21', category: 'Food & Drink', solution: 'CHOCOLATE CHIP COOKIES' },
  { id: 'p22', category: 'Food & Drink', solution: 'PEANUT BUTTER AND JELLY' },
  { id: 'p23', category: 'Food & Drink', solution: 'MACARONI AND CHEESE' },
  { id: 'p24', category: 'Food & Drink', solution: 'FRESH SQUEEZED LEMONADE' },
  { id: 'p25', category: 'Occupation', solution: 'FLIGHT ATTENDANT' },
  { id: 'p26', category: 'Occupation', solution: 'COMPUTER PROGRAMMER' },
  { id: 'p27', category: 'Occupation', solution: 'VETERINARIAN' },
  { id: 'p28', category: 'Fictional Character', solution: 'SHERLOCK HOLMES' },
  { id: 'p29', category: 'Fictional Character', solution: 'HARRY POTTER' },
  { id: 'p30', category: 'Fictional Character', solution: 'WONDER WOMAN' },
  { id: 'p31', category: 'Fictional Character', solution: 'WINNIE THE POOH' },
  { id: 'p32', category: 'Movie Title', solution: 'THE WIZARD OF OZ' },
  { id: 'p33', category: 'Movie Title', solution: 'BACK TO THE FUTURE' },
  { id: 'p34', category: 'Movie Title', solution: 'JURASSIC PARK' },
  { id: 'p35', category: 'Animal', solution: 'BOTTLENOSE DOLPHIN' },
  { id: 'p36', category: 'Animal', solution: 'BALD EAGLE' },
  { id: 'p37', category: 'Animal', solution: 'GIANT PANDA' },
  { id: 'p38', category: 'Sport', solution: 'ICE HOCKEY' },
  { id: 'p39', category: 'Sport', solution: 'SYNCHRONIZED SWIMMING' },
  { id: 'p40', category: 'Sport', solution: 'ROCK CLIMBING' },
  { id: 'p41', category: 'Before & After', solution: 'JURASSIC PARK AVENUE' },
  { id: 'p42', category: 'Before & After', solution: 'STAR WARS AND PEACE' },
];
