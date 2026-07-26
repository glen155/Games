import type { PlayerViewProps } from '@games/platform';
import type { GameState } from './types';
import { OptionsGrid } from './components/OptionsGrid';
import { ClueRevealCard } from './components/ClueRevealCard';
import { useCountdown } from './hooks/useCountdown';

/**
 * The player / phone view for hosted Soundtrack Showdown. A read-only mirror
 * of the host's state — locks in a pick for the clue currently playing, then
 * sees the reveal once the host moves the group forward. Never renders
 * `cueTitle`/`performedBy`/`correctTitle` before `phase === 'reveal'`.
 */
export function PlayerView({ state, nickname, userId, sendAction, roomId }: PlayerViewProps<GameState>) {
  const secondsLeft = useCountdown(state?.timerEndsAt ?? null);

  if (!state || state.phase === 'setup') {
    return (
      <div className="player-view player-view--waiting">
        <h1>Soundtrack Showdown</h1>
        <p>Waiting for the host to start…</p>
      </div>
    );
  }

  // Solo-only phases can't reach a hosted PlayerView — guard defensively.
  if (state.phase === 'summary') return null;

  if (state.phase === 'loading_clue') {
    return (
      <div className="player-view player-view--waiting">
        <p className="player-listening-icon" aria-hidden="true">
          🎧
        </p>
        <p>Listen up! Get ready to answer.</p>
      </div>
    );
  }

  if (state.phase === 'ended') {
    const correctCount = state.playerCorrectCounts[userId] ?? 0;
    return (
      <div className="player-view player-view--waiting">
        <h2>That's the showdown!</h2>
        <p>
          {nickname}, you got {correctCount} of {state.clues.length} correct.
        </p>
      </div>
    );
  }

  const clue = state.clues[state.currentClueIndex];
  const myAnswer = state.playerAnswers[userId];
  const myResult = state.lastPlayerResults?.[userId];

  return (
    <div className="player-view">
      {state.phase === 'answering' ? (
        <>
          {secondsLeft !== null && (
            <span className={`player-countdown${secondsLeft <= 5 ? ' player-countdown--urgent' : ''}`}>
              {secondsLeft}s
            </span>
          )}
          <OptionsGrid
            options={clue.options}
            selectedIndex={myAnswer?.index ?? null}
            correctIndex={null}
            phase="answering"
            onSelect={(index) => sendAction('answer', { index })}
          />
          {myAnswer && <p className="player-waiting-note">Answer locked in — waiting for the host to reveal…</p>}
        </>
      ) : (
        <>
          <ClueRevealCard clue={clue} roomId={roomId} />
          <OptionsGrid
            options={clue.options}
            selectedIndex={myAnswer?.index ?? null}
            correctIndex={clue.correctIndex}
            phase="reveal"
            onSelect={() => {}}
          />
          {myResult ? (
            <p className={`player-result${myResult.correct ? ' player-result--correct' : ' player-result--wrong'}`}>
              {myResult.correct ? 'You got it right!' : `Wrong — it was "${clue.options[clue.correctIndex]}".`}
            </p>
          ) : (
            <p className="player-waiting-note">You didn't answer this one.</p>
          )}
        </>
      )}
    </div>
  );
}
