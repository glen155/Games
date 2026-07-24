import { useEffect } from 'react';
import type { HostViewProps } from '@games/platform';
import type { GameState, TeamId } from './types';
import { type GameAction, MAX_STRIKES } from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CategoryHeader } from './components/CategoryHeader';
import { AnswerBoard } from './components/AnswerBoard';
import { AnswerJudgePanel } from './components/AnswerJudgePanel';
import { StrikeDisplay } from './components/StrikeDisplay';
import { Scoreboard } from './components/Scoreboard';
import { ControlsPanel } from './components/ControlsPanel';
import { RoundEndModal } from './components/RoundEndModal';
import { BuzzBanner } from './components/BuzzBanner';

/**
 * The host / big-screen view. Owns sound and keyboard shortcuts, drives the
 * game by dispatching actions (locally in solo mode, or to the whole room when
 * hosted), and surfaces buzzes/team picks coming in from player devices.
 *
 * In solo mode the answer board is blind (flip-to-reveal) since the same
 * screen is shared with the group. In hosted mode the host's device is
 * private, so it shows every answer up front via AnswerJudgePanel — players'
 * own phones (PlayerView) already stay spoiler-free, so that's the "public
 * board" for anyone watching, no separate display required.
 */
export function HostView({
  state,
  dispatch,
  players,
  playerActions,
  clearPlayerAction,
  isHosted,
}: HostViewProps<GameState, GameAction>) {
  const { playReveal, playStrike, playAward, playBuzz, muted, toggleMute } = useGameSounds();

  // Sound the buzzer when a player buzzes in from their phone.
  const latestBuzz = playerActions[playerActions.length - 1];
  useEffect(() => {
    if (latestBuzz?.type === 'buzz') playBuzz();
  }, [latestBuzz, playBuzz]);

  // Absorb team picks coming in from player devices.
  useEffect(() => {
    if (!isHosted) return;
    for (const action of playerActions) {
      if (action.type !== 'join-team') continue;
      const payload = action.payload as { team?: TeamId } | undefined;
      if (payload?.team !== 0 && payload?.team !== 1) continue;
      dispatch({ type: 'ASSIGN_TEAM', userId: action.userId, team: payload.team });
      clearPlayerAction(action.id);
    }
  }, [isHosted, playerActions, dispatch, clearPlayerAction]);

  function handleReveal(index: number) {
    if (state.revealed[index]) return;
    dispatch({ type: 'REVEAL_ANSWER', index });
    playReveal();
  }

  function handleStrike() {
    if (state.strikes >= MAX_STRIKES || state.awaitingSteal) return;
    dispatch({ type: 'STRIKE' });
    playStrike();
  }

  function handleResolveSteal(success: boolean) {
    if (!state.awaitingSteal) return;
    dispatch({ type: 'RESOLVE_STEAL', success });
    if (success) playAward();
    else playStrike();
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
      {isHosted ? (
        <AnswerJudgePanel category={category} revealed={state.revealed} onReveal={handleReveal} />
      ) : (
        <AnswerBoard category={category} revealed={state.revealed} onReveal={handleReveal} />
      )}
      <Scoreboard
        teams={state.teams}
        activeTeam={state.activeTeam}
        pot={state.pot}
        players={players}
        teamAssignments={state.teamAssignments}
        onSetActive={(team) => dispatch({ type: 'SET_ACTIVE_TEAM', team })}
        onAward={handleAward}
        onRename={(team, name) => dispatch({ type: 'SET_TEAM_NAME', team, name })}
      />
      <ControlsPanel
        strikes={state.strikes}
        muted={muted}
        awaitingSteal={state.awaitingSteal}
        onStrike={handleStrike}
        onResolveSteal={handleResolveSteal}
        onResetRound={() => dispatch({ type: 'RESET_ROUND' })}
        onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
        onPrevRound={() => dispatch({ type: 'PREV_ROUND' })}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
