import { useState } from 'react';
import { isMultiplayerConfigured } from '../supabase';
import { reportIssue } from '../issueReports';

interface ReportIssueButtonProps {
  gameSlug: string;
  itemId: string;
  /** Reveal-safe label only — never pass a pre-reveal secret field here. */
  itemLabel?: string | null;
  roomId?: string | null;
  reasons: string[];
  label?: string;
}

/**
 * A small "flag this" affordance shared by every game. Safe to use pre-reveal
 * (pass itemLabel: null, report by id alone) or post-reveal (pass a
 * human-readable label). Renders nothing when multiplayer isn't configured —
 * there's nowhere to send a report, matching the pattern in
 * games/leaderboard/src/App.tsx.
 */
export function ReportIssueButton({
  gameSlug,
  itemId,
  itemLabel = null,
  roomId = null,
  reasons,
  label = '🚩 Report an issue',
}: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isMultiplayerConfigured) return null;
  if (sent) return <p className="report-issue-sent">Thanks — flagged for review.</p>;

  return (
    <div className="report-issue">
      <button type="button" className="report-issue-trigger" onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className="report-issue-menu">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              className="report-issue-reason"
              onClick={() => {
                setOpen(false);
                setSent(true);
                void reportIssue(gameSlug, itemId, itemLabel, reason, roomId);
              }}
            >
              {reason}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
