import React, { useState } from 'react';

export interface BarChartPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartPoint[];
  unit?: string;
  width?: number;
  height?: number;
  color?: string;
}

const PAD = { top: 16, right: 12, bottom: 28, left: 40 };
const MAX_BAR_WIDTH = 24;

/** A single-series bar chart: capped bar thickness, 4px rounded caps, per-bar hover tooltip. */
export const BarChart: React.FC<BarChartProps> = ({ data, unit = '', width = 640, height = 300, color = 'var(--chart-series-1)' }) => {
  const [hover, setHover] = useState<number | null>(null);
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return <div className="chart-card flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet.</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = innerW / data.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.6);
  const yTicks = [0, max / 2, max];

  return (
    <div className="chart-card relative" style={{ minHeight: 220 }}>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Bar chart across ${data.length} categories, from ${data[0].label} to ${data[data.length - 1].label}.`}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} x2={innerW} y1={innerH - (t / max) * innerH} y2={innerH - (t / max) * innerH} className="chart-grid-line" />
              <text x={-8} y={innerH - (t / max) * innerH} textAnchor="end" dominantBaseline="middle" className="chart-axis-label">
                {Math.round(t).toLocaleString()}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = slot * i + slot / 2;
            const barH = (d.value / max) * innerH;
            const isHover = hover === i;
            return (
              <g key={i}>
                <rect
                  x={cx - barWidth / 2}
                  y={innerH - barH}
                  width={barWidth}
                  height={Math.max(barH, 1)}
                  rx={4}
                  fill={color}
                  opacity={isHover ? 1 : 0.85}
                />
                <text x={cx} y={innerH + 20} textAnchor="middle" className="chart-axis-label">
                  {d.label}
                </text>
                {/* Hover/focus hit target covers the full column slot, not just the bar. */}
                <rect
                  x={slot * i}
                  y={0}
                  width={slot}
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
            );
          })}
        </g>
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD.left + slot * hover + slot / 2) / width) * 100}%`,
            top: `${((PAD.top + innerH - (data[hover].value / max) * innerH) / height) * 100}%`,
          }}
        >
          <div className="chart-tooltip-value">{data[hover].value.toLocaleString()}{unit}</div>
          <div>{data[hover].label}</div>
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
