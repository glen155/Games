export type ShapeKind = 'circle' | 'square' | 'triangle' | 'star' | 'pentagon';

interface ShapeIconProps {
  shape: ShapeKind;
  fill?: string;
  size?: number;
  label?: string;
}

// Point helper for regular polygons/stars, centered in a `size`x`size` viewBox.
function polygonPoints(sides: number, size: number, rotationDeg = -90): string {
  const center = size / 2;
  const radius = center - 6;
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((360 / sides) * i + rotationDeg) * (Math.PI / 180);
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

function starPoints(size: number): string {
  const center = size / 2;
  const outerRadius = center - 6;
  const innerRadius = outerRadius * 0.45;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = ((36 * i - 90) * Math.PI) / 180;
    points.push(`${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`);
  }
  return points.join(' ');
}

/**
 * A single hand-built shape icon for pattern/odd-one-out puzzles. Used both as
 * a `promptVisual` (a sequence of shapes) and as `optionVisuals` (one shape
 * per answer choice) — the accessible text label always lives in `options`.
 */
export function ShapeIcon({ shape, fill = 'var(--gold)', size = 64, label }: ShapeIconProps) {
  const center = size / 2;
  const radius = center - 6;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label ?? shape}>
      {shape === 'circle' && <circle cx={center} cy={center} r={radius} fill={fill} />}
      {shape === 'square' && (
        <rect x={center - radius * 0.85} y={center - radius * 0.85} width={radius * 1.7} height={radius * 1.7} fill={fill} />
      )}
      {shape === 'triangle' && <polygon points={polygonPoints(3, size)} fill={fill} />}
      {shape === 'pentagon' && <polygon points={polygonPoints(5, size)} fill={fill} />}
      {shape === 'star' && <polygon points={starPoints(size)} fill={fill} />}
    </svg>
  );
}
