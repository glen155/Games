import { useState } from 'react';
import type { PlayerPresence } from '@games/platform';
import type { Team, TeamId } from '../types';

interface SetupScreenProps {
  teams: [Team, Team];
  players: PlayerPresence[];
  teamAssignments: Record<string, TeamId>;
  /** False in solo/pass-and-play — shows the local-add form instead of a
   * "join with the room code" hint. */
  isHosted: boolean;
  onAddLocalPlayer: (nickname: string, team: TeamId) => void;
  onBegin: () => void;
}

/**
 * Pre-game screen. Every action once play starts (spin, guess, buy a vowel,
 * solve) is gated on the acting player actually being on the active team —
 * unlike Family Feud, where the host can always act regardless of team
 * membership. So unlike Feud's setup screen, this one can't just be a "Start
 * Game" button: pass-and-play needs a way to get local players onto a team
 * *before* the game begins, or nobody could ever act. Real joined players
 * pick their own team from their phone (PlayerView's join-team tile, same as
 * Family Feud); this screen just shows where everyone's landed and adds the
 * local-add form for players sharing this screen.
 */
export function SetupScreen({
  teams,
  players,
  teamAssignments,
  isHosted,
  onAddLocalPlayer,
  onBegin,
}: SetupScreenProps) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState<TeamId>(0);

  const rosterFor = (teamId: TeamId) => players.filter((p) => teamAssignments[p.userId] === teamId);
  const unassigned = players.filter((p) => teamAssignments[p.userId] === undefined);
  const roster0 = rosterFor(0);
  const roster1 = rosterFor(1);
  const canBegin = roster0.length > 0 && roster1.length > 0;

  function addLocalPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddLocalPlayer(trimmed, team);
    setName('');
  }

  return (
    <div className="wof-setup">
      <h1 className="wof-setup-title">Wheel of Fortune</h1>
      <p className="wof-setup-rules">
        Two teams take turns spinning, calling letters, and solving the puzzle. Keep guessing right
        and you keep your turn — miss, buy a vowel that isn't there, or land on Bankrupt, and it
        passes to the other team.
      </p>

      <div className="wof-setup-teams">
        <div className="wof-setup-team">
          <h2>{teams[0].name}</h2>
          <ul className="wof-setup-roster">
            {roster0.length === 0 && <li className="wof-setup-empty">No one yet</li>}
            {roster0.map((p) => (
              <li key={p.userId}>{p.nickname}</li>
            ))}
          </ul>
        </div>
        <div className="wof-setup-team">
          <h2>{teams[1].name}</h2>
          <ul className="wof-setup-roster">
            {roster1.length === 0 && <li className="wof-setup-empty">No one yet</li>}
            {roster1.map((p) => (
              <li key={p.userId}>{p.nickname}</li>
            ))}
          </ul>
        </div>
      </div>

      {unassigned.length > 0 && (
        <p className="wof-setup-waiting">
          Waiting to pick a team: {unassigned.map((p) => p.nickname).join(', ')}
        </p>
      )}

      {isHosted ? (
        <p className="wof-setup-hint">Join with the room code, then tap a team on your phone to sign up.</p>
      ) : (
        <form
          className="wof-setup-add"
          onSubmit={(e) => {
            e.preventDefault();
            addLocalPlayer();
          }}
        >
          <input
            className="wof-setup-add-input"
            value={name}
            maxLength={20}
            placeholder="Add a player on this screen"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="wof-setup-add-team">
            <button
              type="button"
              className={`wof-btn wof-setup-team-pick${team === 0 ? ' wof-setup-team-pick--selected' : ''}`}
              onClick={() => setTeam(0)}
            >
              {teams[0].name}
            </button>
            <button
              type="button"
              className={`wof-btn wof-setup-team-pick${team === 1 ? ' wof-setup-team-pick--selected' : ''}`}
              onClick={() => setTeam(1)}
            >
              {teams[1].name}
            </button>
          </div>
          <button type="submit" className="wof-btn">
            Add
          </button>
        </form>
      )}

      <button type="button" className="wof-btn wof-btn--primary wof-setup-start" disabled={!canBegin} onClick={onBegin}>
        {canBegin ? 'Start Game' : 'Need at least one player on each team'}
      </button>
    </div>
  );
}
