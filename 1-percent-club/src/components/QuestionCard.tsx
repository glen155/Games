interface QuestionCardProps {
  percent: number;
  prompt: string;
}

export function QuestionCard({ percent, prompt }: QuestionCardProps) {
  return (
    <div className="question-card">
      <span className="question-percent-badge">{percent}%</span>
      <p className="question-prompt">{prompt}</p>
    </div>
  );
}
