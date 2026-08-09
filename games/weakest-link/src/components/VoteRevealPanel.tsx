import type { GameState } from '../types';

interface VoteRevealPanelProps {
  state: GameState;
  onContinue: () => void;
}

/** Dramatic reveal: every candidate's vote count, who's going home, and
 * whether it came down to a tie broken by this round's weakest performance. */
export function VoteRevealPanel({ state, onContinue }: VoteRevealPanelProps) {
  const voteOff = state.lastVoteOff;
  if (!voteOff) return null;

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
