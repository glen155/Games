import type { Card } from '../types';

interface TimelineGapsProps {
  timeline: Card[];
  selected: number | null;
  disabled?: boolean;
  onSelect: (gapIndex: number) => void;
}

/** Renders a timeline as N+1 tappable gaps, e.g. `‹ 1974 › 1988 ›` — the only
 * safe place a card's year is ever shown is here, for cards already locked
 * into a timeline from a past reveal. */
export function TimelineGaps({ timeline, selected, disabled, onSelect }: TimelineGapsProps) {
  const gapCount = timeline.length + 1;
  return (
    <div className="mt-gaps">
      {Array.from({ length: gapCount }, (_, gapIndex) => (
        <div key={gapIndex} className="mt-gap-unit">
          <button
            type="button"
            className={`mt-gap${selected === gapIndex ? ' mt-gap--selected' : ''}`}
            disabled={disabled}
            onClick={() => onSelect(gapIndex)}
            aria-label={`Place here — position ${gapIndex + 1} of ${gapCount}`}
          >
            ‹›
          </button>
          {gapIndex < timeline.length && (
            <span className="mt-gap-year">{timeline[gapIndex].year}</span>
          )}
        </div>
      ))}
    </div>
  );
}
