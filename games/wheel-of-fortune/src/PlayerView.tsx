import { useState } from 'react';
import type { PlayerViewProps } from '@games/platform';
import type { GameState, TeamId } from './types';
import { captainOfTeam, currentPuzzle } from './state/gameReducer';
import { VOWEL_COST } from './data/wheel';
import { PuzzleBoard } from './components/PuzzleBoard';
import { LetterGrid } from './components/LetterGrid';
import { SolveForm } from './components/SolveForm';

/**
 * The player / phone view. Pick a team (+ captain-only rename, same pattern
 * as Family Feud), then once your team is active: spin, call a letter, buy a
 * vowel, or go for the solve — straight from your own device. Everyone else
 * on your team sees the same options at the same time; whoever taps first
 * wins the race, same as every other player-originated action in this app.
 */
export function PlayerView({ state, userId, players, sendAction }: PlayerViewProps<GameState>) {
  const [renamingTeam, setRenamingTeam] = useState<TeamId | null>(null);
  const [draftName, setDraftName] = useState('');

  if (!state) {
    return (
      <div className="player-view wof-player-view--waiting">
        <p>Waiting for the host to start…</p>
      </div>
    );
  }

  if (state.phase === 'game-over') {
    const [a, b] = state.teams;
    const winner = a.score === b.score ? null : a.score > b.score ? a : b;
    return (
      <div className="player-view wof-player-view--waiting">
        <h2>Game over!</h2>
        <p>{winner ? `${winner.name} wins!` : "It's a tie!"}</p>
      </div>
    );
  }

  const myTeam = state.teamAssignments[userId];
  const isCaptain = myTeam !== undefined && captainOfTeam(myTeam, players, state.teamAssignments) === userId;

  function handleJoinTeam(team: TeamId) {
    sendAction('join-team', { team });
  }

  function startRename(team: TeamId, currentName: string) {
    setDraftName(currentName);
    setRenamingTeam(team);
  }

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed) sendAction('rename-team', { name: trimmed });
    setRenamingTeam(null);
  }

  const teamPicker = (
    <div className="wof-player-teams">
      {state.teams.map((team, index) => {
        const teamId = index as TeamId;
        const mine = myTeam === teamId;
        return (
          <div
            key={team.name}
            className={`wof-player-team${mine ? ' wof-player-team--mine' : ''}`}
            onClick={() => handleJoinTeam(teamId)}
          >
            <span className="wof-player-team-name">{team.name}</span>
            <span className="wof-player-team-score">${team.score}</span>
            <span className="wof-player-team-hint">{mine ? 'Your team' : 'Tap to join'}</span>
            {mine && isCaptain && (
              <div className="wof-player-captain" onClick={(e) => e.stopPropagation()}>
                <span className="wof-player-captain-badge">★ You're the captain</span>
                {renamingTeam === teamId ? (
                  <form
                    className="wof-player-rename-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitRename();
                    }}
                  >
                    <input
                      className="wof-player-rename-input"
                      value={draftName}
                      autoFocus
                      maxLength={24}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={commitRename}
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    className="wof-player-rename-button"
                    onClick={() => startRename(teamId, team.name)}
                  >
                    Rename team
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (state.phase === 'setup') {
    return (
      <div className="player-view wof-player-view">
        <h1>Wheel of Fortune</h1>
        <p>Pick a team to get started.</p>
        {teamPicker}
      </div>
    );
  }

  if (state.phase === 'puzzle-solved') {
    const winner = state.lastRoundWinner !== null ? state.teams[state.lastRoundWinner] : null;
    return (
      <div className="player-view wof-player-view--waiting">
        <h2>{winner ? `${winner.name} solved it!` : 'Round over'}</h2>
        {state.solvedSolution && <p className="wof-player-solution">{state.solvedSolution}</p>}
      </div>
    );
  }

  const puzzle = currentPuzzle(state);
  const isMyTurn = myTeam !== undefined && myTeam === state.activeTeam;

  return (
    <div className="player-view wof-player-view">
      {teamPicker}

      {isMyTurn ? (
        state.spinResult === null ? (
          <div className="wof-player-actions">
            <button type="button" className="wof-btn wof-btn--primary wof-player-spin" onClick={() => sendAction('spin')}>
              SPIN
            </button>
            <LetterGrid
              guessedLetters={state.guessedLetters}
              canGuessConsonant={false}
              canBuyVowel={state.roundPot >= VOWEL_COST}
              onGuessConsonant={() => {}}
              onBuyVowel={(letter) => sendAction('buy-vowel', { letter })}
            />
            <SolveForm disabled={false} onSolve={(guess) => sendAction('solve', { guess })} />
          </div>
        ) : (
          <div className="wof-player-actions">
            <p className="wof-player-prompt">Call a letter!</p>
            <LetterGrid
              guessedLetters={state.guessedLetters}
              canGuessConsonant
              canBuyVowel={false}
              onGuessConsonant={(letter) => sendAction('guess-letter', { letter })}
              onBuyVowel={() => {}}
            />
          </div>
        )
      ) : (
        <p className="wof-player-waiting">
          Waiting for {state.teams[state.activeTeam].name} to play…
        </p>
      )}

      <PuzzleBoard category={puzzle.category} solution={puzzle.solution} guessedLetters={state.guessedLetters} />
    </div>
  );
}
