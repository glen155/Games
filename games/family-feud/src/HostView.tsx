import { useEffect } from 'react';
import type { HostViewProps } from '@games/platform';
import type { GameState, TeamId } from './types';
import { type GameAction, MAX_STRIKES } from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CategoryHeader } from './components/CategoryHeader';
import { AnswerBoard } from './components/AnswerBoard';
import { StrikeDisplay } from './components/StrikeDisplay';
import { Scoreboard } from './components/Scoreboard';
import { ControlsPanel } from './components/ControlsPanel';
import { RoundEndModal } from './components/RoundEndModal';
import { BuzzBanner } from './components/BuzzBanner';

/**
 * The host / big-screen view. Owns sound and keyboard shortcuts, drives the
 * game by dispatching actions (locally in solo mode, or to the whole room when
 * hosted), and surfaces buzzes coming in from player devices.
 */
export function HostView({
  state,
  dispatch,
  playerActions,
  clearPlayerAction,
}: HostViewProps<GameState, GameAction>) {
  const { playReveal, playStrike, playAward, playBuzz, muted, toggleMute } = useGameSounds();

  // Sound the buzzer when a player buzzes in from their phone.
  const latestBuzz = playerActions[playerActions.length - 1];
  useEffect(() => {
    if (latestBuzz?.type === 'buzz') playBuzz();
  }, [latestBuzz, playBuzz]);

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

  useKeyboardShortcuts({
    onReveal: handleReveal,
    onStrike: handleStrike,
    onAward: () => handleAward(state.activeTeam),
    onSetActiveTeam: (team) => dispatch({ type: 'SET_ACTIVE_TEAM', team }),
    onResetRound: () => dispatch({ type: 'RESET_ROUND' }),
    onNextRound: () => dispatch({ type: 'NEXT_ROUND' }),
    onPrevRound: () => dispatch({ type: 'PREV_ROUND' }),
    onToggleMute: toggleMute,
  });

  if (state.isRoundOver) {
    return <RoundEndModal teams={state.teams} onPlayAgain={() => dispatch({ type: 'RESET_GAME' })} />;
  }

  const category = state.rounds[state.currentRoundIndex];

  return (
    <div className="app">
      <BuzzBanner
        buzzes={playerActions.filter((a) => a.type === 'buzz')}
        onClear={clearPlayerAction}
      />
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
        onSetActive={(team) => dispatch({ type: 'SET_ACTIVE_TEAM', team })}
        onAward={handleAward}
        onRename={(team, name) => dispatch({ type: 'SET_TEAM_NAME', team, name })}
      />
      <ControlsPanel
        strikes={state.strikes}
        muted={muted}
        onStrike={handleStrike}
        onResetRound={() => dispatch({ type: 'RESET_ROUND' })}
        onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
        onPrevRound={() => dispatch({ type: 'PREV_ROUND' })}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
