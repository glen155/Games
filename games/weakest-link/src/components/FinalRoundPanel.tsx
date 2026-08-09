import type { GameState, Question } from '../types';

interface FinalRoundPanelProps {
  state: GameState;
  question: Question;
  onJudge: (correct: boolean) => void;
}

/** Head-to-head final: both finalists' running scores, whose turn it is, and
 * the host-only question/answer cheat sheet. Ties after the target question
 * count just keep the alternation going (sudden death) until someone's ahead
 * with equal turns played — the reducer handles that, this just renders it. */
export function FinalRoundPanel({ state, question, onJudge }: FinalRoundPanelProps) {
  const finalists = state.finalists!;
  const scores = state.finalScores!;
  const current = finalists[state.finalTurn];

  return (
    <div className="wl-final">
      <div className="wl-final-scores">
        {finalists.map((id) => (
          <div key={id} className={`wl-final-score${id === current ? ' wl-final-score--current' : ''}`}>
            <span className="wl-final-score-name">{state.players[id].nickname}</span>
            <span className="wl-final-score-value">{scores[id]}</span>
          </div>
        ))}
      </div>

      <div className="wl-judge">
        <p className="wl-judge-turn">
          <span className="wl-judge-turn-name">{state.players[current].nickname}</span>'s turn
        </p>
        <p className="wl-judge-prompt">{question.prompt}</p>
        <p className="wl-judge-answer">{question.answer}</p>
        <div className="wl-judge-buttons">
          <button
            type="button"
            className="wl-btn wl-judge-btn wl-judge-btn--correct"
            onClick={() => onJudge(true)}
          >
            Correct
          </button>
          <button
            type="button"
            className="wl-btn wl-judge-btn wl-judge-btn--wrong"
            onClick={() => onJudge(false)}
          >
            Wrong
          </button>
        </div>
      </div>
    </div>
  );
}
