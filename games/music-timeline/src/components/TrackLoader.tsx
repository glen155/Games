import { QRCode, ReportIssueButton } from '@games/platform';
import type { GameState } from '../types';

interface TrackLoaderProps {
  state: GameState;
  roomId: string | null;
  onConfirm: () => void;
}

/**
 * The `loading_track` screen. Deliberately never reads `round.trueYear` or the
 * track's title/artist — this is what keeps the year hidden from the host,
 * not just the players.
 */
export function TrackLoader({ state, roomId, onConfirm }: TrackLoaderProps) {
  const round = state.round!;
  const track = state.trackPool.find((t) => t.id === round.trackId)!;
  const roundNumber = state.roundHistory.length + 1;

  return (
    <div className="mt-track-loader">
      <p className="mt-round-label">Round {roundNumber}</p>
      <h2 className="mt-track-loader-title">Scan to start the next song</h2>
      <p className="mt-track-loader-hint">
        Point your playback device's camera at this code (or open the link on it) to start
        the track in Spotify. Keep that device's screen out of everyone's sight — including
        yours — so nobody sees the title, artist, or era before reveal.
      </p>
      <QRCode value={track.spotifyUrl} />
      <button type="button" className="mt-btn mt-btn--primary" onClick={onConfirm}>
        Started Playing ▶
      </button>
      <ReportIssueButton
        gameSlug="music-timeline"
        itemId={track.id}
        itemLabel={null}
        roomId={roomId}
        reasons={["This song won't play", 'Broken Spotify link']}
      />
    </div>
  );
}
