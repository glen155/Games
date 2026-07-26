import { useEffect, useMemo, useState } from 'react';
import { fetchRecentResults, isMultiplayerConfigured, type GameResult } from '@games/platform';
import type { ClubSummary, FeudSummary, SoundtrackSummary } from './types';

const GAME_NAMES: Record<string, string> = {
  'family-feud': 'Family Feud',
  'one-percent-club': '1% Club',
  'soundtrack-showdown': 'Soundtrack Showdown',
};

type Filter = 'all' | 'family-feud' | 'one-percent-club' | 'soundtrack-showdown';

interface StandingRow {
  nickname: string;
  played: number;
  won: number;
}

function computeStandings(results: GameResult[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  function bump(nickname: string, won: boolean) {
    const row = rows.get(nickname) ?? { nickname, played: 0, won: 0 };
    row.played += 1;
    if (won) row.won += 1;
    rows.set(nickname, row);
  }

  for (const r of results) {
    if (r.gameSlug === 'family-feud') {
      const s = r.summary as unknown as FeudSummary;
      for (const p of s.players ?? []) {
        const teamName = p.team === 0 ? s.teams[0]?.name : p.team === 1 ? s.teams[1]?.name : null;
        bump(p.nickname, teamName != null && teamName === s.winner);
      }
    } else if (r.gameSlug === 'one-percent-club') {
      const s = r.summary as unknown as ClubSummary;
      for (const p of s.players ?? []) {
        bump(p.nickname, p.neverMissed);
      }
    } else if (r.gameSlug === 'soundtrack-showdown') {
      const s = r.summary as unknown as SoundtrackSummary;
      const players = s.players ?? [];
      const topScore = players.reduce((max, p) => Math.max(max, p.correctCount), 0);
      for (const p of players) {
        bump(p.nickname, topScore > 0 && p.correctCount === topScore);
      }
    }
  }

  return [...rows.values()].sort((a, b) => b.won - a.won || b.played - a.played);
}

function summarize(result: GameResult): string {
  if (result.gameSlug === 'family-feud') {
    const s = result.summary as unknown as FeudSummary;
    const [a, b] = s.teams ?? [];
    if (!a || !b) return 'Family Feud match';
    return `${a.name} ${a.score} — ${b.name} ${b.score}${s.winner ? ` · ${s.winner} won` : ' · tied'}`;
  }
  if (result.gameSlug === 'one-percent-club') {
    const s = result.summary as unknown as ClubSummary;
    const players = s.players ?? [];
    const neverMissed = players.filter((p) => p.neverMissed);
    const jackpot = typeof s.jackpotAmount === 'number' ? `£${s.jackpotAmount.toLocaleString()}` : 'the jackpot';
    return `${jackpot} jackpot · ${players.length} played · ${neverMissed.length} never missed a question`;
  }
  if (result.gameSlug === 'soundtrack-showdown') {
    const s = result.summary as unknown as SoundtrackSummary;
    const players = s.players ?? [];
    const topScore = players.reduce((max, p) => Math.max(max, p.correctCount), 0);
    const winners = players.filter((p) => topScore > 0 && p.correctCount === topScore);
    const winnerNames = winners.map((p) => p.nickname).join(', ') || 'nobody';
    return `${s.totalClues ?? players.length} clues · ${players.length} played · ${winnerNames} scored ${topScore}`;
  }
  return 'Finished game';
}

export function App() {
  const [results, setResults] = useState<GameResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!isMultiplayerConfigured) return;
    fetchRecentResults(100)
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load results'));
  }, []);

  const filtered = useMemo(
    () => (results ?? []).filter((r) => filter === 'all' || r.gameSlug === filter),
    [results, filter],
  );
  const standings = useMemo(() => computeStandings(filtered), [filtered]);

  if (!isMultiplayerConfigured) {
    return (
      <div className="board-page">
        <h1>Family Leaderboard</h1>
        <p className="board-empty">
          This site isn't configured for multiplayer, so there's no shared game history to show.
        </p>
      </div>
    );
  }

  return (
    <div className="board-page">
      <h1>Family Leaderboard</h1>
      <p className="board-subtitle">Every finished hosted game, and who's been winning.</p>

      <div className="board-filters">
        {(['all', 'family-feud', 'one-percent-club', 'soundtrack-showdown'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`board-filter${filter === f ? ' board-filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All games' : GAME_NAMES[f]}
          </button>
        ))}
      </div>

      {error && <p className="board-error">{error}</p>}

      {results === null && !error && <p className="board-empty">Loading…</p>}

      {results !== null && (
        <div className="board-columns">
          <section className="board-section">
            <h2>Standings</h2>
            {standings.length === 0 ? (
              <p className="board-empty">No games recorded yet — go host one!</p>
            ) : (
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Won</th>
                    <th>Played</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.nickname}>
                      <td>{row.nickname}</td>
                      <td>{row.won}</td>
                      <td>{row.played}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="board-note">
              Standings are grouped by the exact name typed when joining — if someone uses a
              different nickname next time, it'll show up as a separate row.
            </p>
          </section>

          <section className="board-section">
            <h2>Recent games</h2>
            {filtered.length === 0 ? (
              <p className="board-empty">No games recorded yet.</p>
            ) : (
              <ul className="board-list">
                {filtered.map((r) => (
                  <li key={r.id} className="board-list-item">
                    <div className="board-list-header">
                      <span className="board-list-game">{GAME_NAMES[r.gameSlug] ?? r.gameSlug}</span>
                      <span className="board-list-date">{new Date(r.finishedAt).toLocaleString()}</span>
                    </div>
                    <p className="board-list-summary">{summarize(r)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
