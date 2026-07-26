import type { AnswerStyle } from '../types';

interface SetupScreenProps {
  poolSize: number;
  roundCount: number;
  onRoundCountChange: (count: number) => void;
  isHosted: boolean;
  answerStyle: AnswerStyle;
  onAnswerStyleChange: (style: AnswerStyle) => void;
  onStart: () => void;
}

export function SetupScreen({
  poolSize,
  roundCount,
  onRoundCountChange,
  isHosted,
  answerStyle,
  onAnswerStyleChange,
  onStart,
}: SetupScreenProps) {
  return (
    <div className="setup-screen">
      <h1 className="setup-title">Soundtrack Showdown</h1>
      <p className="setup-rules">
        A movie or TV theme plays over Spotify — name what it's from before anyone else.
        Everyone answers every clue; most correct at the end wins.
      </p>

      {isHosted && (
        <div className="setup-answer-style-picker">
          <span className="setup-label">Answer style</span>
          <div className="setup-answer-style-options">
            <button
              type="button"
              className={`setup-answer-style-option${answerStyle === 'multiple_choice' ? ' setup-answer-style-option--selected' : ''}`}
              onClick={() => onAnswerStyleChange('multiple_choice')}
            >
              <strong>Multiple Choice</strong>
              <span>Players pick from 4 options on their phone — scored automatically.</span>
            </button>
            <button
              type="button"
              className={`setup-answer-style-option${answerStyle === 'open_guess' ? ' setup-answer-style-option--selected' : ''}`}
              onClick={() => onAnswerStyleChange('open_guess')}
            >
              <strong>Open Guess</strong>
              <span>Everyone calls it out loud — you judge who got it right.</span>
            </button>
          </div>
        </div>
      )}

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
