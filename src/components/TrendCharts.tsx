import { useState } from "react";

// Small hand-rolled SVG trend charts - the dataset here (one point per
// season) is tiny, so pulling in a charting library isn't worth the bundle
// weight. Colors come from the app's own dark-theme role variables
// (--win/--loss/--accent/--offense/--defense/--gold) rather than a generic
// palette, since those roles already carry meaning elsewhere in the UI.

const W = 320;
const H = 120;
const PAD_L = 6;
const PAD_R = 18;
const PAD_T = 12;
const PAD_B = 22;

function scaleX(i: number, n: number): number {
  if (n <= 1) return W / 2;
  return PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R);
}

function scaleY(v: number, min: number, max: number): number {
  const usable = H - PAD_T - PAD_B;
  if (max === min) return PAD_T + usable / 2;
  return PAD_T + usable - ((v - min) / (max - min)) * usable;
}

function niceGridlines(min: number, max: number, count = 3): number[] {
  if (max === min) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

export interface LineSeries {
  label: string;
  color: string;
  points: { year: number; value: number }[];
}

interface LineTrendChartProps {
  title: string;
  series: LineSeries[];
  yFormat?: (v: number) => string;
  area?: boolean; // only meaningful for a single series
  yDomain?: [number, number];
}

export function LineTrendChart({ title, series, yFormat = String, area = false, yDomain }: LineTrendChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const years = series[0]?.points.map((p) => p.year) ?? [];
  const n = years.length;
  const min = yDomain ? yDomain[0] : Math.min(...allValues);
  const max = yDomain ? yDomain[1] : Math.max(...allValues);
  const grid = niceGridlines(min, max);

  if (n === 0) return null;

  const activeYear = active !== null ? years[active] : null;

  return (
    <div className="trend-chart">
      <div className="trend-chart-title">{title}</div>
      {series.length > 1 && (
        <div className="trend-legend">
          {series.map((s) => (
            <span key={s.label} className="trend-legend-item">
              <span className="trend-legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label={title}>
        {grid.map((g) => (
          <line
            key={g}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={scaleY(g, min, max)}
            y2={scaleY(g, min, max)}
            className="trend-gridline"
          />
        ))}
        {area && series[0] && (
          <polygon
            points={
              series[0].points.map((p, i) => `${scaleX(i, n)},${scaleY(p.value, min, max)}`).join(" ") +
              ` ${scaleX(n - 1, n)},${H - PAD_B} ${scaleX(0, n)},${H - PAD_B}`
            }
            fill={series[0].color}
            opacity={0.1}
          />
        )}
        {series.map((s) => (
          <polyline
            key={s.label}
            points={s.points.map((p, i) => `${scaleX(i, n)},${scaleY(p.value, min, max)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) =>
          s.points.map((p, i) => (
            <g key={`${s.label}-${i}`}>
              <circle cx={scaleX(i, n)} cy={scaleY(p.value, min, max)} r={5} className="trend-dot-ring" />
              <circle
                cx={scaleX(i, n)}
                cy={scaleY(p.value, min, max)}
                r={3.5}
                fill={s.color}
                className="trend-dot"
                onClick={() => setActive(i)}
              />
            </g>
          ))
        )}
        {series.map((s) => {
          const last = s.points[s.points.length - 1];
          if (!last) return null;
          return (
            <text
              key={`${s.label}-label`}
              x={scaleX(n - 1, n) + 4}
              y={scaleY(last.value, min, max) + 3}
              className="trend-endlabel"
              fill="currentColor"
            >
              {yFormat(last.value)}
            </text>
          );
        })}
        {years.map((y, i) => (
          <text key={y} x={scaleX(i, n)} y={H - 4} textAnchor="middle" className="trend-axislabel">
            {y}
          </text>
        ))}
      </svg>
      {activeYear !== null && (
        <div className="trend-readout">
          {activeYear}:{" "}
          {series
            .map((s) => `${s.label} ${yFormat(s.points[active!].value)}`)
            .join(" · ")}
        </div>
      )}
    </div>
  );
}

export interface BarPoint {
  year: number;
  value: number;
  color: string;
  detail: string;
}

interface BarTrendChartProps {
  title: string;
  points: BarPoint[];
  yFormat?: (v: number) => string;
}

export function BarTrendChart({ title, points, yFormat = String }: BarTrendChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  if (n === 0) return null;
  const max = Math.max(100, ...points.map((p) => p.value));
  const slot = (W - PAD_L - PAD_R) / n;
  const barW = Math.min(24, slot * 0.6);

  return (
    <div className="trend-chart">
      <div className="trend-chart-title">{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label={title}>
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} className="trend-baseline" />
        {points.map((p, i) => {
          const cx = PAD_L + slot * i + slot / 2;
          const barH = ((H - PAD_T - PAD_B) * p.value) / max;
          const y = H - PAD_B - barH;
          return (
            <g key={p.year} onClick={() => setActive(i)}>
              <rect x={cx - barW / 2} y={y} width={barW} height={Math.max(barH, 2)} rx={4} fill={p.color} />
              <text x={cx} y={y - 4} textAnchor="middle" className="trend-endlabel" fill="currentColor">
                {yFormat(p.value)}
              </text>
              <text x={cx} y={H - 4} textAnchor="middle" className="trend-axislabel">
                {p.year}
              </text>
            </g>
          );
        })}
      </svg>
      {active !== null && <div className="trend-readout">{points[active].year}: {points[active].detail}</div>}
    </div>
  );
}
