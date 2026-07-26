interface ControlsPanelProps {
  phase: 'answering' | 'reveal';
  canConfirm: boolean;
  muted: boolean;
  onConfirm: () => void;
  onAdvance: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
}

export function ControlsPanel({
  phase,
  canConfirm,
  muted,
  onConfirm,
  onAdvance,
  onRestart,
  onToggleMute,
}: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      <div className="controls-buttons">
        {phase === 'answering' ? (
          <button
            type="button"
            className="controls-button controls-button--primary"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            Confirm Answer (Enter)
          </button>
        ) : (
          <button type="button" className="controls-button controls-button--primary" onClick={onAdvance}>
            Next Clue (Enter)
          </button>
        )}
        <button type="button" className="controls-button" onClick={onRestart}>
          Restart (R)
        </button>
        <button type="button" className="controls-button" onClick={onToggleMute}>
          {muted ? 'Unmute (M)' : 'Mute (M)'}
        </button>
      </div>
      <details className="controls-legend">
        <summary>Keyboard shortcuts</summary>
        <ul>
          <li>
            <kbd>1</kbd>–<kbd>4</kbd> select an option
          </li>
          <li>
            <kbd>Enter</kbd> confirm answer / next clue
          </li>
          <li>
            <kbd>R</kbd> restart
          </li>
          <li>
            <kbd>M</kbd> toggle mute
          </li>
        </ul>
      </details>
    </div>
  );
}
