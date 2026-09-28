import React, { useState } from 'react';

export interface DonutSlice {
  label: string;
  value: number;
  /** Defaults to the fixed 3-slot categorical order if omitted. */
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerLabel?: string;
  size?: number;
}

// Fixed categorical order — never cycle or reassign per filter (see dataviz skill).
const DEFAULT_COLORS = ['var(--chart-series-1)', 'var(--chart-series-2)', 'var(--chart-series-3)'];
const GAP_DEG = 2; // surface gap between slices, in degrees

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startDeg);
  const [x2, y2] = toXY(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/** A donut used sparingly (2-3 slices): fixed categorical order, legend, center total, per-slice tooltip. */
export const DonutChart: React.FC<DonutChartProps> = ({ data, centerLabel, size = 220 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;

  if (total === 0) {
    return <div className="chart-card flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet.</div>;
  }

  let cursor = 0;
  const slices = data.map((d, i) => {
    const fraction = d.value / total;
    const sweep = fraction * 360;
    const start = cursor + GAP_DEG / 2;
    const end = cursor + sweep - GAP_DEG / 2;
    cursor += sweep;
    return { ...d, start, end: Math.max(end, start + 0.5), color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length], fraction };
  });

  const active = hover !== null ? slices[hover] : null;

  return (
    <div className="chart-card flex flex-col sm:flex-row items-center gap-6" style={{ minHeight: 220 }}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`Donut chart: ${data.map((d) => `${d.label} ${Math.round((d.value / total) * 100)}%`).join(', ')}.`}>
          {slices.map((s, i) => (
            <path
              key={i}
              d={arcPath(cx, cy, r, s.start, s.end)}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? strokeWidth + 4 : strokeWidth}
              strokeLinecap="round"
              style={{ transition: 'stroke-width 0.12s ease' }}
              tabIndex={0}
              role="img"
              aria-label={`${s.label}: ${s.value} (${Math.round(s.fraction * 100)}%)`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-2xl font-bold text-[var(--color-text-main)] leading-none">
            {active ? active.value.toLocaleString() : total.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1">{active ? active.label : (centerLabel ?? 'Total')}</span>
        </div>
        {active && (
          <div className="chart-tooltip" style={{ left: '50%', top: '-8px' }}>
            <div className="chart-tooltip-value">{active.value.toLocaleString()}</div>
            <div>{active.label} · {Math.round(active.fraction * 100)}%</div>
          </div>
        )}
      </div>

      <div className="chart-legend flex-col items-start sm:flex-col">
        {slices.map((s, i) => (
          <div key={i} className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            <span className="text-[var(--color-text-main)] font-medium">{s.label}</span>
            <span>{Math.round(s.fraction * 100)}%</span>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Chart data</caption>
        <thead><tr><th>Label</th><th>Value</th><th>Share</th></tr></thead>
        <tbody>{slices.map((s, i) => <tr key={i}><td>{s.label}</td><td>{s.value}</td><td>{Math.round(s.fraction * 100)}%</td></tr>)}</tbody>
      </table>
    </div>
  );
};
