import type { Card } from '../types';

interface TimelineStripProps {
  cards: Card[];
}

/** A read-only strip of a timeline's years. Safe to show years here — a card
 * only exists in a timeline after being revealed correct in a past round. */
export function TimelineStrip({ cards }: TimelineStripProps) {
  if (cards.length === 0) {
    return <div className="mt-strip mt-strip--empty">No cards yet</div>;
  }
  return (
    <div className="mt-strip">
      {cards.map((card) => (
        <span key={card.trackId} className="mt-strip-card" title={`${card.title} — ${card.artist}`}>
          {card.year}
        </span>
      ))}
    </div>
  );
}
