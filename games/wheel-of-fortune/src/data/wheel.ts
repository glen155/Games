import type { Wedge } from '../types';

/** Cost to buy a vowel, deducted from the round pot regardless of whether
 * the vowel turns out to be in the puzzle — same rule as the real show. */
export const VOWEL_COST = 250;

/**
 * The wheel — 24 wedges, roughly matching a real wheel's proportions: mostly
 * cash values in the 300-900 range, two Bankrupt, one Lose a Turn. Order
 * doesn't matter (SPIN picks uniformly at random), it's just laid out here
 * the way it'd read around a physical wheel for WheelDisplay to render.
 */
export const WHEEL: Wedge[] = [
  { type: 'cash', value: 500 },
  { type: 'cash', value: 600 },
  { type: 'cash', value: 300 },
  { type: 'cash', value: 700 },
  { type: 'bankrupt' },
  { type: 'cash', value: 450 },
  { type: 'cash', value: 800 },
  { type: 'cash', value: 350 },
  { type: 'cash', value: 500 },
  { type: 'cash', value: 650 },
  { type: 'lose-turn' },
  { type: 'cash', value: 600 },
  { type: 'cash', value: 400 },
  { type: 'cash', value: 900 },
  { type: 'cash', value: 500 },
  { type: 'cash', value: 750 },
  { type: 'bankrupt' },
  { type: 'cash', value: 550 },
  { type: 'cash', value: 700 },
  { type: 'cash', value: 400 },
  { type: 'cash', value: 850 },
  { type: 'cash', value: 600 },
  { type: 'cash', value: 500 },
  { type: 'cash', value: 900 },
];
