import React from 'react';
import { getScoreColor } from '../lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreGauge({ score, size = 200, strokeWidth = 16 }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc spans 240 degrees (from -210deg to 30deg, bottom-left to bottom-right)
  const startAngle = -210; // degrees
  const totalAngle = 240; // degrees

  // Normalized score 0-1
  const normalized = Math.max(0, Math.min(1, (score - 300) / 600));
  const fillAngle = normalized * totalAngle;

  // Convert degrees to radians
  const toRad = (d: number) => (d * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number) => {
    const start = {
      x: cx + radius * Math.cos(toRad(startDeg)),
      y: cy + radius * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + radius * Math.cos(toRad(endDeg)),
      y: cy + radius * Math.sin(toRad(endDeg)),
    };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-0">
        {/* Background track */}
        <path
          d={arcPath(startAngle, startAngle + totalAngle)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score fill */}
        {fillAngle > 0 && (
          <path
            d={arcPath(startAngle, startAngle + fillAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        )}
        {/* Range labels */}
        {[
          { angle: startAngle, label: '300' },
          { angle: startAngle + totalAngle, label: '900' },
        ].map(({ angle, label }) => {
          const lx = cx + (radius + strokeWidth) * Math.cos(toRad(angle));
          const ly = cy + (radius + strokeWidth) * Math.sin(toRad(angle));
          return (
            <text
              key={label}
              x={lx}
              y={ly + 4}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
              fontFamily="system-ui"
            >
              {label}
            </text>
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{Math.round(score)}</span>
        <span className="text-xs text-slate-400 mt-1">Experimental Score</span>
      </div>
    </div>
  );
}
