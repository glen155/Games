interface ClockFaceProps {
  hour: number; // 0-11 (or any int; wraps)
  minute: number; // 0-59
  size?: number;
  label?: string;
}

/**
 * A simple analog clock face for clock-code-style puzzles (e.g. "what number
 * does the clock's minute hand point to?"). Purely decorative/presentational —
 * the puzzle's actual answer options stay plain text.
 */
export function ClockFace({ hour, minute, size = 120, label }: ClockFaceProps) {
  const center = size / 2;
  const faceRadius = center - 6;

  const hourAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30;
  const minuteAngle = (minute / 60) * 360;

  const hourHandLength = faceRadius * 0.5;
  const minuteHandLength = faceRadius * 0.75;

  const handPoint = (angleDeg: number, length: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: center + length * Math.cos(angleRad),
      y: center + length * Math.sin(angleRad),
    };
  };

  const hourTip = handPoint(hourAngle, hourHandLength);
  const minuteTip = handPoint(minuteAngle, minuteHandLength);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angleDeg = i * 30;
    const outer = handPoint(angleDeg, faceRadius - 4);
    const inner = handPoint(angleDeg, faceRadius - 12);
    return { key: i, outer, inner };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={label ?? `Clock showing ${hour} o'clock and ${minute} minutes`}
    >
      <circle cx={center} cy={center} r={faceRadius} fill="none" stroke="var(--gold)" strokeWidth={3} />
      {ticks.map((tick) => (
        <line
          key={tick.key}
          x1={tick.inner.x}
          y1={tick.inner.y}
          x2={tick.outer.x}
          y2={tick.outer.y}
          stroke="var(--gold-dark)"
          strokeWidth={2}
        />
      ))}
      <line
        x1={center}
        y1={center}
        x2={hourTip.x}
        y2={hourTip.y}
        stroke="var(--cream)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <line
        x1={center}
        y1={center}
        x2={minuteTip.x}
        y2={minuteTip.y}
        stroke="var(--cream)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={center} cy={center} r={4} fill="var(--gold)" />
    </svg>
  );
}
