import type { SoundtrackClue } from '../types';

interface ClueRevealCardProps {
  clue: SoundtrackClue;
}

/** Shows the true theme title, performer, and media type after reveal. Safe —
 * this only ever renders once `phase === 'reveal'`. */
export function ClueRevealCard({ clue }: ClueRevealCardProps) {
  return (
    <div className="clue-reveal-card">
      <span className="clue-reveal-media-type">{clue.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}</span>
      <h2 className="clue-reveal-title">{clue.correctTitle}</h2>
      <p className="clue-reveal-cue">
        "{clue.cueTitle}" — {clue.performedBy}
      </p>
    </div>
  );
}
