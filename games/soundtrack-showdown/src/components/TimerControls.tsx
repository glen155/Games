import type { TimerConfig } from '../types';
import { useCountdown } from '../hooks/useCountdown';

interface TimerControlsProps {
  config: TimerConfig;
  timerEndsAt: number | null;
  phase: 'answering' | 'reveal';
  onConfigChange: (config: TimerConfig) => void;
  onStart: () => void;
  onClear: () => void;
}

/**
 * Host-only timer cluster: mode + duration configuration, plus (while a clue
 * is being answered) either a live countdown with a cancel button, or a
 * manual start button if nothing is running yet.
 */
export function TimerControls({ config, timerEndsAt, phase, onConfigChange, onStart, onClear }: TimerControlsProps) {
  const secondsLeft = useCountdown(timerEndsAt);

  return (
    <div className="timer-controls">
      <div className="timer-config">
        <label className="timer-config-field">
          <span>Timer</span>
          <select
            value={config.mode}
            onChange={(e) => onConfigChange({ ...config, mode: e.target.value as TimerConfig['mode'] })}
          >
            <option value="auto">Auto-start</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className="timer-config-field">
          <span>Seconds</span>
          <input
            type="number"
            min={5}
            max={300}
            step={5}
            value={config.durationSeconds}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value > 0) onConfigChange({ ...config, durationSeconds: value });
            }}
          />
        </label>
      </div>
      {phase === 'answering' && (
        <div className="timer-display">
          {secondsLeft !== null ? (
            <>
              <span className={`timer-countdown${secondsLeft <= 5 ? ' timer-countdown--urgent' : ''}`}>
                {secondsLeft}s
              </span>
              <button type="button" className="controls-button" onClick={onClear}>
                Cancel Timer
              </button>
            </>
          ) : (
            <button type="button" className="controls-button" onClick={onStart}>
              Start Timer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
