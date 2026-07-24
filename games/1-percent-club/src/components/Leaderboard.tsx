import type { PlayerPresence } from '@games/platform';

interface LeaderboardProps {
  jackpotAmount: number;
  players: PlayerPresence[];
  playerCorrectCounts: Record<string, number>;
  outOfRunningIds: string[];
  onPlayAgain: () => void;
}

/**
 * Hosted-mode ending. The simulated crowd always reaches the jackpot (that's
 * the point of it being simulated) — this is a bragging-rights leaderboard for
 * the real players who answered alongside it, not a win/lose screen for them.
 */
export function Leaderboard({
  jackpotAmount,
  players,
  playerCorrectCounts,
  outOfRunningIds,
  onPlayAgain,
}: LeaderboardProps) {
  const ranked = [...players].sort(
    (a, b) => (playerCorrectCounts[b.userId] ?? 0) - (playerCorrectCounts[a.userId] ?? 0),
  );
  const champions = ranked.filter((p) => !outOfRunningIds.includes(p.userId));

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">The crowd made it! 🎉</h2>
        <p className="modal-winner">
          The simulated crowd claims the £{jackpotAmount.toLocaleString()} jackpot — here's how
          everyone playing along did:
        </p>
        {ranked.length > 0 && (
          <ul className="leaderboard-list">
            {ranked.map((p) => {
              const stillIn = !outOfRunningIds.includes(p.userId);
              return (
                <li key={p.userId} className={`leaderboard-item${stillIn ? ' leaderboard-item--champion' : ''}`}>
                  <span className="leaderboard-name">
                    {p.nickname}
                    {stillIn && <span className="leaderboard-badge">Never missed!</span>}
                  </span>
                  <span className="leaderboard-score">{playerCorrectCounts[p.userId] ?? 0} correct</span>
                </li>
              );
            })}
          </ul>
        )}
        {champions.length > 0 && (
          <p className="leaderboard-champions">
            Bragging rights: {champions.map((p) => p.nickname).join(', ')} answered every question
            right!
          </p>
        )}
        <button type="button" className="modal-play-again" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
