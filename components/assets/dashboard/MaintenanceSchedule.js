import Link from "next/link";

const URGENCY_STYLES = {
  critical: {
    badge: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
    label: "Critical",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-500",
    label: "Due soon",
  },
  safe: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    label: "On track",
  },
};

function getUrgency(expiryIso) {
  if (!expiryIso) return "safe";
  const days = Math.ceil((new Date(expiryIso).getTime() - Date.now()) / 86400000);
  if (days < 7) return "critical";
  if (days <= 30) return "warning";
  return "safe";
}

function progressPercent(expiryIso) {
  if (!expiryIso) return 0;
  const days = Math.ceil((new Date(expiryIso).getTime() - Date.now()) / 86400000);
  return Math.max(0, Math.min(100, Math.round((days / 30) * 100)));
}

export function MaintenanceSchedule({
  items,
  emptyMessage = "No upcoming calibration expiries in the dataset.",
  viewAllHref,
}) {
  if (!items.length) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-app-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03a2.652 2.652 0 113.802 3.802l-3.03 2.496M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586L11.42 2.34a2.548 2.548 0 013.586 0l4.655 5.653a2.548 2.548 0 010 3.586l-5.653 4.655z" />
          </svg>
        </div>
        <p className="text-sm text-app-text-muted">{emptyMessage}</p>
        <p className="mt-1 text-[13px] text-app-text-secondary">
          Calibration schedules will appear here once configured.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.slice(0, 5).map((item) => {
        const urgency = getUrgency(item.expiryIso);
        const styles = URGENCY_STYLES[urgency];
        const pct = progressPercent(item.expiryIso);

        return (
          <div
            key={item.id}
            className="rounded-lg px-2 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{item.asset}</p>
                {item.assetId && (
                  <p className="text-xs text-app-text-muted">{item.assetId}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
                >
                  {styles.label}
                </span>
                <p className="mt-1 text-xs text-app-text-muted">
                  Expires {item.dateLabel}
                </p>
              </div>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${styles.bar}`}
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        );
      })}
      {viewAllHref && items.length > 0 && (
        <div className="pt-2 text-right">
          <Link href={viewAllHref} className="text-[13px] font-medium text-sky-500 hover:underline">
            View All
          </Link>
        </div>
      )}
    </div>
  );
}
