import { useEffect, useRef } from 'react';
import { BuzzOrderPanel, recordGameResult, type HostViewProps } from '@games/platform';
import type { GameState, TeamId } from './types';
import { type GameAction, MAX_STRIKES, captainOfTeam } from './state/gameReducer';
import { useGameSounds } from './hooks/useGameSounds';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CategoryHeader } from './components/CategoryHeader';
import { AnswerBoard } from './components/AnswerBoard';
import { AnswerJudgePanel } from './components/AnswerJudgePanel';
import { StrikeDisplay } from './components/StrikeDisplay';
import { Scoreboard } from './components/Scoreboard';
import { ControlsPanel } from './components/ControlsPanel';
import { RoundEndModal } from './components/RoundEndModal';
import { FeudSetupScreen } from './components/FeudSetupScreen';

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
  roomId,
}: HostViewProps<GameState, GameAction>) {
  const { playReveal, playStrike, playAward, playBuzz, muted, toggleMute } = useGameSounds();

  // Every buzz for the *current* question — cleared together whenever the
  // host moves on (reveal/strike/steal/round nav), not on a timer, so
  // everyone who buzzed stays visible (ranked, with timing) until then.
  const buzzes = playerActions.filter((a) => a.type === 'buzz');
  const clearBuzzes = () => buzzes.forEach((b) => clearPlayerAction(b.id));

  // Sound the buzzer when a player buzzes in from their phone.
  const latestBuzz = playerActions[playerActions.length - 1];
  useEffect(() => {
    if (latestBuzz?.type === 'buzz') playBuzz();
  }, [latestBuzz, playBuzz]);

  // Absorb team picks and captain-only team renames coming in from player
  // devices.
  useEffect(() => {
    if (!isHosted) return;
    for (const action of playerActions) {
      if (action.type === 'join-team') {
        const payload = action.payload as { team?: TeamId } | undefined;
        if (payload?.team === 0 || payload?.team === 1) {
          dispatch({ type: 'ASSIGN_TEAM', userId: action.userId, team: payload.team });
        }
        clearPlayerAction(action.id);
      } else if (action.type === 'rename-team') {
        const team = state.teamAssignments[action.userId];
        const isCaptain = team !== undefined && captainOfTeam(team, players, state.teamAssignments) === action.userId;
        const payload = action.payload as { name?: string } | undefined;
        const trimmed = payload?.name?.trim();
        if (isCaptain && team !== undefined && trimmed) {
          dispatch({ type: 'SET_TEAM_NAME', team, name: trimmed.slice(0, 24) });
        }
        clearPlayerAction(action.id);
      }
    }
  }, [isHosted, playerActions, players, state.teamAssignments, dispatch, clearPlayerAction]);

  // Record the finished match to the cross-night family leaderboard once all
  // rounds have been played. Hosted mode only -- solo play has no room to
  // record against.
  const prevRoundOverRef = useRef(state.isRoundOver);
  useEffect(() => {
    if (isHosted && roomId && state.isRoundOver && !prevRoundOverRef.current) {
      const [teamA, teamB] = state.teams;
      const winner = teamA.score === teamB.score ? null : teamA.score > teamB.score ? teamA.name : teamB.name;
      void recordGameResult('family-feud', roomId, {
        teams: state.teams.map((t) => ({ name: t.name, score: t.score })),
        winner,
        players: players.map((p) => ({
          userId: p.userId,
          nickname: p.nickname,
          team: state.teamAssignments[p.userId] ?? null,
        })),
      });
    }
    prevRoundOverRef.current = state.isRoundOver;
  }, [isHosted, roomId, state.isRoundOver, state.teams, state.teamAssignments, players]);

  function handleReveal(index: number) {
    if (state.revealed[index]) return;
    dispatch({ type: 'REVEAL_ANSWER', index });
    playReveal();
    clearBuzzes();
  }

  function handleStrike() {
    if (state.strikes >= MAX_STRIKES || state.awaitingSteal) return;
    dispatch({ type: 'STRIKE' });
    playStrike();
    clearBuzzes();
  }

  function handleResolveSteal(success: boolean) {
    if (!state.awaitingSteal) return;
    dispatch({ type: 'RESOLVE_STEAL', success });
    if (success) playAward();
    else playStrike();
    clearBuzzes();
  }

  function handleAward(team: TeamId) {
    if (state.pot === 0) return;
    dispatch({ type: 'AWARD_POINTS', team });
    playAward();
  }

  function handleResetRound() {
    dispatch({ type: 'RESET_ROUND' });
    clearBuzzes();
  }

  function handleNextRound() {
    dispatch({ type: 'NEXT_ROUND' });
    clearBuzzes();
  }

  function handlePrevRound() {
    dispatch({ type: 'PREV_ROUND' });
    clearBuzzes();
  }

  useKeyboardShortcuts({
    onReveal: handleReveal,
    onStrike: handleStrike,
    onAward: () => handleAward(state.activeTeam),
    onSetActiveTeam: (team) => dispatch({ type: 'SET_ACTIVE_TEAM', team }),
    onResetRound: handleResetRound,
    onNextRound: handleNextRound,
    onPrevRound: handlePrevRound,
    onToggleMute: toggleMute,
  });

  if (!state.gameStarted) {
    return (
      <FeudSetupScreen
        onBeginClassic={() => dispatch({ type: 'BEGIN_GAME' })}
        onBeginGenerated={(rounds) => dispatch({ type: 'SET_ROUNDS', rounds })}
      />
    );
  }

  if (state.isRoundOver) {
    return (
      <RoundEndModal
        teams={state.teams}
        onPlayAgain={() => {
          dispatch({ type: 'RESET_GAME' });
          clearBuzzes();
        }}
      />
    );
  }

  const category = state.rounds[state.currentRoundIndex];

  return (
    <div className="app">
      <BuzzOrderPanel buzzes={buzzes} onClear={clearBuzzes} />
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
        onReassign={(userId, team) => dispatch({ type: 'ASSIGN_TEAM', userId, team })}
      />
      <ControlsPanel
        strikes={state.strikes}
        muted={muted}
        awaitingSteal={state.awaitingSteal}
        onStrike={handleStrike}
        onResolveSteal={handleResolveSteal}
        onResetRound={handleResetRound}
        onNextRound={handleNextRound}
        onPrevRound={handlePrevRound}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
