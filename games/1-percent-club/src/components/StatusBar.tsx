interface StatusBarProps {
  poolRemaining: number;
  jackpotAmount: number;
  currentTierIndex: number;
  totalTiers: number;
}

export function StatusBar({ poolRemaining, jackpotAmount, currentTierIndex, totalTiers }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">Contestants Remaining</span>
        <span className="status-value">{poolRemaining} / 100</span>
      </div>
      <div className="status-item">
        <span className="status-label">Jackpot</span>
        <span className="status-value">${jackpotAmount.toLocaleString()}</span>
      </div>
      <div className="status-item">
        <span className="status-label">Question</span>
        <span className="status-value">
          {currentTierIndex + 1} / {totalTiers}
        </span>
      </div>
    </div>
  );
}
