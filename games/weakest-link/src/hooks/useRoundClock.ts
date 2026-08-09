import { useEffect, useState } from 'react';
import type { GameState } from '../types';
import type { WeakestLinkAction } from '../state/gameReducer';

/**
 * Host-local clock for the money round's per-question and whole-round
 * deadlines, and the final round's per-question deadline. Ticks while a
 * relevant deadline is active and dispatches the matching `_EXPIRED` action
 * once it passes — modeled on Music Timeline's useShotClock (host-local
 * ticking, dispatch on expiry, the reducer's own guards make a stray extra
 * dispatch harmless).
 */
export function useRoundClock(state: GameState, dispatch: (action: WeakestLinkAction) => void) {
  const [now, setNow] = useState(() => Date.now());

  const questionActive =
    (state.phase === 'money' || state.phase === 'final') && state.questionEndsAt !== null;
  const roundActive = state.phase === 'money' && state.roundEndsAt !== null;

  useEffect(() => {
    if (!questionActive && !roundActive) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [questionActive, roundActive]);

  useEffect(() => {
    // The round clock takes priority — if both expire together there's no
    // "next question" to worry about, the round's simply over.
    if (state.phase === 'money' && state.roundEndsAt !== null && now >= state.roundEndsAt) {
      dispatch({ type: 'ROUND_TIME_EXPIRED' });
      return;
    }
    if (state.phase === 'money' && state.questionEndsAt !== null && now >= state.questionEndsAt) {
      dispatch({ type: 'QUESTION_TIME_EXPIRED', at: now });
      return;
    }
    if (state.phase === 'final' && state.questionEndsAt !== null && now >= state.questionEndsAt) {
      dispatch({ type: 'FINAL_QUESTION_TIME_EXPIRED', at: now });
    }
  }, [now, state.phase, state.roundEndsAt, state.questionEndsAt, dispatch]);

  return {
    questionRemainingMs: state.questionEndsAt !== null ? Math.max(0, state.questionEndsAt - now) : null,
    roundRemainingMs: state.roundEndsAt !== null ? Math.max(0, state.roundEndsAt - now) : null,
  };
}
