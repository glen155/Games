import type { PlayerPresence } from '@games/platform';
import type { PlayerClueResult } from '../types';

interface PlayerJudgePanelProps {
  players: PlayerPresence[];
  verdicts: Record<string, PlayerClueResult>;
  onMark: (userId: string, nickname: string, correct: boolean) => void;
}

/**
 * Host-only, hosted-mode "Open Guess" judging UI. For every currently
 * connected player, the host taps Correct or Wrong after hearing their
 * spoken guess — this never computes anything from clue data, it just
 * records the host's call, exactly like Family Feud's AnswerJudgePanel /
 * REVEAL_ANSWER pattern.
 */
export function PlayerJudgePanel({ players, verdicts, onMark }: PlayerJudgePanelProps) {
  if (players.length === 0) {
    return <p className="player-tally">Waiting for players to join…</p>;
  }

  return (
    <div className="judge-panel">
      <p className="judge-panel-hint">Only you can see this — tap how each player did.</p>
      <ul className="judge-panel-player-list">
        {[...players]
          .sort((a, b) => a.nickname.localeCompare(b.nickname))
          .map((p) => {
            const verdict = verdicts[p.userId];
            return (
              <li key={p.userId} className="judge-panel-player-row">
                <span className="judge-panel-player-name">{p.nickname}</span>
                <div className="judge-panel-player-buttons">
                  <button
                    type="button"
                    className={`judge-panel-mark judge-panel-mark--correct${verdict?.correct === true ? ' judge-panel-mark--active' : ''}`}
                    onClick={() => onMark(p.userId, p.nickname, true)}
                  >
                    ✓ Correct
                  </button>
                  <button
                    type="button"
                    className={`judge-panel-mark judge-panel-mark--wrong${verdict?.correct === false ? ' judge-panel-mark--active' : ''}`}
                    onClick={() => onMark(p.userId, p.nickname, false)}
                  >
                    ✗ Wrong
                  </button>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
