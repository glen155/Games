interface FeedbackBannerProps {
  correct: boolean;
  percent: number;
  correctAnswerText: string;
  poolRemaining: number;
}

export function FeedbackBanner({ correct, percent, correctAnswerText, poolRemaining }: FeedbackBannerProps) {
  return (
    <div className={`feedback-banner${correct ? ' feedback-banner--correct' : ' feedback-banner--wrong'}`}>
      {correct ? (
        <p>
          Correct! {percent}% of the crowd got this one too — {poolRemaining} contestants are
          still in it with you.
        </p>
      ) : (
        <p>
          Wrong — the answer was "{correctAnswerText}". Only {percent}% of the crowd would have
          survived this one, and you're out.
        </p>
      )}
    </div>
  );
}
