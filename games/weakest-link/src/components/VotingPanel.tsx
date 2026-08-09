import type { GameState } from '../types';

interface VotingPanelProps {
  state: GameState;
  onLocalVote: (voterId: string, targetId: string) => void;
  onReveal: () => void;
}

/**
 * Vote-off phase: shows who's voted (✓/…) without revealing *who* they voted
 * for — same "no early tells" spirit as Music Timeline's TimelineLockStatus —
 * plus inline vote-casting for any player sharing this screen (a 'local-'
 * id). Remote players vote from their own phone via `sendAction('vote', …)`.
 */
export function VotingPanel({ state, onLocalVote, onReveal }: VotingPanelProps) {
  const everyoneVoted = Object.keys(state.votes).length >= state.turnOrder.length;
  const localVoters = state.turnOrder.filter((id) => id.startsWith('local-'));

  return (
    <div className="wl-voting">
      <h2 className="wl-voting-title">Who's the weakest link?</h2>
      <p className="wl-voting-sub">Round pot of {state.roundPot === 0 ? 'nothing this round' : state.roundPot} is safe in the bank.</p>

      <ul className="wl-voting-status">
        {state.turnOrder.map((id) => (
          <li key={id} className={`wl-voting-status-row${id in state.votes ? ' voted' : ''}`}>
            <span>{state.players[id].nickname}</span>
            <span className="wl-voting-status-icon">{id in state.votes ? '✓' : '…'}</span>
          </li>
        ))}
      </ul>

      {localVoters.length > 0 && (
        <div className="wl-voting-local">
          {localVoters.map((voterId) => (
            <div key={voterId} className="wl-voting-local-row">
              <h3 className="wl-voting-local-name">{state.players[voterId].nickname}, vote:</h3>
              <div className="wl-voting-local-targets">
                {state.turnOrder
                  .filter((targetId) => targetId !== voterId)
                  .map((targetId) => (
                    <button
                      key={targetId}
                      type="button"
                      className={`wl-btn wl-voting-target${
                        state.votes[voterId] === targetId ? ' wl-voting-target--selected' : ''
                      }`}
                      onClick={() => onLocalVote(voterId, targetId)}
                    >
                      {state.players[targetId].nickname}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="wl-btn wl-btn--primary wl-voting-reveal"
        disabled={!everyoneVoted}
        onClick={onReveal}
      >
        {everyoneVoted ? 'Reveal Votes' : 'Waiting for everyone to vote…'}
      </button>
    </div>
  );
}
