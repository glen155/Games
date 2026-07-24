import type { Category } from '../types';
import { AnswerSlot } from './AnswerSlot';

interface AnswerBoardProps {
  category: Category;
  revealed: boolean[];
  onReveal: (index: number) => void;
}

export function AnswerBoard({ category, revealed, onReveal }: AnswerBoardProps) {
  return (
    <div className="board-grid">
      {category.answers.map((answer, index) => (
        <AnswerSlot
          key={`${category.name}-${index}`}
          index={index}
          answer={answer}
          revealed={revealed[index]}
          onReveal={onReveal}
        />
      ))}
    </div>
  );
}
