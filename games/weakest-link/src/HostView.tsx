import { useEffect, useRef } from 'react';
import { recordGameResult, type HostViewProps } from '@games/platform';
import type { GameState } from './types';
import {
  ROUND_QUESTION_TARGET,
  currentQuestion,
  currentTurnUserId,
  type WeakestLinkAction,
} from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useRoundClock } from './hooks/useRoundClock';
import { LobbyPanel } from './components/LobbyPanel';
import { PlayerRoster } from './components/PlayerRoster';
import { ChainMeter } from './components/ChainMeter';
import { RoundTimer } from './components/RoundTimer';
import { QuestionPanel } from './components/QuestionPanel';
import { VotingPanel } from './components/VotingPanel';
import { VoteRevealPanel } from './components/VoteRevealPanel';
import { FinalRoundPanel } from './components/FinalRoundPanel';
import { GameOverScreen } from './components/GameOverScreen';

/**
 * The host / big-screen view. Answers are self-graded on the current
 * player's own device (or the host's local-player path in pass-and-play) —
 * the host's job is registering players, running the round/question clocks,
 * absorbing `bank`/`answer`/`vote` from phones, and pacing the vote-off
 * reveal and round transitions.
 */
export function HostView({
  state,
  dispatch,
  players,
  playerActions,
  clearPlayerAction,
  isHosted,
  roomId,
}: HostViewProps<GameState, WeakestLinkAction>) {
  const { playCorrect, playWrong, playBank, playTick, playEliminate, playWin, muted, toggleMute } =
    useGameSounds();
  const { questionRemainingMs, roundRemainingMs } = useRoundClock(state, dispatch);

  // Register remotely-joined players while still in the lobby. Late joiners
  // after the game has started are shown as connected but not added mid-game
  // (same rule Music Timeline uses).
  useEffect(() => {
    if (state.phase !== 'lobby') return;
    for (const p of players) {
      if (!state.players[p.userId]) {
        dispatch({ type: 'PLAYER_JOINED', userId: p.userId, nickname: p.nickname });
      }
    }
  }, [state.phase, state.players, players, dispatch]);

  // Wire remote players' `sendAction('bank')` / `sendAction('answer', {index})`
  // / `sendAction('vote', {targetId})` into the reducer — mirrors Family
  // Feud's HostView watching playerActions for buzzes.
  useEffect(() => {
    for (const action of playerActions) {
      if (action.type === 'bank') {
        dispatch({ type: 'BANK', userId: action.userId, at: Date.now() });
        clearPlayerAction(action.id);
      } else if (action.type === 'answer') {
        const payload = action.payload as { index?: number } | undefined;
        if (typeof payload?.index === 'number') {
          if (state.phase === 'money') {
            dispatch({ type: 'SUBMIT_ANSWER', userId: action.userId, index: payload.index, at: Date.now() });
          } else if (state.phase === 'final') {
            dispatch({ type: 'SUBMIT_FINAL_ANSWER', userId: action.userId, index: payload.index, at: Date.now() });
          }
        }
        clearPlayerAction(action.id);
      } else if (action.type === 'vote') {
        const payload = action.payload as { targetId?: string } | undefined;
        if (payload?.targetId) {
          dispatch({ type: 'CAST_VOTE', voterId: action.userId, targetId: payload.targetId });
        }
        clearPlayerAction(action.id);
      } else if (action.type === 'reveal-vote') {
        dispatch({ type: 'REVEAL_VOTE', voterId: action.userId });
        clearPlayerAction(action.id);
      }
    }
  }, [playerActions, state.phase, dispatch, clearPlayerAction]);

  // Record the finished game to the cross-night family leaderboard. Hosted
  // mode only — solo play has no room to record against.
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (isHosted && roomId && state.phase === 'game-over' && prevPhaseRef.current !== 'game-over') {
      const winner = state.winnerId ? state.players[state.winnerId] : null;
      void recordGameResult('weakest-link', roomId, {
        winner: winner?.nickname ?? null,
        bank: state.bank,
        players: state.playerOrder.map((id) => ({
          userId: id,
          nickname: state.players[id].nickname,
          totalCorrect: state.players[id].totalCorrect,
          totalWrong: state.players[id].totalWrong,
        })),
      });
    }
    prevPhaseRef.current = state.phase;
  }, [isHosted, roomId, state.phase, state.winnerId, state.bank, state.players, state.playerOrder]);

  useEffect(() => {
    if (state.phase === 'game-over') playWin();
    // Only fire once, right when the phase flips — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function handleBank(userId: string) {
    dispatch({ type: 'BANK', userId, at: Date.now() });
    playBank();
  }

  function handleLocalAnswer(userId: string, index: number) {
    const correct = index === currentQuestion(state).correctIndex;
    dispatch({ type: 'SUBMIT_ANSWER', userId, index, at: Date.now() });
    if (correct) playCorrect();
    else playWrong();
  }

  function handleLocalFinalAnswer(userId: string, index: number) {
    const correct = index === currentQuestion(state).correctIndex;
    dispatch({ type: 'SUBMIT_FINAL_ANSWER', userId, index, at: Date.now() });
    if (correct) playCorrect();
    else playWrong();
  }

  function handleCastVote(voterId: string, targetId: string) {
    dispatch({ type: 'CAST_VOTE', voterId, targetId });
  }

  function handleLocalReveal(voterId: string) {
    dispatch({ type: 'REVEAL_VOTE', voterId });
    playTick();
  }

  function handleForceReveal() {
    dispatch({ type: 'FORCE_REVEAL_REMAINING_VOTES' });
    playTick();
  }

  function handleAdvanceAfterVote() {
    dispatch({ type: 'ADVANCE_AFTER_VOTE', at: Date.now() });
    playEliminate();
  }

  if (state.phase === 'lobby') {
    return (
      <div className="wl-app">
        <LobbyPanel state={state} dispatch={dispatch} />
      </div>
    );
  }

  if (state.phase === 'game-over') {
    return <GameOverScreen state={state} onPlayAgain={() => dispatch({ type: 'RESET_GAME' })} />;
  }

  if (state.phase === 'final') {
    return (
      <div className="wl-app">
        <button type="button" className="wl-mute" onClick={toggleMute}>
          {muted ? '🔇' : '🔊'}
        </button>
        <FinalRoundPanel
          state={state}
          question={currentQuestion(state)}
          questionRemainingMs={questionRemainingMs}
          onLocalAnswer={handleLocalFinalAnswer}
        />
      </div>
    );
  }

  if (state.phase === 'voting') {
    return (
      <div className="wl-app">
        <VotingPanel state={state} onLocalVote={handleCastVote} />
      </div>
    );
  }

  if (state.phase === 'vote-reveal') {
    return (
      <div className="wl-app">
        <VoteRevealPanel
          state={state}
          onLocalReveal={handleLocalReveal}
          onForceReveal={handleForceReveal}
          onContinue={handleAdvanceAfterVote}
        />
      </div>
    );
  }

  // 'money'
  const turnId = currentTurnUserId(state);
  const turnPlayer = turnId ? state.players[turnId] : null;

  return (
    <div className="wl-app">
      <button type="button" className="wl-mute" onClick={toggleMute}>
        {muted ? '🔇' : '🔊'}
      </button>
      <p className="wl-round-label">
        Round {state.roundNumber} · Question {state.questionsAskedThisRound + 1} of {ROUND_QUESTION_TARGET}
      </p>
      <RoundTimer remainingMs={roundRemainingMs} />
      <PlayerRoster state={state} currentTurnId={turnId} />
      <ChainMeter
        chainStep={state.chainStep}
        currentChain={state.currentChain}
        roundPot={state.roundPot}
        bank={state.bank}
      />
      {turnPlayer && (
        <QuestionPanel
          question={currentQuestion(state)}
          currentNickname={turnPlayer.nickname}
          questionRemainingMs={questionRemainingMs}
          showLocalControls={turnPlayer.userId.startsWith('local-')}
          onLocalAnswer={(index) => handleLocalAnswer(turnPlayer.userId, index)}
          bank={{ chain: state.currentChain, onBank: () => handleBank(turnPlayer.userId) }}
        />
      )}
    </div>
  );
}
