import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const SEGMENT_COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#F97316", "#8B5CF6", "#64748B", "#EC4899", "#22C55E"];

export function AssetTypeDistribution({ segments }) {
  const data =
    segments?.filter((s) => s.value > 0).map((s, i) => ({
      name: s.label || "Unknown",
      value: s.value,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    })) ?? [];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length) {
    return (
      <div
        className="flex h-[300px] w-full flex-col items-center justify-center"
        aria-label="Asset type distribution chart"
      >
        <div className="mb-3 h-16 w-16 rounded-full border-4 border-dashed border-app-border" />
        <p className="text-sm text-app-text-muted">No category data yet</p>
        <p className="mt-1 text-[13px] text-app-text-secondary">
          Categories will be shown once assets are classified.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="Asset type distribution donut chart">
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="var(--app-surface, #FFFFFF)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--app-surface, #0F172A)",
                color: "var(--app-text, #FFFFFF)",
                borderRadius: 6,
                border: "1px solid var(--app-border, transparent)",
                fontSize: 13,
                padding: "8px 12px",
              }}
              formatter={(value, name) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return [`${value} (${pct}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-app-text">{total}</span>
          <span className="text-xs text-app-text-muted">Total Assets</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.name} className="flex items-center justify-between text-xs text-app-text-secondary">
              <span className="flex items-center gap-2 truncate">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-app-text-muted">
                {item.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
