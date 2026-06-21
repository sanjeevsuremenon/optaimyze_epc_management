import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const SEGMENT_COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#F97316", "#8B5CF6", "#64748B", "#EC4899", "#22C55E"];

export function AssetTypeDistribution({ segments, theme = "light" }) {
  const data =
    segments?.filter((s) => s.value > 0).map((s, i) => ({
      name: s.label || "Unknown",
      value: s.value,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    })) ?? [];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isLight = theme !== "dark";

  if (!data.length) {
    return (
      <div
        className="flex h-[300px] w-full flex-col items-center justify-center"
        aria-label="Asset type distribution chart"
      >
        <div className={`mb-3 h-16 w-16 rounded-full border-4 border-dashed ${isLight ? "border-slate-300" : "border-slate-600"}`} />
        <p className={`text-sm ${isLight ? "text-app-text-muted" : "text-app-text-muted"}`}>No category data yet</p>
        <p className={`mt-1 text-[13px] ${isLight ? "text-app-text-secondary" : "text-slate-600"}`}>
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
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0F172A",
                color: "#FFFFFF",
                borderRadius: 6,
                border: "none",
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
          <span className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-app-text"}`}>{total}</span>
          <span className={`text-xs ${isLight ? "text-app-text-muted" : "text-app-text-muted"}`}>Total Assets</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.name} className="flex items-center justify-between text-xs text-slate-600">
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
