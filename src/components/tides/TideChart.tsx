interface TidePoint { hour: number; height: number; }
interface Props { points: TidePoint[]; currentHour: number; threshold?: number; }

export function TideChart({ points, currentHour, threshold = 0.4 }: Props) {
  const W = 600; const H = 200;
  const padding = { top: 24, bottom: 32, left: 0, right: 0 };
  const minH = 0; const maxH = 2.4;
  const x = (h: number) => padding.left + (h / 24) * (W - padding.left - padding.right);
  const y = (m: number) => padding.top + (1 - (m - minH) / (maxH - minH)) * (H - padding.top - padding.bottom);

  const path = points.map((p, i, arr) => {
    if (i === 0) return `M ${x(p.hour)} ${y(p.height)}`;
    const prev = arr[i - 1];
    const cx1 = x(prev.hour) + (x(p.hour) - x(prev.hour)) / 2;
    return `C ${cx1} ${y(prev.height)}, ${cx1} ${y(p.height)}, ${x(p.hour)} ${y(p.height)}`;
  }).join(" ");

  const thresholdY = y(threshold);
  const currentX = x(currentHour);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--ocean))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--ocean))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#tideFill)" />
        <path d={path} fill="none" stroke="hsl(var(--ocean))" strokeWidth={3} />
        <line x1={0} x2={W} y1={thresholdY} y2={thresholdY} stroke="hsl(var(--nature))" strokeWidth={1.5} strokeDasharray="6 4" />
        <circle cx={currentX} cy={y(0.55)} r={6} fill="hsl(var(--coral))" />
        {points.filter((_, i) => i > 0 && i < points.length - 1).map((p, i) => (
          <text key={i} x={x(p.hour)} y={y(p.height) - 10} textAnchor="middle" fontSize="10" className="fill-ocean-deep font-bold">{p.height}m</text>
        ))}
      </svg>
    </div>
  );
}
