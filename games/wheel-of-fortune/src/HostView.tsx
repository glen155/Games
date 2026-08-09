import { useEffect, useRef, useState } from 'react';
import { recordGameResult, type HostViewProps, type PlayerPresence } from '@games/platform';
import type { GameState, TeamId } from './types';
import { ROUND_COUNT, captainOfTeam, currentPuzzle, type WheelAction } from './state/gameReducer';
import { VOWEL_COST } from './data/wheel';
import { useGameSounds } from './hooks/useGameSounds';
import { SetupScreen } from './components/SetupScreen';
import { Scoreboard } from './components/Scoreboard';
import { PuzzleBoard } from './components/PuzzleBoard';
import { WheelDisplay } from './components/WheelDisplay';
import { LetterGrid } from './components/LetterGrid';
import { SolveForm } from './components/SolveForm';
import { RoundEndModal } from './components/RoundEndModal';
import { GameOverScreen } from './components/GameOverScreen';

/**
 * The host / big-screen view. Owns sound and drives the game by dispatching
 * actions — locally in solo/pass-and-play mode, or absorbed from
 * `playerActions` when driving a live room. Team turn state (whose turn it
 * is, whether a letter guess was right or wrong) is entirely derived from
 * state transitions, so sound cues watch state changes rather than being
 * fired inline from each handler.
 */
export function HostView({
  state,
  dispatch,
  players,
  playerActions,
  clearPlayerAction,
  isHosted,
  roomId,
}: HostViewProps<GameState, WheelAction>) {
  const { playSpinTick, playCorrectLetter, playWrongLetter, playBankrupt, playSolveWin, muted, toggleMute } =
    useGameSounds();

  // Pass-and-play players sharing this screen — only relevant in solo mode,
  // where the platform's live `players` prop is always empty. Kept as local
  // component state rather than game state, matching how GameState avoids
  // duplicating the roster the platform already tracks.
  const [localPlayers, setLocalPlayers] = useState<PlayerPresence[]>([]);
  const effectivePlayers = isHosted ? players : localPlayers;

  // Absorb remote players' spin/guess/vowel/solve/team actions — mirrors
  // every other game's HostView watching playerActions.
  useEffect(() => {
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
      } else if (action.type === 'spin') {
        dispatch({ type: 'SPIN', userId: action.userId });
        clearPlayerAction(action.id);
      } else if (action.type === 'guess-letter') {
        const payload = action.payload as { letter?: string } | undefined;
        if (payload?.letter) dispatch({ type: 'GUESS_LETTER', userId: action.userId, letter: payload.letter });
        clearPlayerAction(action.id);
      } else if (action.type === 'buy-vowel') {
        const payload = action.payload as { letter?: string } | undefined;
        if (payload?.letter) dispatch({ type: 'BUY_VOWEL', userId: action.userId, letter: payload.letter });
        clearPlayerAction(action.id);
      } else if (action.type === 'solve') {
        const payload = action.payload as { guess?: string } | undefined;
        if (payload?.guess) dispatch({ type: 'SOLVE', userId: action.userId, guess: payload.guess });
        clearPlayerAction(action.id);
      }
    }
  }, [playerActions, players, state.teamAssignments, dispatch, clearPlayerAction]);

  // Spin tick + Bankrupt sting whenever a new spin resolves.
  const prevSpinSeq = useRef(state.spinSeq);
  useEffect(() => {
    if (state.spinSeq !== prevSpinSeq.current) {
      prevSpinSeq.current = state.spinSeq;
      playSpinTick();
      if (state.lastSpin?.type === 'bankrupt') playBankrupt();
    }
  }, [state.spinSeq, state.lastSpin, playSpinTick, playBankrupt]);

  // Correct/wrong letter cue: guessedLetters only grows on GUESS_LETTER and
  // BUY_VOWEL, and the turn passes (activeTeam flips) only on a miss — so
  // comparing activeTeam before/after tells us which sound to play.
  const prevGuessedLen = useRef(state.guessedLetters.length);
  const prevActiveTeam = useRef(state.activeTeam);
  useEffect(() => {
    if (state.guessedLetters.length !== prevGuessedLen.current) {
      if (state.activeTeam === prevActiveTeam.current) playCorrectLetter();
      else playWrongLetter();
    }
    prevGuessedLen.current = state.guessedLetters.length;
    prevActiveTeam.current = state.activeTeam;
  }, [state.guessedLetters.length, state.activeTeam, playCorrectLetter, playWrongLetter]);

  // Solve fanfare the moment a round is won.
  const prevPhase = useRef(state.phase);
  useEffect(() => {
    if (state.phase === 'puzzle-solved' && prevPhase.current !== 'puzzle-solved') playSolveWin();
    prevPhase.current = state.phase;
  }, [state.phase, playSolveWin]);

  // Record the finished match to the cross-night family leaderboard. Hosted
  // mode only — solo play has no room to record against.
  const prevGameOverRef = useRef(state.phase === 'game-over');
  useEffect(() => {
    const isOver = state.phase === 'game-over';
    if (isHosted && roomId && isOver && !prevGameOverRef.current) {
      const [teamA, teamB] = state.teams;
      const winner = teamA.score === teamB.score ? null : teamA.score > teamB.score ? teamA.name : teamB.name;
      void recordGameResult('wheel-of-fortune', roomId, {
        teams: state.teams.map((t) => ({ name: t.name, score: t.score })),
        winner,
        players: players.map((p) => ({
          userId: p.userId,
          nickname: p.nickname,
          team: state.teamAssignments[p.userId] ?? null,
        })),
      });
    }
    prevGameOverRef.current = isOver;
  }, [isHosted, roomId, state.phase, state.teams, state.teamAssignments, players]);

  function handleAddLocalPlayer(nickname: string, team: TeamId) {
    const userId = `local-${crypto.randomUUID()}`;
    setLocalPlayers((prev) => [...prev, { userId, nickname, joinedAt: Date.now() }]);
    dispatch({ type: 'ASSIGN_TEAM', userId, team });
  }

  if (state.phase === 'setup') {
    return (
      <SetupScreen
        teams={state.teams}
        players={effectivePlayers}
        teamAssignments={state.teamAssignments}
        isHosted={isHosted}
        onAddLocalPlayer={handleAddLocalPlayer}
        onBegin={() => dispatch({ type: 'BEGIN_GAME' })}
      />
    );
  }

  if (state.phase === 'game-over') {
    return <GameOverScreen state={state} onPlayAgain={() => dispatch({ type: 'RESET_GAME' })} />;
  }

  if (state.phase === 'puzzle-solved') {
    return <RoundEndModal state={state} onNextRound={() => dispatch({ type: 'NEXT_ROUND' })} />;
  }

  // 'playing'
  const puzzle = currentPuzzle(state);
  const localActiveUserId = !isHosted
    ? localPlayers.find((p) => state.teamAssignments[p.userId] === state.activeTeam)?.userId
    : undefined;

  return (
    <div className="wof-app">
      <button type="button" className="wof-mute" onClick={toggleMute}>
        {muted ? '🔇' : '🔊'}
      </button>
      <p className="wof-round-label">
        Round {state.roundNumber} of {ROUND_COUNT}
      </p>
      <Scoreboard
        teams={state.teams}
        activeTeam={state.activeTeam}
        roundPot={state.roundPot}
        players={effectivePlayers}
        teamAssignments={state.teamAssignments}
        onRename={(team, name) => dispatch({ type: 'SET_TEAM_NAME', team, name })}
        onReassign={(userId, team) => dispatch({ type: 'ASSIGN_TEAM', userId, team })}
      />
      <WheelDisplay lastSpin={state.lastSpin} spinSeq={state.spinSeq} />
      <PuzzleBoard category={puzzle.category} solution={puzzle.solution} guessedLetters={state.guessedLetters} />

      {!isHosted && (
        <div className="wof-local-controls">
          {localActiveUserId ? (
            state.spinResult === null ? (
              <>
                <button
                  type="button"
                  className="wof-btn wof-btn--primary wof-player-spin"
                  onClick={() => dispatch({ type: 'SPIN', userId: localActiveUserId })}
                >
                  SPIN
                </button>
                <LetterGrid
                  guessedLetters={state.guessedLetters}
                  canGuessConsonant={false}
                  canBuyVowel={state.roundPot >= VOWEL_COST}
                  onGuessConsonant={() => {}}
                  onBuyVowel={(letter) => dispatch({ type: 'BUY_VOWEL', userId: localActiveUserId, letter })}
                />
                <SolveForm
                  disabled={false}
                  onSolve={(guess) => dispatch({ type: 'SOLVE', userId: localActiveUserId, guess })}
                />
              </>
            ) : (
              <LetterGrid
                guessedLetters={state.guessedLetters}
                canGuessConsonant
                canBuyVowel={false}
                onGuessConsonant={(letter) => dispatch({ type: 'GUESS_LETTER', userId: localActiveUserId, letter })}
                onBuyVowel={() => {}}
              />
            )
          ) : (
            <p className="wof-local-controls-empty">No players assigned to the active team.</p>
          )}
        </div>
      )}
    </div>
  );
}
