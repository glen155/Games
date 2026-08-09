import type { GameState } from '../types';
import { FlipVoteCard } from './FlipVoteCard';

interface VoteRevealPanelProps {
  state: GameState;
  /** Dispatches REVEAL_VOTE for a 'local-' voter sharing this screen. */
  onLocalReveal: (voterId: string) => void;
  /** Host escape hatch — reveals everyone still un-flipped at once. */
  onForceReveal: () => void;
  onContinue: () => void;
}

/**
 * Vote-off reveal: every voter gets their own face-down card, showing who
 * they voted for once *they* flip it — free-for-all, in whatever order
 * people actually do it. Remote voters' cards here are read-only (their
 * real flip happens on their own phone); a 'local-' voter's card is
 * tappable right on this screen, same as the local Bank button elsewhere.
 * Once everyone's flipped, the final tally/eliminated/tie-break verdict
 * appears, unchanged from before.
 */
export function VoteRevealPanel({ state, onLocalReveal, onForceReveal, onContinue }: VoteRevealPanelProps) {
  const voteOff = state.lastVoteOff;

  if (!voteOff) {
    const revealedCount = state.revealedVoterIds.length;
    return (
      <div className="wl-vote-reveal">
        <h2 className="wl-vote-reveal-title">Flip your card!</h2>
        <p className="wl-vote-reveal-progress">
          {revealedCount} of {state.turnOrder.length} revealed
        </p>
        <div className="wl-flip-card-grid">
          {state.turnOrder.map((voterId) => {
            const targetId = state.votes[voterId];
            return (
              <FlipVoteCard
                key={voterId}
                ownerNickname={state.players[voterId].nickname}
                targetNickname={targetId ? state.players[targetId].nickname : '?'}
                revealed={state.revealedVoterIds.includes(voterId)}
                interactive={voterId.startsWith('local-')}
                onReveal={() => onLocalReveal(voterId)}
              />
            );
          })}
        </div>
        <button type="button" className="wl-btn wl-vote-reveal-force" onClick={onForceReveal}>
          Reveal remaining votes
        </button>
      </div>
    );
  }

  const tallyRows = state.turnOrder
    .map((id) => ({ id, nickname: state.players[id].nickname, votes: voteOff.tally[id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="wl-vote-reveal">
      <h2 className="wl-vote-reveal-title">You are the weakest link.</h2>
      <ul className="wl-vote-reveal-tally">
        {tallyRows.map((row) => (
          <li
            key={row.id}
            className={`wl-vote-reveal-row${row.id === voteOff.eliminatedId ? ' wl-vote-reveal-row--out' : ''}`}
          >
            <span>{row.nickname}</span>
            <span className="wl-vote-reveal-count">{row.votes} vote{row.votes === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>
      {voteOff.tieBroken && (
        <p className="wl-vote-reveal-note">
          Tied vote — broken by this round's weakest performance.
        </p>
      )}
      <p className="wl-vote-reveal-out">{voteOff.nickname}, goodbye.</p>
      <button type="button" className="wl-btn wl-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
