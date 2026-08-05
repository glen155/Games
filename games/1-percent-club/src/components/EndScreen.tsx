interface EndScreenProps {
  phase: 'won' | 'eliminated';
  jackpotAmount: number;
  eliminatedAtTierIndex: number | null;
  totalTiers: number;
  onPlayAgain: () => void;
}

export function EndScreen({ phase, jackpotAmount, eliminatedAtTierIndex, totalTiers, onPlayAgain }: EndScreenProps) {
  const won = phase === 'won';

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">{won ? 'You beat the 1% Club!' : 'Eliminated!'}</h2>
        <p className="modal-winner">
          {won
            ? `You take home the full jackpot: $${jackpotAmount.toLocaleString()}.`
            : `Eliminated at question ${(eliminatedAtTierIndex ?? 0) + 1} of ${totalTiers} — the $${jackpotAmount.toLocaleString()} jackpot rolls over.`}
        </p>
        <button type="button" className="modal-play-again" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
