import { useReducer } from 'react';
import { questions } from './data/questions';
import { gameReducer, initialState } from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SetupScreen } from './components/SetupScreen';
import { StatusBar } from './components/StatusBar';
import { QuestionCard } from './components/QuestionCard';
import { OptionsGrid } from './components/OptionsGrid';
import { FeedbackBanner } from './components/FeedbackBanner';
import { ControlsPanel } from './components/ControlsPanel';
import { EndScreen } from './components/EndScreen';

function App() {
  const [state, dispatch] = useReducer(gameReducer, questions, initialState);
  const { playCorrect, playWrong, playWin, muted, toggleMute } = useGameSounds();

  function handleStart(jackpotAmount: number) {
    dispatch({ type: 'START_GAME', jackpotAmount });
  }

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

  function handleRestart() {
    dispatch({ type: 'RESTART' });
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

export default App;
