import type { PlayerViewProps } from '@games/platform';
import type { GameState } from './types';
import { isPassEligible } from './state/gameReducer';
import { QuestionCard } from './components/QuestionCard';
import { OptionsGrid } from './components/OptionsGrid';
import { useCountdown } from './hooks/useCountdown';

/**
 * The player / phone view for hosted 1% Club. A read-only mirror of the host's
 * state: answers alongside the simulated crowd for bragging rights, not real
 * elimination — one miss just marks you "out of the running" on the final
 * leaderboard, but the question keeps coming so you can keep playing for fun.
 */
export function PlayerView({ state, nickname, userId, sendAction }: PlayerViewProps<GameState>) {
  const secondsLeft = useCountdown(state?.timerEndsAt ?? null);

  if (!state) {
    return (
      <div className="player-view player-view--waiting">
        <p>Waiting for the host to start…</p>
      </div>
    );
  }

  if (state.phase === 'setup') {
    return (
      <div className="player-view player-view--waiting">
        <h1>1% Club</h1>
        <p>Waiting for the host to start the game…</p>
      </div>
    );
  }

  // Solo-only phases can't reach a hosted PlayerView — guard defensively.
  if (state.phase === 'won' || state.phase === 'eliminated') return null;

  const outOfRunning = state.outOfRunningIds.includes(userId);

  if (state.phase === 'ended') {
    const correctCount = state.playerCorrectCounts[userId] ?? 0;
    return (
      <div className="player-view player-view--waiting">
        <h2>{outOfRunning ? "That's the game!" : 'You made it all the way!'}</h2>
        <p>
          {nickname}, you got {correctCount} of {state.questions.length} correct
          {!outOfRunning && ' — without a single miss'}.
        </p>
      </div>
    );
  }

  const tier = state.questions[state.currentTierIndex];
  const myAnswer = state.playerAnswers[userId];
  const myPass = state.playerPasses[userId];
  const myResult = state.lastPlayerResults?.[userId];
  const canPass = !myAnswer && !myPass && !state.passUsedIds.includes(userId) && isPassEligible(state);

  return (
    <div className="player-view">
      {outOfRunning && (
        <div className="player-out-banner">You're out of the running — keep playing for fun!</div>
      )}
      <QuestionCard percent={tier.percent} prompt={tier.prompt} />
      {state.phase === 'playing' ? (
        <>
          {secondsLeft !== null && (
            <span className={`player-countdown${secondsLeft <= 5 ? ' player-countdown--urgent' : ''}`}>
              {secondsLeft}s
            </span>
          )}
          <OptionsGrid
            options={tier.options}
            selectedIndex={myAnswer?.index ?? null}
            correctIndex={null}
            phase="playing"
            onSelect={(index) => sendAction('answer', { index })}
          />
          {canPass && (
            <button type="button" className="player-pass-button" onClick={() => sendAction('pass', {})}>
              Pass (use your one-time skip)
            </button>
          )}
          {myAnswer && (
            <p className="player-waiting-note">Answer locked in — waiting for the host to reveal…</p>
          )}
          {myPass && <p className="player-waiting-note">Pass used — sitting this one out.</p>}
        </>
      ) : (
        <>
          <OptionsGrid
            options={tier.options}
            selectedIndex={myAnswer?.index ?? null}
            correctIndex={tier.correctIndex}
            phase="reveal"
            onSelect={() => {}}
          />
          {myResult?.passed ? (
            <p className="player-result player-result--passed">You passed — your streak is safe.</p>
          ) : myResult ? (
            <p className={`player-result${myResult.correct ? ' player-result--correct' : ' player-result--wrong'}`}>
              {myResult.correct ? 'You got it right!' : `Wrong — it was "${tier.options[tier.correctIndex]}".`}
            </p>
          ) : (
            <p className="player-waiting-note">You didn't answer this one.</p>
          )}
        </>
      )}
    </div>
  );
}
