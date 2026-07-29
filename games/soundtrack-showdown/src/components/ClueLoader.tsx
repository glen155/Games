import { QRCode, ReportIssueButton } from '@games/platform';
import type { GameState } from '../types';

interface ClueLoaderProps {
  state: GameState;
  roomId: string | null;
  onConfirm: () => void;
}

/**
 * The `loading_clue` screen — shown to both solo and hosted play. Deliberately
 * never reads `cueTitle`, `performedBy`, `correctTitle`, or `sourceNote` — this
 * is what keeps the answer hidden from the host, not just the players. Only
 * `spotifyUrl` is ever touched here.
 */
export function ClueLoader({ state, roomId, onConfirm }: ClueLoaderProps) {
  const clue = state.clues[state.currentClueIndex];

  return (
    <div className="clue-loader">
      <p className="clue-round-label">
        Clue {state.currentClueIndex + 1} of {state.clues.length}
      </p>
      <h2 className="clue-loader-title">Scan to start the next theme</h2>
      <p className="clue-loader-hint">
        Point your playback device's camera at this code (or open the link on it) to start the
        track in Spotify. Keep that device's screen out of everyone's sight — including yours —
        so nobody sees the title or artist before reveal.
      </p>
      <QRCode value={clue.spotifyUrl} />
      <button type="button" className="controls-button controls-button--primary" onClick={onConfirm}>
        Started Playing ▶
      </button>
      <ReportIssueButton
        gameSlug="soundtrack-showdown"
        itemId={clue.id}
        itemLabel={null}
        roomId={roomId}
        reasons={["This clue won't play", 'Broken Spotify link']}
      />
    </div>
  );
}
