interface SetupScreenProps {
  poolSize: number;
  roundCount: number;
  onRoundCountChange: (count: number) => void;
  onStart: () => void;
}

export function SetupScreen({ poolSize, roundCount, onRoundCountChange, onStart }: SetupScreenProps) {
  return (
    <div className="setup-screen">
      <h1 className="setup-title">Soundtrack Showdown</h1>
      <p className="setup-rules">
        A movie or TV theme plays over Spotify — name what it's from before anyone else,
        multiple-choice style. Everyone answers every clue; most correct at the end wins.
      </p>

      <div className="setup-round-picker">
        <label className="setup-label" htmlFor="round-count-input">
          Number of clues
        </label>
        <input
          id="round-count-input"
          className="setup-input"
          type="number"
          min={1}
          max={poolSize}
          step={1}
          value={roundCount}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (value > 0) onRoundCountChange(Math.min(value, poolSize));
          }}
        />
        <p className="setup-round-hint">{poolSize} clues available in the pool.</p>
      </div>

      <button type="button" className="setup-start-button" onClick={onStart}>
        Start Game
      </button>
    </div>
  );
}
