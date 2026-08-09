import { useState } from 'react';

interface SolveFormProps {
  disabled: boolean;
  onSolve: (guess: string) => void;
}

/** Toggle button that opens into a text input — "Solve the Puzzle" is a
 * deliberate, separate action from letter-guessing, not just another tile. */
export function SolveForm({ disabled, onSolve }: SolveFormProps) {
  const [open, setOpen] = useState(false);
  const [guess, setGuess] = useState('');

  function submit() {
    const trimmed = guess.trim();
    if (!trimmed) return;
    onSolve(trimmed);
    setGuess('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className="wof-btn wof-solve-toggle" disabled={disabled} onClick={() => setOpen(true)}>
        Solve the Puzzle
      </button>
    );
  }

  return (
    <div className="wof-solve-form">
      <input
        className="wof-solve-input"
        value={guess}
        autoFocus
        placeholder="Type the full solution…"
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <div className="wof-solve-actions">
        <button type="button" className="wof-btn wof-btn--primary" onClick={submit}>
          Submit
        </button>
        <button type="button" className="wof-btn wof-btn--ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
