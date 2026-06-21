export function KpiCard({
  label,
  value,
  subLabel,
  icon: Icon,
  iconBgClass,
  iconClass,
  valueClass = "text-slate-900",
  urgent = false,
  loading = false,
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
        urgent ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBgClass} ${
            urgent ? "animate-pulse" : ""
          }`}
        >
          <Icon className={`h-5 w-5 ${iconClass}`} aria-hidden />
        </div>
      </div>
      <p className={`mt-4 text-4xl font-bold tabular-nums ${valueClass}`}>
        {loading ? "…" : value}
      </p>
      <p className="mt-1 text-[13px] text-app-text-muted">{loading ? "Loading…" : subLabel}</p>
    </div>
  );
}
