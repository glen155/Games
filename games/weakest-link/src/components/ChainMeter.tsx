import { CHAIN_LADDER } from '../state/gameReducer';

interface ChainMeterProps {
  chainStep: number;
  currentChain: number;
  roundPot: number;
  bank: number;
}

/** The chain ladder, this round's banked pot, and the game's total bank —
 * the three numbers that matter most on the host screen during a money
 * round. */
export function ChainMeter({ chainStep, currentChain, roundPot, bank }: ChainMeterProps) {
  return (
    <div className="wl-chain">
      <ol className="wl-chain-ladder">
        {CHAIN_LADDER.map((value, index) => (
          <li
            key={value}
            className={`wl-chain-rung${index === chainStep ? ' wl-chain-rung--current' : ''}${
              index < chainStep ? ' wl-chain-rung--climbed' : ''
            }`}
          >
            {value}
          </li>
        ))}
      </ol>
      <div className="wl-chain-totals">
        <div className="wl-chain-total">
          <span className="wl-chain-total-label">Chain</span>
          <span className="wl-chain-total-value">{currentChain}</span>
        </div>
        <div className="wl-chain-total">
          <span className="wl-chain-total-label">Round pot</span>
          <span className="wl-chain-total-value">{roundPot}</span>
        </div>
        <div className="wl-chain-total wl-chain-total--bank">
          <span className="wl-chain-total-label">Bank</span>
          <span className="wl-chain-total-value">{bank}</span>
        </div>
      </div>
    </div>
  );
}
