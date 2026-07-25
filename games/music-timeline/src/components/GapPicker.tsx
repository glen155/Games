import { useState } from 'react';
import { TimelineGaps } from './TimelineGaps';
import type { Card } from '../types';

interface GapPickerProps {
  timeline: Card[];
  locked: boolean;
  onLock: (gapIndex: number) => void;
}

export function GapPicker({ timeline, locked, onLock }: GapPickerProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="mt-player-picker">
      <p className="mt-player-picker-hint">Where does this song belong in your timeline?</p>
      <TimelineGaps timeline={timeline} selected={selected} disabled={locked} onSelect={setSelected} />
      <button
        type="button"
        className="mt-btn mt-btn--primary mt-player-lock"
        disabled={selected === null || locked}
        onClick={() => {
          if (selected !== null) onLock(selected);
        }}
      >
        {locked ? 'Locked in ✓' : 'Lock In'}
      </button>
    </div>
  );
}
