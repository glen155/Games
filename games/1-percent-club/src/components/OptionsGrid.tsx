const LETTERS = ['A', 'B', 'C', 'D'];

interface OptionsGridProps {
  options: [string, string, string, string];
  selectedIndex: number | null;
  correctIndex: number | null;
  phase: 'playing' | 'reveal';
  onSelect: (index: number) => void;
}

export function OptionsGrid({ options, selectedIndex, correctIndex, phase, onSelect }: OptionsGridProps) {
  return (
    <div className="options-grid">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isRevealCorrect = phase === 'reveal' && correctIndex === index;
        const isRevealWrong = phase === 'reveal' && isSelected && correctIndex !== index;
        const className = [
          'option-button',
          isSelected && phase === 'playing' ? 'option-button--selected' : '',
          isRevealCorrect ? 'option-button--correct' : '',
          isRevealWrong ? 'option-button--wrong' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            type="button"
            key={option}
            className={className}
            onClick={() => onSelect(index)}
            disabled={phase !== 'playing'}
            aria-label={`Option ${LETTERS[index]}: ${option}`}
          >
            <span className="option-letter">{LETTERS[index]}</span>
            <span className="option-text">{option}</span>
            <span className="option-hint">({index + 1})</span>
          </button>
        );
      })}
    </div>
  );
}
