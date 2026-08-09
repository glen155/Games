import { useState } from 'react';

interface FlipVoteCardProps {
  /** Whose card this is — shown as a label above the card in a roster
   * context (the host screen). Omitted for a player's own private view of
   * their own card. */
  ownerNickname?: string;
  targetNickname: string;
  /** Synced truth: has this voter already revealed their card? */
  revealed: boolean;
  /** Can this card be tapped from here? True on the owner's own phone, and
   * on the host screen for a 'local-' player sharing that screen. False for
   * a remote voter's row on the host screen — their real flip happens on
   * their own phone. */
  interactive: boolean;
  onReveal?: () => void;
}

/**
 * A tappable card that flips over (3D CSS transform) to reveal who its
 * owner voted for — the "turn your phone to reveal" mechanic. Flips
 * instantly (optimistically) on tap rather than waiting for the synced
 * `revealed` prop to catch up, so it always feels immediate to whoever's
 * actually flipping it; a late-arriving sync (or a page refresh) just
 * renders straight into the revealed state with no animation.
 */
export function FlipVoteCard({
  ownerNickname,
  targetNickname,
  revealed,
  interactive,
  onReveal,
}: FlipVoteCardProps) {
  const [flippedLocally, setFlippedLocally] = useState(false);
  const showFace = revealed || flippedLocally;

  function handleTap() {
    if (!interactive || showFace) return;
    setFlippedLocally(true);
    onReveal?.();
  }

  return (
    <div className="wl-flip-card-wrap">
      {ownerNickname && <span className="wl-flip-card-owner">{ownerNickname}</span>}
      <button
        type="button"
        className={`wl-flip-card${showFace ? ' wl-flip-card--revealed' : ''}`}
        onClick={handleTap}
        disabled={!interactive || showFace}
      >
        <div className="wl-flip-card-inner">
          <div className="wl-flip-card-face wl-flip-card-front">
            <span className="wl-flip-card-mark">?</span>
            {interactive && <span className="wl-flip-card-hint">Tap to flip</span>}
          </div>
          <div className="wl-flip-card-face wl-flip-card-back">
            <span className="wl-flip-card-back-label">voted for</span>
            <span className="wl-flip-card-back-target">{targetNickname}</span>
          </div>
        </div>
      </button>
    </div>
  );
}
