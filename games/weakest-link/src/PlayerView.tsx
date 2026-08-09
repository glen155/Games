import type { PlayerViewProps } from '@games/platform';
import type { GameState } from './types';
import { currentTurnUserId } from './state/gameReducer';

function Waiting({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="wl-player-view wl-player-view--waiting">
      <p className="wl-player-waiting-message">{message}</p>
      {sub && <p className="wl-player-waiting-sub">{sub}</p>}
    </div>
  );
}

/**
 * The player / phone view. The host reads questions aloud and judges answers
 * (free text can't be auto-graded), so this device only ever needs to send
 * two things: `bank` on your turn, and `vote` during a vote-off — everything
 * else is a status display.
 */
export function PlayerView({ state, userId, sendAction }: PlayerViewProps<GameState>) {
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
    return <Waiting message="You're the weakest link — goodbye." sub="Watching the rest of the game." />;
  }

  if (state.phase === 'voting') {
    const myVote = state.votes[userId];
    return (
      <div className="wl-player-view">
        <h1 className="wl-player-title">Who's the weakest link?</h1>
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
    const voteOff = state.lastVoteOff;
    const iWasEliminated = voteOff?.eliminatedId === userId;
    return (
      <Waiting
        message={iWasEliminated ? "You're out." : `${voteOff?.nickname ?? 'A player'} is out.`}
        sub="Waiting for the next round…"
      />
    );
  }

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
        <p className="wl-player-final-hint">The host will judge your answer out loud.</p>
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
        state.currentChain > 0 ? (
          <button type="button" className="wl-btn wl-btn--primary wl-player-bank" onClick={() => sendAction('bank')}>
            Bank {state.currentChain}
          </button>
        ) : (
          <p className="wl-player-hint">Answer out loud — the host will judge it.</p>
        )
      ) : (
        <p className="wl-player-hint">Waiting for your turn…</p>
      )}
    </div>
  );
}
