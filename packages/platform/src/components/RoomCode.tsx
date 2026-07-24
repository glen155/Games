import { useState } from 'react';
import { QRCode } from './QRCode';

interface RoomCodeProps {
  code: string;
}

/** Builds the shareable join link for the current app + room code. */
function joinUrl(code: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('join', code);
  url.hash = '';
  return url.toString();
}

/**
 * The "share this to let people join" panel: big room code, a QR that deep-links
 * straight to the join screen, and a copy button for the link.
 */
export function RoomCode({ code }: RoomCodeProps) {
  const link = joinUrl(code);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    void navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="room-code">
      <div className="room-code-main">
        <span className="room-code-label">Join at this device — room code</span>
        <span className="room-code-value">{code}</span>
        <button type="button" className="room-code-copy" onClick={copyLink}>
          {copied ? 'Link copied!' : 'Copy join link'}
        </button>
      </div>
      <div className="room-code-qr">
        <QRCode value={link} />
        <span className="room-code-qr-hint">Scan to join</span>
      </div>
    </div>
  );
}
