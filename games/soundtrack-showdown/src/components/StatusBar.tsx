interface StatusBarProps {
  currentClueIndex: number;
  totalClues: number;
  /** Omit in hosted mode — the host doesn't personally answer, so there's no
   * single "correct count" to show. */
  correctCount?: number;
}

export function StatusBar({ currentClueIndex, totalClues, correctCount }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">Clue</span>
        <span className="status-value">
          {currentClueIndex + 1} / {totalClues}
        </span>
      </div>
      {correctCount !== undefined && (
        <div className="status-item">
          <span className="status-label">Correct</span>
          <span className="status-value">{correctCount}</span>
        </div>
      )}
    </div>
  );
}
