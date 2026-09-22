import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { GlassStyles, Tilt } from "./landing/glass";

const ACCENT_TEXT = {
  cyan: "text-cyan-600 dark:text-cyan-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  rose: "text-rose-600 dark:text-rose-400",
};
const ACCENT_CHIP = {
  cyan: "bg-cyan-500/10 border-cyan-500/20",
  emerald: "bg-emerald-500/10 border-emerald-500/20",
  violet: "bg-violet-500/10 border-violet-500/20",
  amber: "bg-amber-500/10 border-amber-500/20",
  sky: "bg-sky-500/10 border-sky-500/20",
  indigo: "bg-indigo-500/10 border-indigo-500/20",
  rose: "bg-rose-500/10 border-rose-500/20",
};

/**
 * Compact glass hero for data sub-pages (lists, explorers, evaluations).
 * Shows title + live data chips fetched from /api/dashboard/stats?module=<moduleKey>.
 */
export default function GlassSubPageHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  accent = "cyan",
  moduleKey,
  children,
}) {
  const [chips, setChips] = useState(null);

  useEffect(() => {
    if (!moduleKey) return;
    let cancelled = false;
    fetch(`/api/dashboard/stats?module=${encodeURIComponent(moduleKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setChips(data.stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [moduleKey]);

  return (
    <div style={{ animation: "fadeInUp 0.5s ease-out both" }}>
      <GlassStyles />
      <Tilt glow={accent}>
        <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            {Icon && (
              <div
                className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${ACCENT_CHIP[accent]}`}
              >
                <Icon size={20} strokeWidth={2.2} className={ACCENT_TEXT[accent]} />
              </div>
            )}
            <div className="space-y-1">
              {eyebrow && (
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${ACCENT_TEXT[accent]}`}>
                  {eyebrow}
                </p>
              )}
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {title}
              </h1>
              {description && (
                <p className="max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-400 sm:text-sm sm:leading-6">
                  {description}
                </p>
              )}
              {moduleKey && (
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {chips === null && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/60 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                      Loading live data…
                    </span>
                  )}
                  {chips?.map((chip) => (
                    <span
                      key={chip}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums ${ACCENT_CHIP[accent]} ${ACCENT_TEXT[accent]}`}
                    >
                      <Sparkles size={11} className="mr-1.5" />
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
        </div>
      </Tilt>
    </div>
  );
}
