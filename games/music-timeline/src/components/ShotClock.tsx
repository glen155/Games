interface ShotClockProps {
  remainingMs: number | null;
  shotClockMs: number;
  phase: 'playing' | 'locked';
}

export function ShotClock({ remainingMs, shotClockMs, phase }: ShotClockProps) {
  const seconds = Math.ceil((remainingMs ?? shotClockMs) / 1000);
  return (
    <div className={`mt-shot-clock${phase === 'locked' ? ' mt-shot-clock--locked' : ''}`}>
      {phase === 'locked' ? "Time's up!" : `${seconds}s`}
    </div>
  );
}
