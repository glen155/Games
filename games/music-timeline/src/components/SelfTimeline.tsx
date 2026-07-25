import type { Card } from '../types';
import { TimelineStrip } from './TimelineStrip';

interface SelfTimelineProps {
  cards: Card[];
  targetCards: number;
}

export function SelfTimeline({ cards, targetCards }: SelfTimelineProps) {
  return (
    <div className="mt-self-timeline">
      <p className="mt-self-timeline-count">
        {cards.length} / {targetCards} cards
      </p>
      <TimelineStrip cards={cards} />
    </div>
  );
}
