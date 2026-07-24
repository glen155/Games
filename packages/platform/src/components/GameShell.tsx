import { useMemo, useState } from 'react';
import type { GameDefinition } from '../types';
import { isMultiplayerConfigured } from '../supabase';
import { normalizeRoomCode } from '../roomCode';
import { useHostRoom, usePlayerRoom } from '../useRoom';
import { useLocalGame } from '../useLocalGame';
import { RoomCode } from './RoomCode';
import { PlayerList } from './PlayerList';

type Mode = 'landing' | 'host' | 'solo' | 'join-form' | 'player';

interface GameShellProps<State, Action> {
  game: GameDefinition<State, Action>;
}

function readJoinParam(): string | null {
  const code = new URLSearchParams(window.location.search).get('join');
  return code ? normalizeRoomCode(code) : null;
}

/**
 * The single entry point a game mounts. Handles the whole "how do I want to
 * play" flow — host from this device, join another device's room, or play
 * solo on one screen — then hands off to the game's own Host / Player views.
 */
export function GameShell<State, Action>({ game }: GameShellProps<State, Action>) {
  const joinParam = useMemo(readJoinParam, []);
  const [mode, setMode] = useState<Mode>(() => {
    if (!isMultiplayerConfigured) return 'solo';
    if (joinParam) return 'join-form';
    return 'landing';
  });
  const [joinInfo, setJoinInfo] = useState<{ code: string; nickname: string } | null>(null);

  if (mode === 'solo') return <SoloContainer game={game} />;
  if (mode === 'host') return <HostContainer game={game} onExit={() => setMode('landing')} />;
  if (mode === 'join-form') {
    return (
      <JoinForm
        game={game}
        initialCode={joinParam ?? ''}
        onCancel={() => setMode('landing')}
        onJoin={(code, nickname) => {
          setJoinInfo({ code, nickname });
          setMode('player');
        }}
      />
    );
  }
  if (mode === 'player' && joinInfo) {
    return (
      <PlayerContainer
        game={game}
        code={joinInfo.code}
        nickname={joinInfo.nickname}
        onExit={() => setMode('landing')}
      />
    );
  }
  return <Landing game={game} onPick={setMode} />;
}

function Landing<State, Action>({
  game,
  onPick,
}: {
  game: GameDefinition<State, Action>;
  onPick: (mode: Mode) => void;
}) {
  return (
    <div className="shell-landing">
      <h1 className="shell-landing-title">{game.displayName}</h1>
      {game.tagline && <p className="shell-landing-tagline">{game.tagline}</p>}
      <div className="shell-landing-actions">
        <button type="button" className="shell-btn shell-btn--primary" onClick={() => onPick('host')}>
          <span className="shell-btn-title">Host a game</span>
          <span className="shell-btn-sub">Big screen — others join from their phones</span>
        </button>
        <button type="button" className="shell-btn" onClick={() => onPick('join-form')}>
          <span className="shell-btn-title">Join a game</span>
          <span className="shell-btn-sub">Enter a room code from another device</span>
        </button>
        <button type="button" className="shell-btn" onClick={() => onPick('solo')}>
          <span className="shell-btn-title">Play on this device</span>
          <span className="shell-btn-sub">One screen, pass it around — no internet needed</span>
        </button>
      </div>
    </div>
  );
}

function SoloContainer<State, Action>({ game }: { game: GameDefinition<State, Action> }) {
  const hostProps = useLocalGame(game);
  const { HostView } = game;
  return <HostView {...hostProps} />;
}

function HostContainer<State, Action>({
  game,
  onExit,
}: {
  game: GameDefinition<State, Action>;
  onExit: () => void;
}) {
  const room = useHostRoom(game);
  const { HostView } = game;

  if (room.phase === 'connecting') {
    return <StatusScreen title="Starting your room…" />;
  }
  if (room.phase === 'error') {
    return (
      <StatusScreen title="Couldn't start the room" detail={room.error} onBack={onExit} />
    );
  }

  return (
    <div className="shell-host">
      {room.code && (
        <div className="shell-host-bar">
          <RoomCode code={room.code} />
          <PlayerList players={room.players} />
        </div>
      )}
      <HostView
        state={room.state}
        dispatch={room.dispatch}
        players={room.players}
        playerActions={room.playerActions}
        clearPlayerAction={room.clearPlayerAction}
        isHosted
      />
    </div>
  );
}

function PlayerContainer<State, Action>({
  game,
  code,
  nickname,
  onExit,
}: {
  game: GameDefinition<State, Action>;
  code: string;
  nickname: string;
  onExit: () => void;
}) {
  const room = usePlayerRoom(game, code, nickname);
  const { PlayerView } = game;

  if (room.phase === 'connecting') {
    return <StatusScreen title="Joining the room…" />;
  }
  if (room.phase === 'not-found') {
    return (
      <StatusScreen
        title="No game with that code"
        detail="Double-check the room code with the host and try again."
        onBack={onExit}
      />
    );
  }
  if (room.phase === 'error') {
    return <StatusScreen title="Couldn't join" detail={room.error} onBack={onExit} />;
  }

  return (
    <div className="shell-player">
      <div className="shell-player-bar">
        <span className="shell-player-you">You: {nickname}</span>
        <span className="shell-player-count">{room.players.length} in room</span>
      </div>
      <PlayerView
        state={room.state}
        nickname={nickname}
        userId={room.userId}
        players={room.players}
        sendAction={room.sendAction}
      />
    </div>
  );
}

function JoinForm<State, Action>({
  game,
  initialCode,
  onJoin,
  onCancel,
}: {
  game: GameDefinition<State, Action>;
  initialCode: string;
  onJoin: (code: string, nickname: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const normalized = normalizeRoomCode(code);
  const canJoin = normalized.length === 6 && nickname.trim().length > 0;

  return (
    <div className="shell-join">
      <h1 className="shell-join-title">Join {game.displayName}</h1>
      <form
        className="shell-join-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canJoin) onJoin(normalized, nickname.trim());
        }}
      >
        <label className="shell-field">
          <span>Your name</span>
          <input
            className="shell-input"
            value={nickname}
            maxLength={20}
            autoFocus={Boolean(initialCode)}
            placeholder="e.g. Sam"
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        <label className="shell-field">
          <span>Room code</span>
          <input
            className="shell-input shell-input--code"
            value={code}
            maxLength={6}
            autoCapitalize="characters"
            autoFocus={!initialCode}
            placeholder="ABC123"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </label>
        <div className="shell-join-buttons">
          <button type="button" className="shell-btn shell-btn--ghost" onClick={onCancel}>
            Back
          </button>
          <button type="submit" className="shell-btn shell-btn--primary" disabled={!canJoin}>
            Join game
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusScreen({
  title,
  detail,
  onBack,
}: {
  title: string;
  detail?: string | null;
  onBack?: () => void;
}) {
  return (
    <div className="shell-status">
      <h1 className="shell-status-title">{title}</h1>
      {detail && <p className="shell-status-detail">{detail}</p>}
      {onBack && (
        <button type="button" className="shell-btn shell-btn--ghost" onClick={onBack}>
          Back
        </button>
      )}
    </div>
  );
}
