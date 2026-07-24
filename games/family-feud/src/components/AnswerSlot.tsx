import type { Answer } from '../types';

interface AnswerSlotProps {
  index: number;
  answer: Answer;
  revealed: boolean;
  onReveal: (index: number) => void;
}

export function AnswerSlot({ index, answer, revealed, onReveal }: AnswerSlotProps) {
  return (
    <button
      type="button"
      className={`board-slot${revealed ? ' revealed' : ''}`}
      onClick={() => onReveal(index)}
      disabled={revealed}
      aria-label={revealed ? `${answer.text}, ${answer.points} points` : `Reveal answer ${index + 1}`}
    >
      <span className="board-slot-inner">
        <span className="board-slot-face board-slot-face--front">
          <span className="board-slot-number">{index + 1}</span>
        </span>
        <span className="board-slot-face board-slot-face--back">
          <span className="board-slot-text">{answer.text}</span>
          <span className="board-slot-points">{answer.points}</span>
        </span>
      </span>
    </button>
  );
}
