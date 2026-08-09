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
import { LobbyPanel } from './components/LobbyPanel';
import { PlayerRoster } from './components/PlayerRoster';
import { ChainMeter } from './components/ChainMeter';
import { JudgePanel } from './components/JudgePanel';
import { VotingPanel } from './components/VotingPanel';
import { VoteRevealPanel } from './components/VoteRevealPanel';
import { FinalRoundPanel } from './components/FinalRoundPanel';
import { GameOverScreen } from './components/GameOverScreen';

/**
 * The host / big-screen view. Turns are host-judged (free-text trivia can't
 * be auto-graded, same as Family Feud's AnswerJudgePanel), so every scoring
 * action here is a host button tap, not something driven off playerActions —
 * only `bank` and `vote` come in from phones.
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
  const { playCorrect, playWrong, playBank, playEliminate, playWin, muted, toggleMute } = useGameSounds();

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

  // Wire remote players' `sendAction('bank')` / `sendAction('vote', {targetId})`
  // into the reducer — mirrors Family Feud's HostView watching playerActions.
  useEffect(() => {
    for (const action of playerActions) {
      if (action.type === 'bank') {
        dispatch({ type: 'BANK', userId: action.userId });
        clearPlayerAction(action.id);
      } else if (action.type === 'vote') {
        const payload = action.payload as { targetId?: string } | undefined;
        if (payload?.targetId) {
          dispatch({ type: 'CAST_VOTE', voterId: action.userId, targetId: payload.targetId });
        }
        clearPlayerAction(action.id);
      }
    }
  }, [playerActions, dispatch, clearPlayerAction]);

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

  function handleJudge(correct: boolean) {
    dispatch({ type: 'JUDGE_ANSWER', correct });
    if (correct) playCorrect();
    else playWrong();
  }

  function handleBank(userId: string) {
    dispatch({ type: 'BANK', userId });
    playBank();
  }

  function handleLocalVote(voterId: string, targetId: string) {
    dispatch({ type: 'CAST_VOTE', voterId, targetId });
  }

  function handleRevealVotes() {
    dispatch({ type: 'REVEAL_VOTES' });
  }

  function handleAdvanceAfterVote() {
    dispatch({ type: 'ADVANCE_AFTER_VOTE' });
    playEliminate();
  }

  function handleFinalJudge(correct: boolean) {
    dispatch({ type: 'FINAL_JUDGE', correct });
    if (correct) playCorrect();
    else playWrong();
  }

  useEffect(() => {
    if (state.phase === 'game-over') playWin();
    // Only fire once, right when the phase flips — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

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
        <FinalRoundPanel state={state} question={currentQuestion(state)} onJudge={handleFinalJudge} />
      </div>
    );
  }

  if (state.phase === 'voting') {
    return (
      <div className="wl-app">
        <VotingPanel state={state} onLocalVote={handleLocalVote} onReveal={handleRevealVotes} />
      </div>
    );
  }

  if (state.phase === 'vote-reveal') {
    return (
      <div className="wl-app">
        <VoteRevealPanel state={state} onContinue={handleAdvanceAfterVote} />
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
      <PlayerRoster state={state} currentTurnId={turnId} />
      <ChainMeter
        chainStep={state.chainStep}
        currentChain={state.currentChain}
        roundPot={state.roundPot}
        bank={state.bank}
      />
      {turnPlayer && (
        <JudgePanel
          question={currentQuestion(state)}
          currentNickname={turnPlayer.nickname}
          chain={state.currentChain}
          showLocalBank={turnPlayer.userId.startsWith('local-')}
          onJudge={handleJudge}
          onBank={() => handleBank(turnPlayer.userId)}
        />
      )}
    </div>
  );
}
