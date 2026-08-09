import type { Wedge } from '../types';

function wedgeLabel(wedge: Wedge): string {
  if (wedge.type === 'cash') return `$${wedge.value}`;
  if (wedge.type === 'bankrupt') return 'BANKRUPT';
  return 'LOSE A TURN';
}

function wedgeClass(wedge: Wedge): string {
  if (wedge.type === 'cash') return 'wof-wheel-result--cash';
  if (wedge.type === 'bankrupt') return 'wof-wheel-result--bankrupt';
  return 'wof-wheel-result--lose-turn';
}

interface WheelDisplayProps {
  lastSpin: Wedge | null;
  spinSeq: number;
}

/** A decorative spinning wheel plus a delayed result banner. Deliberately
 * doesn't try to land the pointer on the exact resolved wedge slice — the
 * reducer already resolved the outcome instantly (resolve-first-animate-after,
 * same split as the flip-vote card), so the wheel itself is cosmetic and the
 * banner is what actually communicates the result. Keyed by spinSeq so the
 * animation restarts even when the same wedge value comes up twice in a row. */
export function WheelDisplay({ lastSpin, spinSeq }: WheelDisplayProps) {
  return (
    <div className="wof-wheel-wrap">
      <div className="wof-wheel-pointer" />
      <div key={spinSeq} className={`wof-wheel${spinSeq > 0 ? ' wof-wheel--spinning' : ''}`} />
      {lastSpin && (
        <div key={`result-${spinSeq}`} className={`wof-wheel-result ${wedgeClass(lastSpin)}`}>
          {wedgeLabel(lastSpin)}
        </div>
      )}
    </div>
  );
}
