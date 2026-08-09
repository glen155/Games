import type { Question } from '../types';
import { QuestionOptions } from './QuestionOptions';

interface QuestionPanelProps {
  question: Question;
  currentNickname: string;
  questionRemainingMs: number | null;
  /** True only for a player sharing this screen (a 'local-' id) — remote
   * players answer (and bank) from their own phone instead. */
  showLocalControls: boolean;
  onLocalAnswer: (index: number) => void;
  /** Present only in the money round — the final has no bank option. */
  bank?: { chain: number; onBank: () => void };
}

/**
 * The public question display on the host screen: prompt + options, visible
 * to everyone (like a real quiz show board), never showing which one is
 * correct. Answering is self-graded on the current player's own device —
 * this only becomes interactive for a player sharing the host screen.
 */
export function QuestionPanel({
  question,
  currentNickname,
  questionRemainingMs,
  showLocalControls,
  onLocalAnswer,
  bank,
}: QuestionPanelProps) {
  const seconds = questionRemainingMs === null ? null : Math.ceil(questionRemainingMs / 1000);

  return (
    <div className="wl-question">
      <div className="wl-question-header">
        <p className="wl-question-turn">
          <span className="wl-question-turn-name">{currentNickname}</span>'s turn
        </p>
        {seconds !== null && (
          <span className={`wl-question-clock${seconds <= 5 ? ' wl-question-clock--urgent' : ''}`}>{seconds}s</span>
        )}
      </div>
      <p className="wl-question-prompt">{question.prompt}</p>

      {bank && showLocalControls && bank.chain > 0 && (
        <button type="button" className="wl-btn wl-question-bank" onClick={bank.onBank}>
          Bank {bank.chain} instead
        </button>
      )}

      <QuestionOptions
        options={question.options}
        selectedIndex={null}
        correctIndex={null}
        disabled={!showLocalControls}
        onSelect={onLocalAnswer}
      />
      {!showLocalControls && <p className="wl-question-hint">Waiting for {currentNickname} to answer…</p>}
    </div>
  );
}
