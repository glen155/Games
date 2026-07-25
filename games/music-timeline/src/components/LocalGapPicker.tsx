import { useState } from 'react';
import { TimelineGaps } from './TimelineGaps';
import type { Round, TimelinePlayer } from '../types';

interface LocalGapPickerProps {
  player: TimelinePlayer;
  round: Round | null;
  phase: 'playing' | 'locked';
  onLock: (gapIndex: number) => void;
}

/** Inline gap picker for a player sharing the host screen (solo / pass-and-play).
 * Dispatches LOCK_GUESS directly — the host is always dispatch-authoritative,
 * so this bypasses sendAction entirely. */
export function LocalGapPicker({ player, round, phase, onLock }: LocalGapPickerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const locked = round ? player.userId in round.locks : false;

  return (
    <div className="mt-local-picker">
      <h3 className="mt-local-picker-name">{player.nickname}</h3>
      <TimelineGaps
        timeline={player.timeline}
        selected={selected}
        disabled={locked || phase === 'locked'}
        onSelect={setSelected}
      />
      <button
        type="button"
        className="mt-btn mt-btn--primary"
        disabled={selected === null || locked || phase === 'locked'}
        onClick={() => {
          if (selected !== null) onLock(selected);
        }}
      >
        {locked ? 'Locked in ✓' : 'Lock In'}
      </button>
    </div>
  );
}
