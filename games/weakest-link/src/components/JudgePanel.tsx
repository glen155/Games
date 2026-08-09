import type { Question } from '../types';

interface JudgePanelProps {
  question: Question;
  currentNickname: string;
  chain: number;
  /** True only for a player sharing this screen (a 'local-' id) — remote
   * players bank from their own phone instead. */
  showLocalBank: boolean;
  onJudge: (correct: boolean) => void;
  onBank: () => void;
}

/**
 * Host-only cheat sheet for the current turn: the question plus its answer,
 * visible only here (never broadcast to players) so the host can judge a
 * spoken answer — same trust model as Family Feud's AnswerJudgePanel.
 */
export function JudgePanel({
  question,
  currentNickname,
  chain,
  showLocalBank,
  onJudge,
  onBank,
}: JudgePanelProps) {
  return (
    <div className="wl-judge">
      <p className="wl-judge-turn">
        <span className="wl-judge-turn-name">{currentNickname}</span>'s turn
      </p>
      <p className="wl-judge-prompt">{question.prompt}</p>
      <p className="wl-judge-answer">{question.answer}</p>

      {showLocalBank && chain > 0 && (
        <button type="button" className="wl-btn wl-judge-bank" onClick={onBank}>
          Bank {chain} instead
        </button>
      )}

      <div className="wl-judge-buttons">
        <button type="button" className="wl-btn wl-judge-btn wl-judge-btn--correct" onClick={() => onJudge(true)}>
          Correct
        </button>
        <button type="button" className="wl-btn wl-judge-btn wl-judge-btn--wrong" onClick={() => onJudge(false)}>
          Wrong
        </button>
      </div>
    </div>
  );
}
