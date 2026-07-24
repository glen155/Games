import { useEffect, useRef, useState } from 'react';
import { MAX_STRIKES } from '../state/gameReducer';

interface StrikeDisplayProps {
  strikes: number;
}

export function StrikeDisplay({ strikes }: StrikeDisplayProps) {
  const [flash, setFlash] = useState(false);
  const previousStrikes = useRef(strikes);

  useEffect(() => {
    if (strikes > previousStrikes.current) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 400);
      previousStrikes.current = strikes;
      return () => clearTimeout(timeout);
    }
    previousStrikes.current = strikes;
  }, [strikes]);

  return (
    <div className="strike-display">
      {Array.from({ length: MAX_STRIKES }, (_, i) => (
        <span
          key={i}
          className={`strike-x${i < strikes ? ' strike-x--active' : ''}`}
          aria-hidden="true"
        >
          X
        </span>
      ))}
      {flash && <div className="strike-flash-overlay" />}
    </div>
  );
}
