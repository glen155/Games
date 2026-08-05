import type { ReactNode } from 'react';

interface QuestionCardProps {
  percent: number;
  prompt: string;
  promptVisual?: ReactNode;
}

export function QuestionCard({ percent, prompt, promptVisual }: QuestionCardProps) {
  return (
    <div className="question-card">
      <span className="question-percent-badge">{percent}%</span>
      {promptVisual && <div className="question-visual">{promptVisual}</div>}
      <p className="question-prompt">{prompt}</p>
    </div>
  );
}
