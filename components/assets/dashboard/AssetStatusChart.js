import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STATUS_COLORS = {
  active: "#0EA5E9",
  "in maintenance": "#F59E0B",
  "in custody": "#10B981",
  retired: "#64748B",
  disposed: "#94A3B8",
};

const FALLBACK_PALETTE = ["#0EA5E9", "#10B981", "#F59E0B", "#F97316", "#8B5CF6", "#64748B", "#94A3B8"];

function colorForStatus(name, index) {
  const key = String(name ?? "").trim().toLowerCase();
  return STATUS_COLORS[key] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export function AssetStatusChart({
  data,
  gridStroke = "#F1F5F9",
  axisStroke = "#64748B",
  emptyLabel = "No status data yet",
}) {
  const hasData = data?.length > 0;

  if (!hasData) {
    return (
      <div
        className="flex h-[320px] w-full flex-col items-center justify-center"
        aria-label="Asset status bar chart"
      >
        <BoxIcon className="mb-3 h-16 w-16 text-app-text-secondary" />
        <p className="text-sm text-app-text-muted">{emptyLabel}</p>
        <p className="mt-1 text-[13px] text-app-text-secondary">
          Assets will appear here once added to the system.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: 320 }} aria-label="Asset status bar chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="0" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: axisStroke, fontSize: 12 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisStroke, fontSize: 12 }}
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0F172A",
              color: "#FFFFFF",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#FFFFFF" }}
            itemStyle={{ color: "#FFFFFF" }}
            formatter={(value) => [value, "Assets"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Assets" maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorForStatus(entry.name, i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BoxIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
