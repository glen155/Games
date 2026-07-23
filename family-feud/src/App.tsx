import { useReducer } from 'react';
import { rounds } from './data/rounds';
import { gameReducer, initialState, MAX_STRIKES } from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { TeamId } from './types';
import { CategoryHeader } from './components/CategoryHeader';
import { AnswerBoard } from './components/AnswerBoard';
import { StrikeDisplay } from './components/StrikeDisplay';
import { Scoreboard } from './components/Scoreboard';
import { ControlsPanel } from './components/ControlsPanel';
import { RoundEndModal } from './components/RoundEndModal';

function App() {
  const [state, dispatch] = useReducer(gameReducer, rounds, initialState);
  const { playReveal, playStrike, playAward, muted, toggleMute } = useGameSounds();

  function handleReveal(index: number) {
    if (state.revealed[index]) return;
    dispatch({ type: 'REVEAL_ANSWER', index });
    playReveal();
  }

  function handleStrike() {
    if (state.strikes >= MAX_STRIKES) return;
    dispatch({ type: 'STRIKE' });
    playStrike();
  }

  function handleAward(team: TeamId) {
    if (state.pot === 0) return;
    dispatch({ type: 'AWARD_POINTS', team });
    playAward();
  }

  function handleSetActiveTeam(team: TeamId) {
    dispatch({ type: 'SET_ACTIVE_TEAM', team });
  }

  function handleRename(team: TeamId, name: string) {
    dispatch({ type: 'SET_TEAM_NAME', team, name });
  }

  function handleResetRound() {
    dispatch({ type: 'RESET_ROUND' });
  }

  function handleNextRound() {
    dispatch({ type: 'NEXT_ROUND' });
  }

  function handlePrevRound() {
    dispatch({ type: 'PREV_ROUND' });
  }

  function handlePlayAgain() {
    dispatch({ type: 'RESET_GAME' });
  }

  useKeyboardShortcuts({
    onReveal: handleReveal,
    onStrike: handleStrike,
    onAward: () => handleAward(state.activeTeam),
    onSetActiveTeam: handleSetActiveTeam,
    onResetRound: handleResetRound,
    onNextRound: handleNextRound,
    onPrevRound: handlePrevRound,
    onToggleMute: toggleMute,
  });

  if (state.isRoundOver) {
    return <RoundEndModal teams={state.teams} onPlayAgain={handlePlayAgain} />;
  }

  const category = state.rounds[state.currentRoundIndex];

  return (
    <div className="app">
      <CategoryHeader
        name={category.name}
        roundNumber={state.currentRoundIndex + 1}
        totalRounds={state.rounds.length}
      />
      <StrikeDisplay strikes={state.strikes} />
      <AnswerBoard category={category} revealed={state.revealed} onReveal={handleReveal} />
      <Scoreboard
        teams={state.teams}
        activeTeam={state.activeTeam}
        pot={state.pot}
        onSetActive={handleSetActiveTeam}
        onAward={handleAward}
        onRename={handleRename}
      />
      <ControlsPanel
        strikes={state.strikes}
        muted={muted}
        onStrike={handleStrike}
        onResetRound={handleResetRound}
        onNextRound={handleNextRound}
        onPrevRound={handlePrevRound}
        onToggleMute={toggleMute}
      />
    </div>
  );
}

export default App;
