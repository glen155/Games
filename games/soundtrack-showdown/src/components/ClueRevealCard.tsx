import { ReportIssueButton } from '@games/platform';
import type { SoundtrackClue } from '../types';

interface ClueRevealCardProps {
  clue: SoundtrackClue;
  roomId: string | null;
}

/** Shows the true theme title, performer, and media type after reveal. Safe —
 * this only ever renders once `phase === 'reveal'`. */
export function ClueRevealCard({ clue, roomId }: ClueRevealCardProps) {
  return (
    <div className="clue-reveal-card">
      <span className="clue-reveal-media-type">{clue.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}</span>
      <h2 className="clue-reveal-title">{clue.correctTitle}</h2>
      <p className="clue-reveal-cue">
        "{clue.cueTitle}" — {clue.performedBy}
      </p>
      <ReportIssueButton
        gameSlug="soundtrack-showdown"
        itemId={clue.id}
        itemLabel={`${clue.correctTitle} — "${clue.cueTitle}" (${clue.performedBy})`}
        roomId={roomId}
        reasons={['This answer looks wrong', 'Wrong movie or show', 'Wrong performer']}
      />
    </div>
  );
}
