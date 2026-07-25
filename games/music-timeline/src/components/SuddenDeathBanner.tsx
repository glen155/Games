import type { TimelinePlayer } from '../types';

interface SuddenDeathBannerProps {
  contenders: string[];
  players: Record<string, TimelinePlayer>;
}

export function SuddenDeathBanner({ contenders, players }: SuddenDeathBannerProps) {
  const names = contenders.map((id) => players[id]?.nickname ?? 'Player').join(' vs. ');
  return (
    <div className="mt-sudden-death" role="status">
      Sudden death! {names} are tied — next correct placement wins.
    </div>
  );
}
