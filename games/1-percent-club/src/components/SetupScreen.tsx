import { useState, type FormEvent } from 'react';
import { callEdgeFunction, isMultiplayerConfigured } from '@games/platform';
import type { QuestionTier } from '../types';
import type { ClassicLadder } from '../data/questions';

interface SetupScreenProps {
  defaultJackpot: number;
  onStart: (jackpotAmount: number) => void;
  onQuestionsGenerated: (questions: QuestionTier[]) => void;
  classicLadders: ClassicLadder[];
  onSelectLadder: (tiers: QuestionTier[]) => void;
}

interface GenerateResponse {
  gameSlug: string;
  generatedAt: string;
  data: QuestionTier[];
}

type GenerateStatus = 'idle' | 'generating' | 'ready' | 'error';

export function SetupScreen({
  defaultJackpot,
  onStart,
  onQuestionsGenerated,
  classicLadders,
  onSelectLadder,
}: SetupScreenProps) {
  const [amount, setAmount] = useState(defaultJackpot > 0 ? String(defaultJackpot) : '10000');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'' | 'easy' | 'medium' | 'hard'>('');
  const [status, setStatus] = useState<GenerateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedLadderIndex, setSelectedLadderIndex] = useState<number | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);
    if (parsed > 0) onStart(parsed);
  }

  async function handleGenerate() {
    setStatus('generating');
    setError(null);
    try {
      const res = await callEdgeFunction<GenerateResponse>('generate-round', {
        gameSlug: 'one-percent-club',
        topic: topic.trim() || undefined,
        difficulty: difficulty || undefined,
      });
      if (!Array.isArray(res.data) || res.data.length === 0) {
        throw new Error('No questions came back');
      }
      onQuestionsGenerated(res.data);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate questions');
      setStatus('error');
    }
  }

  return (
    <div className="setup-screen">
      <h1 className="setup-title">1% Club</h1>
      <p className="setup-rules">
        You're up against a simulated crowd of 100. Each question gets harder, and is labelled
        with the percentage of that crowd who'd get it right. Answer correctly and keep climbing
        — get one wrong and you're eliminated. Survive all the way to the 1% question to win the
        whole jackpot.
      </p>

      <div className="setup-ladder-picker">
        <p className="setup-ladder-label">Classic ladder</p>
        <div className="setup-ladder-options">
          {classicLadders.map((ladder, index) => (
            <button
              key={ladder.name}
              type="button"
              className={
                selectedLadderIndex === index
                  ? 'setup-ladder-button setup-ladder-button--selected'
                  : 'setup-ladder-button'
              }
              onClick={() => {
                setSelectedLadderIndex(index);
                onSelectLadder(ladder.tiers);
              }}
            >
              {ladder.name}
            </button>
          ))}
        </div>
        <p className="setup-ladder-hint">
          {selectedLadderIndex === null
            ? "We'll pick one at random if you don't choose."
            : classicLadders[selectedLadderIndex].description}
        </p>
      </div>

      {isMultiplayerConfigured && (
        <div className="setup-generate">
          <p className="setup-generate-label">Want a fresh set of questions?</p>
          <div className="setup-generate-fields">
            <input
              className="setup-generate-input"
              type="text"
              placeholder="Topic (optional) — e.g. sports, history"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={status === 'generating'}
            />
            <select
              className="setup-generate-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              disabled={status === 'generating'}
            >
              <option value="">Any difficulty</option>
              <option value="easy">Easier</option>
              <option value="medium">Medium</option>
              <option value="hard">Harder</option>
            </select>
            <button
              type="button"
              className="setup-generate-button"
              onClick={handleGenerate}
              disabled={status === 'generating'}
            >
              {status === 'generating' ? 'Generating…' : 'Generate questions'}
            </button>
          </div>
          {status === 'ready' && <p className="setup-generate-status setup-generate-status--ok">New questions ready — start when you are!</p>}
          {status === 'error' && (
            <p className="setup-generate-status setup-generate-status--error">
              {error} — playing the classic questions instead.
            </p>
          )}
        </div>
      )}

      <form className="setup-form" onSubmit={handleSubmit}>
        <label className="setup-label" htmlFor="jackpot-input">
          Jackpot amount (£)
        </label>
        <input
          id="jackpot-input"
          className="setup-input"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <button type="submit" className="setup-start-button" disabled={Number(amount) <= 0}>
          Start Game
        </button>
      </form>
    </div>
  );
}
