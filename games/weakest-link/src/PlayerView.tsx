import { useEffect, useRef, useState } from 'react';
import type { PlayerViewProps } from '@games/platform';
import type { GameState } from './types';
import { currentTurnUserId } from './state/gameReducer';
import { useCountdown } from './hooks/useCountdown';
import { useGameSounds } from './hooks/useGameSounds';
import { QuestionOptions } from './components/QuestionOptions';
import { StrongestLinkCallout } from './components/StrongestLinkCallout';
import { FlipVoteCard } from './components/FlipVoteCard';

function Waiting({
  message,
  sub,
  muted,
  onToggleMute,
}: {
  message: string;
  sub?: string;
  /** Only shown when set — the "you're out" / "watching the rest of the
   * game" screens are the only moments this device makes any sound. */
  muted?: boolean;
  onToggleMute?: () => void;
}) {
  return (
    <div className="wl-player-view wl-player-view--waiting">
      {onToggleMute && (
        <button type="button" className="wl-player-mute" onClick={onToggleMute}>
          {muted ? '🔇' : '🔊'}
        </button>
      )}
      <p className="wl-player-waiting-message">{message}</p>
      {sub && <p className="wl-player-waiting-sub">{sub}</p>}
    </div>
  );
}

/** Tracks whichever of "answer" or "bank" this device just sent, for a quick
 * disabled/"sent" state on both controls at once — reset automatically
 * whenever a new turn's deadline arrives, since that's the reliable signal
 * the reducer has moved on. */
function usePendingTurnAction(questionEndsAt: number | null) {
  const [pending, setPending] = useState<number | 'bank' | null>(null);
  useEffect(() => {
    setPending(null);
  }, [questionEndsAt]);
  return [pending, setPending] as const;
}

/**
 * The player / phone view. Answers are self-graded — this device sends
 * `answer` (with the tapped index) on your turn, `bank` on your turn if the
 * chain is worth locking in, and `vote` during a vote-off. Everything else
 * is a live status mirror of shared state.
 */
export function PlayerView({ state, userId, sendAction }: PlayerViewProps<GameState>) {
  const [pending, setPending] = usePendingTurnAction(state?.questionEndsAt ?? null);
  const secondsLeft = useCountdown(state?.questionEndsAt ?? null);
  const { playGoodbye, muted, toggleMute } = useGameSounds();

  // Speak the goodbye line on this device the instant *this* player is the
  // one voted off — timed with the "You're out." message below. Every hook
  // has to run unconditionally on every render (the early returns below
  // can't come before this), so the phase/eliminated check lives inside the
  // effect body instead of gating the hook call itself.
  const voteOff = state?.phase === 'vote-reveal' ? state.lastVoteOff : null;
  const lastGoodbyeIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (voteOff && voteOff.eliminatedId === userId && voteOff.eliminatedId !== lastGoodbyeIdRef.current) {
      playGoodbye(voteOff.nickname);
      lastGoodbyeIdRef.current = voteOff.eliminatedId;
    }
  }, [voteOff, userId, playGoodbye]);

  if (!state || state.phase === 'lobby') {
    return <Waiting message="Waiting for the host to start…" />;
  }

  const me = state.players[userId];
  if (!me) {
    return <Waiting message="You joined after this game started." sub="Hang tight for the next game." />;
  }

  if (state.phase === 'game-over') {
    const won = state.winnerId === userId;
    const winner = state.winnerId ? state.players[state.winnerId] : null;
    return (
      <Waiting
        message={won ? 'You win! 🎉' : 'Game over'}
        sub={winner ? `${winner.nickname} took home ${state.bank}.` : undefined}
      />
    );
  }

  if (me.eliminated) {
    return (
      <Waiting
        message="You're the weakest link — goodbye."
        sub="Go sit on the couch — you can still watch the rest of the game."
        muted={muted}
        onToggleMute={toggleMute}
      />
    );
  }

  if (state.phase === 'voting') {
    const myVote = state.votes[userId];
    return (
      <div className="wl-player-view">
        <h1 className="wl-player-title">Who's the weakest link?</h1>
        <StrongestLinkCallout state={state} />
        <ul className="wl-player-vote-list">
          {state.turnOrder
            .filter((id) => id !== userId)
            .map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={`wl-btn wl-player-vote-btn${myVote === id ? ' wl-player-vote-btn--selected' : ''}`}
                  onClick={() => sendAction('vote', { targetId: id })}
                >
                  {state.players[id].nickname}
                </button>
              </li>
            ))}
        </ul>
        {myVote && <p className="wl-player-vote-hint">Vote cast — waiting for everyone else…</p>}
      </div>
    );
  }

  if (state.phase === 'vote-reveal') {
    if (voteOff) {
      const iWasEliminated = voteOff.eliminatedId === userId;
      return (
        <Waiting
          message={iWasEliminated ? "You're out." : `${voteOff.nickname} is out.`}
          sub={iWasEliminated ? 'Go sit on the couch.' : 'Waiting for the next round…'}
          muted={muted}
          onToggleMute={toggleMute}
        />
      );
    }

    const myTargetId = state.votes[userId];
    if (!myTargetId) {
      // Shouldn't normally happen (you can't reach vote-reveal without
      // having voted), but stay well-defined rather than crash.
      return <Waiting message="Revealing the votes…" sub="Hang tight." />;
    }

    return (
      <div className="wl-player-view">
        <h1 className="wl-player-title">Flip your card!</h1>
        <FlipVoteCard
          targetNickname={state.players[myTargetId].nickname}
          revealed={state.revealedVoterIds.includes(userId)}
          interactive
          onReveal={() => sendAction('reveal-vote')}
        />
        <p className="wl-player-hint">
          {state.revealedVoterIds.length} of {state.turnOrder.length} revealed
        </p>
      </div>
    );
  }

  const question = state.questions[state.questionIndex % state.questions.length];

  if (state.phase === 'final') {
    const finalists = state.finalists!;
    const scores = state.finalScores!;
    const iAmFinalist = finalists.includes(userId);
    const isMyTurn = finalists[state.finalTurn] === userId;

    if (!iAmFinalist) {
      return (
        <div className="wl-player-view">
          <h1 className="wl-player-title">Final</h1>
          <ul className="wl-player-final-scores">
            {finalists.map((id) => (
              <li key={id}>
                {state.players[id].nickname}: {scores[id]}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div className="wl-player-view">
        <h1 className="wl-player-title">{isMyTurn ? "It's your turn!" : 'Opponent is up'}</h1>
        <ul className="wl-player-final-scores">
          {finalists.map((id) => (
            <li key={id} className={id === userId ? 'wl-player-final-scores--mine' : ''}>
              {state.players[id].nickname}: {scores[id]}
            </li>
          ))}
        </ul>
        {isMyTurn ? (
          <>
            {secondsLeft !== null && <p className="wl-player-clock">{secondsLeft}s</p>}
            <p className="wl-player-prompt">{question.prompt}</p>
            <QuestionOptions
              options={question.options}
              selectedIndex={typeof pending === 'number' ? pending : null}
              correctIndex={null}
              disabled={pending !== null}
              onSelect={(index) => {
                setPending(index);
                sendAction('answer', { index });
              }}
            />
          </>
        ) : (
          <p className="wl-player-hint">Waiting for your opponent to answer…</p>
        )}
      </div>
    );
  }

  // 'money'
  const isMyTurn = currentTurnUserId(state) === userId;
  const currentNickname = (() => {
    const id = currentTurnUserId(state);
    return id ? state.players[id].nickname : '';
  })();

  return (
    <div className="wl-player-view">
      <h1 className="wl-player-title">{isMyTurn ? "It's your turn!" : `${currentNickname}'s turn`}</h1>
      <div className="wl-player-totals">
        <span>Chain: {state.currentChain}</span>
        <span>Round pot: {state.roundPot}</span>
        <span>Bank: {state.bank}</span>
      </div>
      {isMyTurn ? (
        <>
          {secondsLeft !== null && <p className="wl-player-clock">{secondsLeft}s</p>}
          <p className="wl-player-prompt">{question.prompt}</p>
          {state.currentChain > 0 && (
            <button
              type="button"
              className="wl-btn wl-btn--primary wl-player-bank"
              disabled={pending !== null}
              onClick={() => {
                setPending('bank');
                sendAction('bank');
              }}
            >
              {pending === 'bank' ? 'Banked!' : `Bank ${state.currentChain}`}
            </button>
          )}
          <QuestionOptions
            options={question.options}
            selectedIndex={typeof pending === 'number' ? pending : null}
            correctIndex={null}
            disabled={pending !== null}
            onSelect={(index) => {
              setPending(index);
              sendAction('answer', { index });
            }}
          />
        </>
      ) : (
        <p className="wl-player-hint">Waiting for your turn…</p>
      )}
    </div>
  );
}
