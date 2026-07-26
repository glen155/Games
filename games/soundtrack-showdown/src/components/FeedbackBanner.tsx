interface FeedbackBannerProps {
  correct: boolean;
  correctAnswerText: string;
}

export function FeedbackBanner({ correct, correctAnswerText }: FeedbackBannerProps) {
  return (
    <div className={`feedback-banner${correct ? ' feedback-banner--correct' : ' feedback-banner--wrong'}`}>
      {correct ? <p>Correct!</p> : <p>Wrong — it was "{correctAnswerText}".</p>}
    </div>
  );
}
