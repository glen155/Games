import { nicknameWithIcon } from '@games/platform';
import type { GameState } from '../types';
import { TimelineStrip } from './TimelineStrip';

interface ScoreboardProps {
  state: GameState;
}

export function Scoreboard({ state }: ScoreboardProps) {
  const standings = [...state.playerOrder].sort((a, b) => {
    const pa = state.players[a];
    const pb = state.players[b];
    if (pb.timeline.length !== pa.timeline.length) return pb.timeline.length - pa.timeline.length;
    return pa.misses - pb.misses;
  });

  return (
    <div className="mt-scoreboard">
      <h2 className="mt-scoreboard-title">Standings</h2>
      <ul className="mt-scoreboard-list">
        {standings.map((id) => {
          const player = state.players[id];
          return (
            <li key={id} className="mt-scoreboard-row">
              <div className="mt-scoreboard-name">
                {nicknameWithIcon(player.nickname)}{' '}
                <span className="mt-scoreboard-count">
                  {player.timeline.length}/{state.targetCards}
                </span>
              </div>
              <TimelineStrip cards={player.timeline} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
