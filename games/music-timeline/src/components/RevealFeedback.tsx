import type { RoundResult, Track } from '../types';

interface RevealFeedbackProps {
  track: Track;
  result: RoundResult | undefined;
}

export function RevealFeedback({ track, result }: RevealFeedbackProps) {
  const outcome = !result ? 'no-guess' : result.correct ? 'correct' : 'wrong';
  return (
    <div className={`mt-player-reveal mt-player-reveal--${outcome}`}>
      <p className="mt-player-reveal-year">{track.year}</p>
      <h2>{track.title}</h2>
      <p className="mt-player-reveal-artist">{track.artist}</p>
      <p className="mt-player-reveal-result">
        {outcome === 'no-guess'
          ? "You didn't lock in a guess"
          : outcome === 'correct'
            ? 'Correct! Card added to your timeline.'
            : 'Wrong — card discarded, no penalty.'}
      </p>
    </div>
  );
}
