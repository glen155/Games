import { nicknameWithIcon, type PlayerPresence } from '@games/platform';

interface LeaderboardProps {
  players: PlayerPresence[];
  playerCorrectCounts: Record<string, number>;
  totalClues: number;
  onPlayAgain: () => void;
}

/**
 * Hosted-mode ending. Everyone answers every clue (no elimination) — this
 * ranks players by total correct count and badges the top scorer(s) as the
 * winner(s) of this match.
 */
export function Leaderboard({ players, playerCorrectCounts, totalClues, onPlayAgain }: LeaderboardProps) {
  const ranked = [...players].sort(
    (a, b) => (playerCorrectCounts[b.userId] ?? 0) - (playerCorrectCounts[a.userId] ?? 0),
  );
  const topScore = ranked.length > 0 ? (playerCorrectCounts[ranked[0].userId] ?? 0) : 0;
  const winners = ranked.filter((p) => topScore > 0 && (playerCorrectCounts[p.userId] ?? 0) === topScore);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">Showdown over! 🎬</h2>
        <p className="modal-winner">
          {winners.length > 0
            ? `${winners.map((p) => p.nickname).join(' & ')} won with ${topScore} of ${totalClues} correct!`
            : "Nobody got one right — everybody's tied at zero!"}
        </p>
        {ranked.length > 0 && (
          <ul className="leaderboard-list">
            {ranked.map((p) => {
              const isWinner = winners.some((w) => w.userId === p.userId);
              return (
                <li key={p.userId} className={`leaderboard-item${isWinner ? ' leaderboard-item--champion' : ''}`}>
                  <span className="leaderboard-name">
                    {nicknameWithIcon(p.nickname)}
                    {isWinner && <span className="leaderboard-badge">Winner</span>}
                  </span>
                  <span className="leaderboard-score">
                    {playerCorrectCounts[p.userId] ?? 0} / {totalClues} correct
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" className="modal-play-again" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
