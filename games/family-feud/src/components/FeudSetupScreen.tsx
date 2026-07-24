import { useState } from 'react';
import { callEdgeFunction, isMultiplayerConfigured } from '@games/platform';
import type { Category } from '../types';

interface FeudSetupScreenProps {
  onBeginClassic: () => void;
  onBeginGenerated: (rounds: Category[]) => void;
}

interface GenerateResponse {
  gameSlug: string;
  generatedAt: string;
  data: Category;
}

type Status = 'idle' | 'generating' | 'error';

/**
 * Shown once, before the first round of a fresh game. Lets the host either
 * jump straight into the classic built-in rounds (default, works offline),
 * or generate one or more fresh themed rounds via the LLM-backed Edge
 * Function before starting. A host judges every answer either way, so
 * creative AI-generated content is a safe fit here.
 */
export function FeudSetupScreen({ onBeginClassic, onBeginGenerated }: FeudSetupScreenProps) {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Category[]>([]);

  async function handleGenerate() {
    setStatus('generating');
    setError(null);
    try {
      const res = await callEdgeFunction<GenerateResponse>('generate-round', {
        gameSlug: 'family-feud',
        topic: topic.trim() || undefined,
      });
      if (!res.data?.name || !Array.isArray(res.data.answers) || res.data.answers.length === 0) {
        throw new Error('That round came back malformed');
      }
      setRounds((prev) => [...prev, res.data]);
      setTopic('');
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a round');
      setStatus('error');
    }
  }

  return (
    <div className="setup-screen">
      <h1 className="setup-title">Family Feud</h1>
      <p className="setup-rules">
        Play the classic built-in rounds, or generate fresh themed rounds to play instead.
      </p>

      <button type="button" className="setup-start-button" onClick={onBeginClassic}>
        Play the classic rounds
      </button>

      {isMultiplayerConfigured && (
        <div className="setup-generate">
          <p className="setup-generate-label">Or generate your own rounds</p>
          <div className="setup-generate-fields">
            <input
              className="setup-generate-input"
              type="text"
              placeholder="Topic (optional) — e.g. things at the beach"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={status === 'generating'}
            />
            <button
              type="button"
              className="setup-generate-button"
              onClick={handleGenerate}
              disabled={status === 'generating'}
            >
              {status === 'generating' ? 'Generating…' : 'Generate a round'}
            </button>
          </div>
          {status === 'error' && (
            <p className="setup-generate-status setup-generate-status--error">{error}</p>
          )}
          {rounds.length > 0 && (
            <>
              <ul className="setup-generated-list">
                {rounds.map((r, i) => (
                  <li key={i}>{r.name}</li>
                ))}
              </ul>
              <button type="button" className="setup-start-button" onClick={() => onBeginGenerated(rounds)}>
                Play {rounds.length === 1 ? 'this round' : `these ${rounds.length} rounds`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
