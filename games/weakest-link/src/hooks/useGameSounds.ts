import { useCallback, useRef, useState } from 'react';

type ToneShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface Tone {
  freq: number;
  duration: number;
  shape?: ToneShape;
  startAt?: number;
}

export function useGameSounds() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const playTones = useCallback(
    (tones: Tone[]) => {
      if (mutedRef.current) return;
      const ctx = getContext();
      const now = ctx.currentTime;
      for (const { freq, duration, shape = 'sine', startAt = 0 } of tones) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = shape;
        oscillator.frequency.value = freq;
        const start = now + startAt;
        const end = start + duration;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, end);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(end);
      }
    },
    [getContext],
  );

  const playCorrect = useCallback(
    () =>
      playTones([
        { freq: 523.25, duration: 0.12, shape: 'triangle' },
        { freq: 783.99, duration: 0.15, shape: 'triangle', startAt: 0.1 },
      ]),
    [playTones],
  );

  const playWrong = useCallback(
    () =>
      playTones([
        { freq: 160, duration: 0.35, shape: 'sawtooth' },
        { freq: 110, duration: 0.4, shape: 'sawtooth', startAt: 0.05 },
      ]),
    [playTones],
  );

  const playBank = useCallback(
    () =>
      playTones([
        { freq: 659.25, duration: 0.08, shape: 'square' },
        { freq: 987.77, duration: 0.18, shape: 'square', startAt: 0.07 },
      ]),
    [playTones],
  );

  const playEliminate = useCallback(
    () =>
      playTones([
        { freq: 300, duration: 0.25, shape: 'sawtooth' },
        { freq: 220, duration: 0.3, shape: 'sawtooth', startAt: 0.18 },
        { freq: 140, duration: 0.4, shape: 'sawtooth', startAt: 0.38 },
      ]),
    [playTones],
  );

  const playTick = useCallback(
    () => playTones([{ freq: 880, duration: 0.06, shape: 'square' }]),
    [playTones],
  );

  const playWin = useCallback(
    () =>
      playTones([
        { freq: 523.25, duration: 0.12, shape: 'triangle' },
        { freq: 659.25, duration: 0.12, shape: 'triangle', startAt: 0.1 },
        { freq: 783.99, duration: 0.12, shape: 'triangle', startAt: 0.2 },
        { freq: 1046.5, duration: 0.3, shape: 'triangle', startAt: 0.3 },
      ]),
    [playTones],
  );

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return { playCorrect, playWrong, playBank, playTick, playEliminate, playWin, muted, toggleMute };
}
