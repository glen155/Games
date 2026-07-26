interface EndScreenProps {
  correctCount: number;
  totalClues: number;
  onPlayAgain: () => void;
}

export function EndScreen({ correctCount, totalClues, onPlayAgain }: EndScreenProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">That's the showdown!</h2>
        <p className="modal-winner">
          You got {correctCount} of {totalClues} right.
        </p>
        <button type="button" className="modal-play-again" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
