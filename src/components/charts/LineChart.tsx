import React, { useId, useState } from 'react';

export interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  /** Suffix shown after each value, e.g. "kg". */
  unit?: string;
  /** Viewbox size; the SVG scales to its container width and keeps this aspect ratio. */
  width?: number;
  height?: number;
  color?: string;
}

const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

/** A single-series line chart: 2px line, ~10% area wash, hover crosshair + tooltip. */
export const LineChart: React.FC<LineChartProps> = ({ data, unit = '', width = 640, height = 300, color = 'var(--chart-series-1)' }) => {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return <div className="chart-card flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet.</div>;
  }

  const values = data.map((d) => d.value);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(0, Math.min(...values));
  const max = rawMax === rawMin ? rawMax + 1 : rawMax;
  const min = rawMin;
  const x = (i: number) => (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => innerH - ((v - min) / (max - min)) * innerH;

  const linePoints = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPoints = `${x(0)},${innerH} ${linePoints} ${x(data.length - 1)},${innerH}`;

  const yTicks = [min, (min + max) / 2, max];
  // Thin out x labels so they never crowd — show at most ~7.
  const xLabelStep = Math.max(1, Math.ceil(data.length / 7));

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="chart-card relative" style={{ minHeight: 220 }}>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Line chart of ${data.length} points, from ${data[0].label} to ${data[data.length - 1].label}. Latest value ${data[data.length - 1].value}${unit}.`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="chart-grid-line" />
              <text x={-8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="chart-axis-label">
                {Math.round(t).toLocaleString()}
              </text>
            </g>
          ))}

          <polygon points={areaPoints} fill={`url(#${gradId})`} stroke="none" />
          <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={innerH} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
          )}

          {data.map((d, i) => (
            <g key={i}>
              {i === data.length - 1 && (
                <circle cx={x(i)} cy={y(d.value)} r={5} fill={color} stroke="var(--color-card-bg)" strokeWidth={2} />
              )}
              {hover === i && i !== data.length - 1 && (
                <circle cx={x(i)} cy={y(d.value)} r={5} fill={color} stroke="var(--color-card-bg)" strokeWidth={2} />
              )}
              {i % xLabelStep === 0 && (
                <text x={x(i)} y={innerH + 20} textAnchor="middle" className="chart-axis-label">
                  {d.label}
                </text>
              )}
              {/* Hover/focus hit target — generous, not just the painted line. */}
              <rect
                x={x(i) - innerW / data.length / 2}
                y={0}
                width={Math.max(innerW / data.length, 16)}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${d.label}: ${d.value}${unit}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          ))}
        </g>
      </svg>

      {active && hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD.left + x(hover)) / width) * 100}%`,
            top: `${((PAD.top + y(active.value)) / height) * 100}%`,
          }}
        >
          <div className="chart-tooltip-value">{active.value.toLocaleString()}{unit}</div>
          <div>{active.label}</div>
        </div>
      )}

      <table className="sr-only">
        <caption>Chart data</caption>
        <thead><tr><th>Label</th><th>Value</th></tr></thead>
        <tbody>{data.map((d, i) => <tr key={i}><td>{d.label}</td><td>{d.value}{unit}</td></tr>)}</tbody>
      </table>
    </div>
  );
};
