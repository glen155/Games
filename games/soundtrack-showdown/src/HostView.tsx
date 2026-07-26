import { useEffect, useRef, useState } from 'react';
import { recordGameResult, type HostViewProps } from '@games/platform';
import type { GameState } from './types';
import { type GameAction, DEFAULT_ROUND_COUNT, pickRandomClues } from './state/gameReducer';
import { clues as cluePool } from './data/clues';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SetupScreen } from './components/SetupScreen';
import { ClueLoader } from './components/ClueLoader';
import { StatusBar } from './components/StatusBar';
import { OptionsGrid } from './components/OptionsGrid';
import { ClueRevealCard } from './components/ClueRevealCard';
import { FeedbackBanner } from './components/FeedbackBanner';
import { ControlsPanel } from './components/ControlsPanel';
import { EndScreen } from './components/EndScreen';
import { TimerControls } from './components/TimerControls';
import { PlayerTally } from './components/PlayerTally';
import { ResultsBreakdown } from './components/ResultsBreakdown';
import { Leaderboard } from './components/Leaderboard';
import { PlayerJudgePanel } from './components/PlayerJudgePanel';

/**
 * The host / big-screen view. Solo mode (isHosted === false): the host alone
 * answers every clue, no elimination — just a final correct-count summary.
 * Hosted mode (isHosted === true): the host never personally answers, only
 * paces reveals; real joined players answer via `playerActions`, ranked by
 * total correct count on a final leaderboard.
 */
export function HostView({
  state,
  dispatch,
  players,
  playerActions,
  clearPlayerAction,
  isHosted,
  roomId,
}: HostViewProps<GameState, GameAction>) {
  const { playCorrect, playWrong, playWin, muted, toggleMute } = useGameSounds();
  const [roundCount, setRoundCount] = useState(Math.min(DEFAULT_ROUND_COUNT, cluePool.length));

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

  // Hosted mode: celebrate the finish and record the cross-night leaderboard.
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (isHosted && state.phase === 'ended' && prevPhaseRef.current !== 'ended') {
      playWin();
      if (roomId) {
        void recordGameResult('soundtrack-showdown', roomId, {
          totalClues: state.clues.length,
          players: players.map((p) => ({
            userId: p.userId,
            nickname: p.nickname,
            correctCount: state.playerCorrectCounts[p.userId] ?? 0,
          })),
        });
      }
    }
    prevPhaseRef.current = state.phase;
  }, [isHosted, roomId, state.phase, state.clues.length, state.playerCorrectCounts, players, playWin]);

  // Hosted mode: auto-reveal when the countdown reaches zero. Safe even if
  // this fires slightly late or twice — REVEAL_CLUE is a no-op once the clue
  // has already moved past 'answering'. Only the host device ever dispatches
  // for the room, so there's no race with other devices.
  useEffect(() => {
    if (!isHosted || state.phase !== 'answering' || state.timerEndsAt === null) return;
    const delay = Math.max(0, state.timerEndsAt - Date.now());
    const timeout = setTimeout(() => dispatch({ type: 'REVEAL_CLUE' }), delay);
    return () => clearTimeout(timeout);
  }, [isHosted, state.phase, state.timerEndsAt, dispatch]);

  function handleRestart() {
    dispatch({ type: 'RESTART' });
  }

  // ---- Solo-only handlers (unused, but harmless, in hosted mode) ----
  function handleSelectOption(index: number) {
    if (state.phase !== 'answering') return;
    dispatch({ type: 'SELECT_OPTION', index });
  }

  function handleConfirm() {
    if (state.phase !== 'answering' || state.selectedOptionIndex === null) return;
    const clue = state.clues[state.currentClueIndex];
    const correct = state.selectedOptionIndex === clue.correctIndex;
    dispatch({ type: 'CONFIRM_ANSWER' });
    if (correct) playCorrect();
    else playWrong();
  }

  function handleAdvance() {
    if (state.phase !== 'reveal') return;
    const willFinish = state.currentClueIndex === state.clues.length - 1;
    dispatch({ type: 'ADVANCE' });
    if (willFinish) playWin();
  }

  useKeyboardShortcuts({
    onSelectOption: handleSelectOption,
    onConfirmOrAdvance: () => (state.phase === 'answering' ? handleConfirm() : handleAdvance()),
    onRestart: handleRestart,
    onToggleMute: toggleMute,
  });

  if (state.phase === 'setup') {
    return (
      <SetupScreen
        poolSize={cluePool.length}
        roundCount={roundCount}
        onRoundCountChange={(count) => {
          setRoundCount(count);
          dispatch({ type: 'SET_CLUES', clues: pickRandomClues(cluePool, count) });
        }}
        isHosted={isHosted}
        answerStyle={state.answerStyle}
        onAnswerStyleChange={(style) => dispatch({ type: 'SET_ANSWER_STYLE', answerStyle: style })}
        onStart={() => dispatch({ type: 'START_GAME' })}
      />
    );
  }

  if (state.phase === 'loading_clue') {
    return (
      <div className="app">
        <ClueLoader state={state} roomId={roomId} onConfirm={() => dispatch({ type: 'HOST_CONFIRMED_PLAYING' })} />
      </div>
    );
  }

  if (!isHosted) {
    if (state.phase === 'summary') {
      return (
        <EndScreen correctCount={state.soloCorrectCount} totalClues={state.clues.length} onPlayAgain={handleRestart} />
      );
    }
    if (state.phase === 'ended') return null; // hosted-only phase; unreachable in solo play

    const clue = state.clues[state.currentClueIndex];
    return (
      <div className="app">
        <StatusBar
          currentClueIndex={state.currentClueIndex}
          totalClues={state.clues.length}
          correctCount={state.soloCorrectCount}
        />
        {state.phase === 'reveal' && <ClueRevealCard clue={clue} roomId={roomId} />}
        <OptionsGrid
          options={clue.options}
          selectedIndex={state.selectedOptionIndex}
          correctIndex={state.phase === 'reveal' ? clue.correctIndex : null}
          phase={state.phase === 'reveal' ? 'reveal' : 'answering'}
          onSelect={handleSelectOption}
        />
        {state.phase === 'reveal' && state.lastAnswerCorrect !== null && (
          <FeedbackBanner correct={state.lastAnswerCorrect} correctAnswerText={clue.options[clue.correctIndex]} />
        )}
        <ControlsPanel
          phase={state.phase === 'reveal' ? 'reveal' : 'answering'}
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
  if (state.phase === 'summary') return null; // solo-only; unreachable when hosted

  if (state.phase === 'ended') {
    return (
      <Leaderboard
        players={players}
        playerCorrectCounts={state.playerCorrectCounts}
        totalClues={state.clues.length}
        onPlayAgain={handleRestart}
      />
    );
  }

  const clue = state.clues[state.currentClueIndex];
  const answeredCount = Object.keys(state.playerAnswers).length;

  return (
    <div className="app">
      <StatusBar currentClueIndex={state.currentClueIndex} totalClues={state.clues.length} />
      <TimerControls
        config={state.timerConfig}
        timerEndsAt={state.timerEndsAt}
        phase={state.phase === 'reveal' ? 'reveal' : 'answering'}
        onConfigChange={(config) => dispatch({ type: 'SET_TIMER_CONFIG', ...config })}
        onStart={() => dispatch({ type: 'START_TIMER' })}
        onClear={() => dispatch({ type: 'CLEAR_TIMER' })}
      />
      {state.phase === 'answering' &&
        (state.answerStyle === 'open_guess' ? (
          <p className="player-tally">Guess it out loud — reveal when everyone's ready.</p>
        ) : (
          <PlayerTally answered={answeredCount} total={players.length} />
        ))}
      {state.phase === 'reveal' && (
        <>
          <ClueRevealCard clue={clue} roomId={roomId} />
          {state.answerStyle === 'open_guess' ? (
            <PlayerJudgePanel
              players={players}
              verdicts={state.lastPlayerResults ?? {}}
              onMark={(userId, nickname, correct) => dispatch({ type: 'HOST_MARK_PLAYER', userId, nickname, correct })}
            />
          ) : (
            state.lastPlayerResults && (
              <ResultsBreakdown results={state.lastPlayerResults} correctAnswerText={clue.options[clue.correctIndex]} />
            )
          )}
        </>
      )}
      <div className="controls-panel">
        <div className="controls-buttons">
          {state.phase === 'answering' ? (
            <button
              type="button"
              className="controls-button controls-button--primary"
              onClick={() => dispatch({ type: 'REVEAL_CLUE' })}
            >
              {state.answerStyle === 'open_guess' ? 'Reveal & Judge' : 'Reveal Answers'}
            </button>
          ) : (
            <button
              type="button"
              className="controls-button controls-button--primary"
              onClick={() => dispatch({ type: 'NEXT_CLUE' })}
            >
              Next Clue
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
