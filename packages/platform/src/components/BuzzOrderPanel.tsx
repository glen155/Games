import type { PlayerAction } from '../types';

interface BuzzOrderPanelProps {
  /** Player-originated buzz actions for the *current* question — the game
   * decides what counts as "current" (e.g. clears them on reveal/next). */
  buzzes: PlayerAction[];
  /** Clears the whole buzz order at once — call this when the host moves on
   * to the next question, not on a timer, so everyone stays visible until
   * the host is actually done looking at them. */
  onClear: () => void;
  title?: string;
}

function formatDelta(ms: number): string {
  if (ms <= 0) return '';
  return `+${(ms / 1000).toFixed(2)}s`;
}

/**
 * Ranked "who buzzed in" board for buzz-in rounds: every player who buzzed
 * for the current question, in order, with each one's gap behind the first
 * buzz. Every PlayerAction already carries a wall-clock `at` timestamp
 * (packages/platform/src/types.ts), so this is purely a display over data
 * the platform already collects — no new sync mechanism needed.
 */
export function BuzzOrderPanel({ buzzes, onClear, title = 'Buzzed in' }: BuzzOrderPanelProps) {
  if (buzzes.length === 0) return null;

  const ordered = [...buzzes].sort((a, b) => a.at - b.at);
  const firstAt = ordered[0].at;

  return (
    <div className="buzz-order-panel" role="status">
      <div className="buzz-order-panel-header">
        <span className="buzz-order-panel-title">{title}</span>
        <button type="button" className="buzz-order-panel-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <ol className="buzz-order-panel-list">
        {ordered.map((buzz, index) => (
          <li
            key={buzz.id}
            className={`buzz-order-panel-row${index === 0 ? ' buzz-order-panel-row--first' : ''}`}
          >
            <span className="buzz-order-panel-rank">{index + 1}</span>
            <span className="buzz-order-panel-name">{buzz.nickname}</span>
            <span className="buzz-order-panel-delta">
              {index === 0 ? 'First!' : formatDelta(buzz.at - firstAt)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
