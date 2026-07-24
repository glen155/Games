interface ControlsPanelProps {
  strikes: number;
  muted: boolean;
  awaitingSteal: boolean;
  onStrike: () => void;
  onResolveSteal: (success: boolean) => void;
  onResetRound: () => void;
  onNextRound: () => void;
  onPrevRound: () => void;
  onToggleMute: () => void;
}

export function ControlsPanel({
  strikes,
  muted,
  awaitingSteal,
  onStrike,
  onResolveSteal,
  onResetRound,
  onNextRound,
  onPrevRound,
  onToggleMute,
}: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      <div className="controls-buttons">
        {awaitingSteal ? (
          <>
            <button type="button" className="controls-button controls-button--steal-success" onClick={() => onResolveSteal(true)}>
              Steal Successful!
            </button>
            <button type="button" className="controls-button controls-button--steal-fail" onClick={() => onResolveSteal(false)}>
              No Steal
            </button>
          </>
        ) : (
          <button type="button" className="controls-button controls-button--strike" onClick={onStrike} disabled={strikes >= 3}>
            Strike (X)
          </button>
        )}
        <button type="button" className="controls-button" onClick={onPrevRound}>
          ◀ Prev Round (P)
        </button>
        <button type="button" className="controls-button" onClick={onResetRound}>
          Reset Round (R)
        </button>
        <button type="button" className="controls-button" onClick={onNextRound}>
          Next Round (N) ▶
        </button>
        <button type="button" className="controls-button" onClick={onToggleMute}>
          {muted ? 'Unmute (M)' : 'Mute (M)'}
        </button>
      </div>
      <details className="controls-legend">
        <summary>Keyboard shortcuts</summary>
        <ul>
          <li><kbd>1</kbd>–<kbd>8</kbd> reveal that answer</li>
          <li><kbd>X</kbd> strike</li>
          <li><kbd>←</kbd> / <kbd>→</kbd> set active team</li>
          <li><kbd>A</kbd> award pot to active team</li>
          <li><kbd>R</kbd> reset round</li>
          <li><kbd>N</kbd> / <kbd>P</kbd> next / previous round</li>
          <li><kbd>M</kbd> toggle mute</li>
        </ul>
      </details>
    </div>
  );
}
