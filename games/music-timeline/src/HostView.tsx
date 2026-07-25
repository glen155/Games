import { useEffect } from 'react';
import type { HostViewProps } from '@games/platform';
import type { GameState } from './types';
import type { MusicTimelineAction } from './state/gameReducer';
import { useShotClock } from './hooks/useShotClock';
import { LobbyPanel } from './components/LobbyPanel';
import { TrackLoader } from './components/TrackLoader';
import { ShotClock } from './components/ShotClock';
import { TimelineLockStatus } from './components/TimelineLockStatus';
import { LocalGapPicker } from './components/LocalGapPicker';
import { RevealPanel } from './components/RevealPanel';
import { SuddenDeathBanner } from './components/SuddenDeathBanner';
import { Scoreboard } from './components/Scoreboard';
import { WinScreen } from './components/WinScreen';

/**
 * The host / big-screen view. Drives the round state machine, and is the only
 * place the true year, title, and artist of the *current* round ever exist in
 * this component tree before reveal — TrackLoader deliberately never reads
 * them. Past rounds' revealed cards are safe to show (Scoreboard, WinScreen).
 */
export function HostView({
  state,
  dispatch,
  players,
  playerActions,
  clearPlayerAction,
}: HostViewProps<GameState, MusicTimelineAction>) {
  const { remainingMs } = useShotClock(state, dispatch, players);

  // Wire remote players' `sendAction('lock_guess', { gapIndex })` into the
  // reducer — mirrors Family Feud's HostView watching playerActions for buzzes.
  useEffect(() => {
    for (const action of playerActions) {
      if (action.type !== 'lock_guess') continue;
      const payload = action.payload as { gapIndex: number };
      dispatch({
        type: 'LOCK_GUESS',
        userId: action.userId,
        gapIndex: payload.gapIndex,
        receivedAt: Date.now(),
      });
      clearPlayerAction(action.id);
    }
  }, [playerActions, dispatch, clearPlayerAction]);

  // Register remotely-joined players while still in the lobby. Late joiners
  // after the game has started are shown as connected but not added mid-game.
  useEffect(() => {
    if (state.phase !== 'lobby') return;
    for (const p of players) {
      if (!state.players[p.userId]) {
        dispatch({ type: 'PLAYER_JOINED', userId: p.userId, nickname: p.nickname });
      }
    }
  }, [state.phase, state.players, players, dispatch]);

  if (state.phase === 'game_over') {
    return <WinScreen state={state} onPlayAgain={() => dispatch({ type: 'RESET_GAME' })} />;
  }

  if (state.phase === 'lobby') {
    return (
      <div className="mt-app">
        <LobbyPanel state={state} dispatch={dispatch} />
      </div>
    );
  }

  const round = state.round;
  const eligibleLocalPlayers = state.playerOrder.filter(
    (id) => id.startsWith('local-') && (!round?.eligibleUserIds || round.eligibleUserIds.includes(id)),
  );
  // Captured as a fixed-type local so it stays narrowed inside the .map() closure below
  // (TS doesn't carry a `state.phase === X` narrowing through a nested function).
  const roundInputPhase =
    state.phase === 'playing' || state.phase === 'locked' ? state.phase : null;

  return (
    <div className="mt-app">
      {state.suddenDeath?.active && (
        <SuddenDeathBanner contenders={state.suddenDeath.contenders} players={state.players} />
      )}
      <div className="mt-host-main">
        <div className="mt-host-stage">
          {state.phase === 'loading_track' && (
            <TrackLoader
              state={state}
              onConfirm={() => dispatch({ type: 'HOST_CONFIRMED_PLAYING', at: Date.now() })}
            />
          )}

          {roundInputPhase && (
            <>
              <ShotClock
                remainingMs={remainingMs}
                shotClockMs={round?.shotClockMs ?? 0}
                phase={roundInputPhase}
              />
              <TimelineLockStatus state={state} players={players} />
              {eligibleLocalPlayers.length > 0 && (
                <div className="mt-local-pickers">
                  {eligibleLocalPlayers.map((id) => (
                    <LocalGapPicker
                      key={id}
                      player={state.players[id]}
                      round={round}
                      phase={roundInputPhase}
                      onLock={(gapIndex) =>
                        dispatch({ type: 'LOCK_GUESS', userId: id, gapIndex, receivedAt: Date.now() })
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {state.phase === 'reveal' && (
            <RevealPanel state={state} onNext={() => dispatch({ type: 'ADVANCE_ROUND', at: Date.now() })} />
          )}
        </div>
        <Scoreboard state={state} />
      </div>
    </div>
  );
}
