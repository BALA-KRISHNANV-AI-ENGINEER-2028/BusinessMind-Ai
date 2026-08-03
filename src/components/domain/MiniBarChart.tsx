interface MiniBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

/**
 * A deliberately minimal chart primitive built with plain SVG — no charting
 * library dependency. Good enough for simple trend visualization; if the
 * product needs richer charts (tooltips, zoom, multi-series) later, that's
 * a separate decision (e.g. adding `recharts`) worth flagging before adding
 * the dependency.
 */
export function MiniBarChart({ data, height = 120 }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1 sm:gap-2" style={{ height }}>
      {data.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-sm bg-accent transition-[height] duration-200"
              style={{ height: `${(point.value / max) * 100}%` }}
              title={`${point.label}: ${point.value}`}
            />
          </div>
          <span className="text-xs text-text-secondary">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
