import type { Category } from '../types';

interface AnswerJudgePanelProps {
  category: Category;
  revealed: boolean[];
  onReveal: (index: number) => void;
}

/**
 * Host-only cheat sheet: every answer and point value is visible immediately,
 * not just after reveal, so the host can judge a spoken guess against the
 * full list before tapping it. Only ever rendered on the host's own private
 * device in hosted mode — this data is never broadcast to players.
 */
export function AnswerJudgePanel({ category, revealed, onReveal }: AnswerJudgePanelProps) {
  return (
    <div className="judge-panel">
      <p className="judge-panel-hint">Only you can see this — tap an answer once someone says it.</p>
      <ul className="judge-panel-list">
        {category.answers.map((answer, index) => (
          <li key={index} className={`judge-panel-row${revealed[index] ? ' judge-panel-row--revealed' : ''}`}>
            <button
              type="button"
              className="judge-panel-button"
              onClick={() => onReveal(index)}
              disabled={revealed[index]}
            >
              <span className="judge-panel-number">{index + 1}</span>
              <span className="judge-panel-text">{answer.text}</span>
              <span className="judge-panel-points">{answer.points}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
