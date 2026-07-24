import { useState, type FormEvent } from 'react';

interface SetupScreenProps {
  defaultJackpot: number;
  onStart: (jackpotAmount: number) => void;
}

export function SetupScreen({ defaultJackpot, onStart }: SetupScreenProps) {
  const [amount, setAmount] = useState(defaultJackpot > 0 ? String(defaultJackpot) : '10000');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);
    if (parsed > 0) onStart(parsed);
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
