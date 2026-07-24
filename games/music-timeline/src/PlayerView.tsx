import type { PlayerViewProps } from '@games/platform';
import type { GameState } from './types';
import { WaitingScreen } from './components/WaitingScreen';
import { ListeningPrompt } from './components/ListeningPrompt';
import { GapPicker } from './components/GapPicker';
import { RevealFeedback } from './components/RevealFeedback';
import { SelfTimeline } from './components/SelfTimeline';

/**
 * The player / phone view. Never renders a track's year, title, or artist
 * before that round's reveal phase — this is what keeps the year hidden from
 * players. Looks itself up in `state.players[userId]` to find its own,
 * otherwise-hidden timeline.
 */
export function PlayerView({ state, userId, players, sendAction }: PlayerViewProps<GameState>) {
  if (!state || state.phase === 'lobby') {
    return <WaitingScreen message="Waiting for the host to start…" />;
  }

  const me = state.players[userId];
  if (!me) {
    return (
      <WaitingScreen
        message="You joined after this game started."
        sub="Hang tight for the next game."
      />
    );
  }

  if (state.phase === 'game_over') {
    const won = state.winnerUserIds.includes(userId);
    return (
      <div className="mt-player-view">
        <WaitingScreen
          message={won ? 'You win! 🎉' : 'Game over'}
          sub={`Final: ${me.timeline.length} / ${state.targetCards} cards`}
        />
        <SelfTimeline cards={me.timeline} targetCards={state.targetCards} />
      </div>
    );
  }

  const round = state.round;
  const spectating = round?.eligibleUserIds && !round.eligibleUserIds.includes(userId);
  if (spectating) {
    return <WaitingScreen message="Sudden death!" sub="Watching the tiebreak round." />;
  }

  const locked = round ? userId in round.locks : false;

  return (
    <div className="mt-player-view">
      <div className="mt-player-header">
        <span className="mt-player-you">{me.nickname}</span>
        <span className="mt-player-count">
          {me.timeline.length} / {state.targetCards}
        </span>
      </div>

      {state.phase === 'loading_track' && <ListeningPrompt />}

      {state.phase === 'playing' &&
        (locked ? (
          <WaitingScreen message="You're locked in ✓" sub="Waiting for everyone else…" />
        ) : (
          <GapPicker
            timeline={me.timeline}
            locked={locked}
            onLock={(gapIndex) => sendAction('lock_guess', { gapIndex })}
          />
        ))}

      {state.phase === 'locked' && <WaitingScreen message="Time's up!" sub="Resolving…" />}

      {state.phase === 'reveal' && round && (
        <RevealFeedback
          track={findTrack(state, round.trackId)}
          result={round.results?.[userId]}
        />
      )}

      <SelfTimeline cards={me.timeline} targetCards={state.targetCards} />
      <p className="mt-player-roster-count">{players.length} in room</p>
    </div>
  );
}

function findTrack(state: GameState, trackId: string) {
  return state.trackPool.find((t) => t.id === trackId)!;
}
