import type { PlayerClueResult } from '../types';

interface ResultsBreakdownProps {
  results: Record<string, PlayerClueResult>;
  correctAnswerText: string;
}

/** Named right/wrong breakdown shown on the host screen after a hosted reveal. */
export function ResultsBreakdown({ results, correctAnswerText }: ResultsBreakdownProps) {
  const entries = Object.entries(results).sort((a, b) => a[1].nickname.localeCompare(b[1].nickname));

  return (
    <div className="results-breakdown">
      <p className="results-breakdown-answer">Correct answer: "{correctAnswerText}"</p>
      {entries.length === 0 ? (
        <p className="results-breakdown-empty">No one answered this one.</p>
      ) : (
        <ul className="results-breakdown-list">
          {entries.map(([userId, result]) => (
            <li
              key={userId}
              className={`results-breakdown-item${result.correct ? ' results-breakdown-item--correct' : ' results-breakdown-item--wrong'}`}
            >
              <span className="results-breakdown-name">{result.nickname}</span>
              <span className="results-breakdown-mark">{result.correct ? '✓' : '✗'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
