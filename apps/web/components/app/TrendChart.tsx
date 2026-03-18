type Point = {
  label: string;
  value: number;
};

function buildPath(points: Point[], width: number, height: number) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const step = width / Math.max(points.length - 1, 1);

  return points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point.value / max) * (height - 24) - 12;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function TrendChart({
  points,
  accent = false,
}: {
  points: Point[];
  accent?: boolean;
}) {
  const width = 640;
  const height = 220;
  const path = buildPath(points, width, height);
  const bars = points.map((point) => point.value);
  const max = Math.max(...bars, 1);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full">
          <defs>
            <linearGradient id="trend-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accent ? "#f59e0b" : "#ffffff"} stopOpacity="0.4" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor={accent ? "#f59e0b" : "#ffffff"} stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="trend-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.2, 0.4, 0.6, 0.8].map((row) => (
            <line
              key={row}
              x1="0"
              y1={height * row}
              x2={width}
              y2={height * row}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="5 8"
            />
          ))}

          <path
            d={`${path} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#trend-fill)"
          />
          <path
            d={path}
            fill="none"
            stroke="url(#trend-stroke)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = (index * width) / Math.max(points.length - 1, 1);
            const y = height - (point.value / max) * (height - 24) - 12;

            return (
              <g key={point.label}>
                <circle cx={x} cy={y} r="6" fill="#070707" stroke="#ffffff" strokeWidth="2" />
                <circle cx={x} cy={y} r="2.5" fill={accent ? "#f59e0b" : "#ffffff"} />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-6 gap-2 text-[11px] uppercase tracking-[0.24em] text-white/35">
        {points.map((point) => (
          <div key={point.label}>{point.label}</div>
        ))}
      </div>
    </div>
  );
}
