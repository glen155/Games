import type { GameState } from '../types';

interface VoteRevealPanelProps {
  state: GameState;
  onRevealNext: () => void;
  onContinue: () => void;
}

/** Dramatic reveal: votes come out one at a time as anonymous tally ticks —
 * same "no early tells" spirit as the voting screen, nobody's individual
 * vote is ever attributed — building suspense before the final tally, who's
 * going home, and whether it came down to a tie broken by this round's
 * weakest performance. */
export function VoteRevealPanel({ state, onRevealNext, onContinue }: VoteRevealPanelProps) {
  const totalVotes = state.voteRevealOrder.length;

  if (!state.lastVoteOff) {
    // Still revealing — build a running tally from the votes revealed so far.
    const revealedSoFar = state.voteRevealOrder
      .slice(0, state.voteRevealIndex)
      .map((voterId) => state.votes[voterId]);
    const runningTally: Record<string, number> = {};
    for (const targetId of revealedSoFar) {
      runningTally[targetId] = (runningTally[targetId] ?? 0) + 1;
    }
    const rows = state.turnOrder
      .map((id) => ({ id, nickname: state.players[id].nickname, votes: runningTally[id] ?? 0 }))
      .sort((a, b) => b.votes - a.votes);

    return (
      <div className="wl-vote-reveal">
        <h2 className="wl-vote-reveal-title">Revealing the votes…</h2>
        <p className="wl-vote-reveal-progress">
          {state.voteRevealIndex} of {totalVotes} votes revealed
        </p>
        <ul className="wl-vote-reveal-tally">
          {rows.map((row) => (
            <li key={row.id} className="wl-vote-reveal-row">
              <span>{row.nickname}</span>
              <span className="wl-vote-reveal-count">{row.votes} vote{row.votes === 1 ? '' : 's'}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="wl-btn wl-btn--primary" onClick={onRevealNext}>
          Reveal Next Vote ({state.voteRevealIndex + 1} of {totalVotes})
        </button>
      </div>
    );
  }

  const voteOff = state.lastVoteOff;
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
