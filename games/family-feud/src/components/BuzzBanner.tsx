import { useEffect } from 'react';
import type { PlayerAction } from '@games/platform';

interface BuzzBannerProps {
  buzzes: PlayerAction[];
  onClear: (id: string) => void;
}

/**
 * Shows who buzzed in, on the host screen. Each buzz auto-clears after a moment
 * so the banner reflects the most recent action without piling up.
 */
export function BuzzBanner({ buzzes, onClear }: BuzzBannerProps) {
  const latest = buzzes[buzzes.length - 1];

  useEffect(() => {
    if (!latest) return;
    const timeout = setTimeout(() => onClear(latest.id), 2500);
    return () => clearTimeout(timeout);
  }, [latest, onClear]);

  if (!latest) return null;

  return (
    <div className="buzz-banner" role="status">
      <span className="buzz-banner-name">{latest.nickname}</span> buzzed in!
    </div>
  );
}
