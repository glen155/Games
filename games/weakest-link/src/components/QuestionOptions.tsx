const LETTERS = ['A', 'B', 'C', 'D'];

interface QuestionOptionsProps {
  options: [string, string, string, string];
  selectedIndex: number | null;
  /** Only non-null once this turn's answer is in — never shown ahead of that. */
  correctIndex: number | null;
  disabled: boolean;
  onSelect: (index: number) => void;
}

/** The 4-option button grid for a multiple-choice question — shared by the
 * answering player's own device and the host's local-player path. Modeled on
 * 1% Club's OptionsGrid. */
export function QuestionOptions({ options, selectedIndex, correctIndex, disabled, onSelect }: QuestionOptionsProps) {
  return (
    <div className="wl-options">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isRevealCorrect = correctIndex !== null && correctIndex === index;
        const isRevealWrong = correctIndex !== null && isSelected && correctIndex !== index;
        const className = [
          'wl-option',
          isSelected && correctIndex === null ? 'wl-option--selected' : '',
          isRevealCorrect ? 'wl-option--correct' : '',
          isRevealWrong ? 'wl-option--wrong' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            type="button"
            key={option}
            className={className}
            onClick={() => onSelect(index)}
            disabled={disabled}
            aria-label={`Option ${LETTERS[index]}: ${option}`}
          >
            <span className="wl-option-letter">{LETTERS[index]}</span>
            <span className="wl-option-text">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
