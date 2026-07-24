import { useEffect, useState } from 'react';

/**
 * Ticks roughly every 250ms while `endsAt` is set, returning whole seconds
 * remaining (or null when there's no active deadline). `endsAt` is a synced,
 * absolute epoch-ms value from shared game state — every device computes its
 * own countdown from it locally, no per-second network traffic needed.
 */
export function useCountdown(endsAt: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (endsAt === null) return null;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
