interface RoundTimerProps {
  remainingMs: number | null;
}

/** The whole-round countdown — the round ends the instant this hits zero,
 * even mid-question. Not shown in the final, which has no round-level clock. */
export function RoundTimer({ remainingMs }: RoundTimerProps) {
  if (remainingMs === null) return null;
  const seconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className={`wl-round-timer${seconds <= 15 ? ' wl-round-timer--urgent' : ''}`}>
      <span className="wl-round-timer-label">Round time</span>
      <span className="wl-round-timer-value">
        {minutes}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
