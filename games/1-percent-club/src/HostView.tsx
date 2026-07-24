import { useEffect, useRef } from 'react';
import type { HostViewProps } from '@games/platform';
import type { GameState } from './types';
import { type GameAction } from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SetupScreen } from './components/SetupScreen';
import { StatusBar } from './components/StatusBar';
import { QuestionCard } from './components/QuestionCard';
import { OptionsGrid } from './components/OptionsGrid';
import { FeedbackBanner } from './components/FeedbackBanner';
import { ControlsPanel } from './components/ControlsPanel';
import { EndScreen } from './components/EndScreen';
import { PlayerTally } from './components/PlayerTally';
import { ResultsBreakdown } from './components/ResultsBreakdown';
import { Leaderboard } from './components/Leaderboard';
import { TimerControls } from './components/TimerControls';

/**
 * The host / big-screen view. Solo mode (isHosted === false) is the original
 * single-actor game, byte-for-byte: the host answers, the simulated crowd of
 * 100 shrinks per the scripted percentages, one wrong answer ends it.
 *
 * Hosted mode (isHosted === true) keeps that same simulated crowd driving the
 * jackpot narrative unconditionally — the host never answers personally, only
 * paces reveals — while real joined players answer alongside it for bragging
 * rights via `playerActions`.
 */
export function HostView({
  state,
  dispatch,
  players,
  playerActions,
  clearPlayerAction,
  isHosted,
}: HostViewProps<GameState, GameAction>) {
  const { playCorrect, playWrong, playWin, muted, toggleMute } = useGameSounds();

  // Hosted mode: absorb each player's submitted answer into game state.
  useEffect(() => {
    if (!isHosted) return;
    for (const action of playerActions) {
      if (action.type !== 'answer') continue;
      const payload = action.payload as { index?: number } | undefined;
      if (typeof payload?.index !== 'number') continue;
      dispatch({ type: 'PLAYER_ANSWER', userId: action.userId, nickname: action.nickname, index: payload.index });
      clearPlayerAction(action.id);
    }
  }, [isHosted, playerActions, dispatch, clearPlayerAction]);

  // Hosted mode: celebrate when the simulated crowd reaches the jackpot.
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (isHosted && state.phase === 'ended' && prevPhaseRef.current !== 'ended') {
      playWin();
    }
    prevPhaseRef.current = state.phase;
  }, [isHosted, state.phase, playWin]);

  // Hosted mode: auto-reveal when the countdown reaches zero. Safe even if
  // this fires slightly late or twice — REVEAL_TIER is a no-op once the
  // question has already moved past 'playing'. Only the host device ever
  // dispatches for the room, so there's no race with other devices.
  useEffect(() => {
    if (!isHosted || state.phase !== 'playing' || state.timerEndsAt === null) return;
    const delay = Math.max(0, state.timerEndsAt - Date.now());
    const timeout = setTimeout(() => dispatch({ type: 'REVEAL_TIER' }), delay);
    return () => clearTimeout(timeout);
  }, [isHosted, state.phase, state.timerEndsAt, dispatch]);

  function handleStart(jackpotAmount: number) {
    dispatch({ type: 'START_GAME', jackpotAmount });
  }

  function handleRestart() {
    dispatch({ type: 'RESTART' });
  }

  // ---- Solo-only handlers (unused, but harmless, in hosted mode) ----
  function handleSelectOption(index: number) {
    if (state.phase !== 'playing') return;
    dispatch({ type: 'SELECT_OPTION', index });
  }

  function handleConfirm() {
    if (state.phase !== 'playing' || state.selectedOptionIndex === null) return;
    const tier = state.questions[state.currentTierIndex];
    const correct = state.selectedOptionIndex === tier.correctIndex;
    dispatch({ type: 'CONFIRM_ANSWER' });
    if (correct) playCorrect();
    else playWrong();
  }

  function handleAdvance() {
    if (state.phase !== 'reveal') return;
    const willWin = state.lastAnswerCorrect && state.currentTierIndex === state.questions.length - 1;
    dispatch({ type: 'ADVANCE' });
    if (willWin) playWin();
  }

  useKeyboardShortcuts({
    onSelectOption: handleSelectOption,
    onConfirmOrAdvance: () => (state.phase === 'playing' ? handleConfirm() : handleAdvance()),
    onRestart: handleRestart,
    onToggleMute: toggleMute,
  });

  if (state.phase === 'setup') {
    return <SetupScreen defaultJackpot={state.jackpotAmount} onStart={handleStart} />;
  }

  if (!isHosted) {
    if (state.phase === 'won' || state.phase === 'eliminated') {
      return (
        <EndScreen
          phase={state.phase}
          jackpotAmount={state.jackpotAmount}
          eliminatedAtTierIndex={state.eliminatedAtTierIndex}
          totalTiers={state.questions.length}
          onPlayAgain={handleRestart}
        />
      );
    }
    if (state.phase === 'ended') return null; // hosted-only phase; unreachable in solo play

    const tier = state.questions[state.currentTierIndex];
    return (
      <div className="app">
        <StatusBar
          poolRemaining={state.poolRemaining}
          jackpotAmount={state.jackpotAmount}
          currentTierIndex={state.currentTierIndex}
          totalTiers={state.questions.length}
        />
        <QuestionCard percent={tier.percent} prompt={tier.prompt} />
        <OptionsGrid
          options={tier.options}
          selectedIndex={state.selectedOptionIndex}
          correctIndex={state.phase === 'reveal' ? tier.correctIndex : null}
          phase={state.phase}
          onSelect={handleSelectOption}
        />
        {state.phase === 'reveal' && state.lastAnswerCorrect !== null && (
          <FeedbackBanner
            correct={state.lastAnswerCorrect}
            percent={tier.percent}
            correctAnswerText={tier.options[tier.correctIndex]}
            poolRemaining={state.poolRemaining}
          />
        )}
        <ControlsPanel
          phase={state.phase}
          canConfirm={state.selectedOptionIndex !== null}
          muted={muted}
          onConfirm={handleConfirm}
          onAdvance={handleAdvance}
          onRestart={handleRestart}
          onToggleMute={toggleMute}
        />
      </div>
    );
  }

  // ---- Hosted mode ----
  if (state.phase === 'won' || state.phase === 'eliminated') return null; // solo-only; unreachable when hosted

  if (state.phase === 'ended') {
    return (
      <Leaderboard
        jackpotAmount={state.jackpotAmount}
        players={players}
        playerCorrectCounts={state.playerCorrectCounts}
        outOfRunningIds={state.outOfRunningIds}
        onPlayAgain={handleRestart}
      />
    );
  }

  const tier = state.questions[state.currentTierIndex];
  const answeredCount = Object.keys(state.playerAnswers).length;

  return (
    <div className="app">
      <StatusBar
        poolRemaining={state.poolRemaining}
        jackpotAmount={state.jackpotAmount}
        currentTierIndex={state.currentTierIndex}
        totalTiers={state.questions.length}
      />
      <QuestionCard percent={tier.percent} prompt={tier.prompt} />
      <TimerControls
        config={state.timerConfig}
        timerEndsAt={state.timerEndsAt}
        phase={state.phase}
        onConfigChange={(config) => dispatch({ type: 'SET_TIMER_CONFIG', ...config })}
        onStart={() => dispatch({ type: 'START_TIMER' })}
        onClear={() => dispatch({ type: 'CLEAR_TIMER' })}
      />
      {state.phase === 'playing' && <PlayerTally answered={answeredCount} total={players.length} />}
      {state.phase === 'reveal' && state.lastPlayerResults && (
        <ResultsBreakdown
          results={state.lastPlayerResults}
          correctAnswerText={tier.options[tier.correctIndex]}
        />
      )}
      <div className="controls-panel">
        <div className="controls-buttons">
          {state.phase === 'playing' ? (
            <button
              type="button"
              className="controls-button controls-button--primary"
              onClick={() => dispatch({ type: 'REVEAL_TIER' })}
            >
              Reveal Answers
            </button>
          ) : (
            <button
              type="button"
              className="controls-button controls-button--primary"
              onClick={() => dispatch({ type: 'NEXT_TIER' })}
            >
              Next Question
            </button>
          )}
          <button type="button" className="controls-button" onClick={handleRestart}>
            Restart
          </button>
          <button type="button" className="controls-button" onClick={toggleMute}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      </div>
    </div>
  );
}
