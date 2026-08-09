import type { GameState, Question } from '../types';
import { QuestionPanel } from './QuestionPanel';

interface FinalRoundPanelProps {
  state: GameState;
  question: Question;
  questionRemainingMs: number | null;
  onLocalAnswer: (userId: string, index: number) => void;
}

/** Head-to-head final: both finalists' running scores, whose turn it is, and
 * the same public question display as the money round (no bank option
 * here). Ties after the target question count just keep the alternation
 * going (sudden death) until someone's ahead with equal turns played — the
 * reducer handles that, this just renders it. */
export function FinalRoundPanel({ state, question, questionRemainingMs, onLocalAnswer }: FinalRoundPanelProps) {
  const finalists = state.finalists!;
  const scores = state.finalScores!;
  const current = finalists[state.finalTurn];
  const currentPlayer = state.players[current];

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

      <QuestionPanel
        question={question}
        currentNickname={currentPlayer.nickname}
        questionRemainingMs={questionRemainingMs}
        showLocalControls={currentPlayer.userId.startsWith('local-')}
        onLocalAnswer={(index) => onLocalAnswer(current, index)}
      />
    </div>
  );
}
