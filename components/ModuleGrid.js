import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Sparkles, ArrowRight, Sun, Moon } from "lucide-react";
import { moduleCards } from "./moduleData";
import { GlassStyles, Tilt } from "./landing/glass";

const ACCENTS = ["cyan", "emerald", "violet", "amber", "sky", "indigo", "rose", "slate"];
const ACCENT_TEXT = {
  cyan: "text-cyan-600 dark:text-cyan-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-slate-600 dark:text-slate-400",
};
const ACCENT_CHIP = {
  cyan: "bg-cyan-500/10 border-cyan-500/20",
  emerald: "bg-emerald-500/10 border-emerald-500/20",
  violet: "bg-violet-500/10 border-violet-500/20",
  amber: "bg-amber-500/10 border-amber-500/20",
  sky: "bg-sky-500/10 border-sky-500/20",
  indigo: "bg-indigo-500/10 border-indigo-500/20",
  rose: "bg-rose-500/10 border-rose-500/20",
  slate: "bg-slate-500/10 border-slate-500/20",
};

// Bento spans (lg breakpoint, 6-column grid) — varied sizes for a modern mosaic.
const TILE_SPANS = {
  projects: "lg:col-span-2",
  materials: "lg:col-span-2",
  stock: "lg:col-span-2",
  purchaseorders: "lg:col-span-3 lg:row-span-2",
  materialgroups: "lg:col-span-2",
  mattypes: "lg:col-span-2",
  "Inventory Tags": "lg:col-span-2",
  "Material Classification": "lg:col-span-2",
  "Vendor Registration": "lg:col-span-2",
  "Project Management": "lg:col-span-2",
  "Scrap E-bid Marketplace": "lg:col-span-3",
  "Future Module 1": "lg:col-span-3",
  "Future Module 2": "lg:col-span-3",
  "Future Module 3": "lg:col-span-3",
};

const colUnits = (module) => {
  const span = TILE_SPANS[module.key || module.label] || "";
  if (span.includes("col-span-3")) return 3;
  if (span.includes("col-span-2")) return 2;
  return 1;
};

// Stagger delays weighted by bento size: big tiles lead, small tiles trail in grid order.
function computeStagger(cards) {
  let acc = 0;
  return cards.map((c) => {
    const d = Math.min(acc * 0.07, 1.05);
    acc += colUnits(c);
    return d;
  });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function statFor(key, stats) {
  if (!stats || !key) return null;
  switch (key) {
    case "projects":
      return typeof stats.projects === "number" ? plural(stats.projects, "project") : null;
    case "materials":
      return typeof stats.materials === "number" ? plural(stats.materials, "material") : null;
    case "stock": {
      const c = stats.stockComplete;
      const s = stats.stockSpecial;
      if (typeof c !== "number" && typeof s !== "number") return null;
      return plural((c || 0) + (s || 0), "stock line");
    }
    case "purchaseorders": {
      if (typeof stats.poTotal !== "number") return null;
      return typeof stats.poOpen === "number"
        ? `${stats.poOpen} open · ${plural(stats.poTotal, "PO")} total`
        : plural(stats.poTotal, "PO");
    }
    case "vendors": {
      if (typeof stats.vendors !== "number") return null;
      return typeof stats.vendorEvaluations === "number" && stats.vendorEvaluations > 0
        ? `${plural(stats.vendors, "vendor")} · ${stats.vendorEvaluations} evaluated`
        : plural(stats.vendors, "vendor");
    }
    case "projectdocumentss":
      return typeof stats.projectDocuments === "number"
        ? plural(stats.projectDocuments, "document")
        : null;
    case "globalmasters":
      return typeof stats.globalMasters === "number"
        ? `${stats.globalMasters} master records`
        : null;
    case "reports":
      return typeof stats.lessonsLearnt === "number" && stats.lessonsLearnt > 0
        ? `${stats.lessonsLearnt} lessons learnt`
        : null;
    case "materialgroups":
      return typeof stats.materialGroups === "number"
        ? plural(stats.materialGroups, "group")
        : null;
    default:
      return null;
  }
}

function ModuleTile({ module, index, stat, stats, delay }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const isComingSoon = module.href === "#" || module.badge === "Coming Soon";
  const isFeatured = module.key === "purchaseorders";
  const spanClass = TILE_SPANS[module.key || module.label] || "";

  const tile = (
    <Tilt glow={isComingSoon ? "slate" : accent} className={`h-full ${isComingSoon ? "opacity-70" : ""}`}>
      <div
        className="relative z-10 flex h-full flex-col p-5"
        style={{
          animation: `${isFeatured ? "fadeInUpBig 0.7s" : "fadeInUp 0.5s"} cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
        }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg ${ACCENT_CHIP[accent]}`}>
            <FontAwesomeIcon icon={module.icon} className={ACCENT_TEXT[accent]} />
          </div>
          {module.badge && (
            <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {module.badge}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{module.label}</h3>
        {stat && (
          <div className={`mt-1 text-[11px] font-bold tabular-nums ${ACCENT_TEXT[accent]}`}>{stat}</div>
        )}
        {isFeatured && typeof stats?.poValue === "number" && (
          <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-amber-600 dark:text-amber-400">
            <FontAwesomeIcon icon={module.icon} className="text-[10px]" />
            SAR {new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(stats.poValue)} total order value
          </div>
        )}
        <p className={`mt-1.5 flex-1 text-xs leading-5 text-slate-600 dark:text-slate-400 ${isFeatured ? "" : "line-clamp-2"}`}>
          {module.description}
        </p>
        {!isComingSoon && (
          <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 transition-all group-hover:gap-2">
            Open <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </Tilt>
  );

  if (isComingSoon) return <div className={`h-full cursor-default ${spanClass}`}>{tile}</div>;
  return (
    <Link href={module.href} className={`group block h-full ${spanClass}`}>
      {tile}
    </Link>
  );
}

export default function ModuleGrid() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const stagger = computeStagger(moduleCards);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setStats(data.stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const name = session?.user?.name || session?.user?.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour < 18;

  return (
    <div className="landing-root relative overflow-hidden">
      <GlassStyles />

      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 hero-grid-bg" />
        <div className="blob absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 dark:bg-cyan-500/15 blur-[110px]" />
        <div className="blob-2 absolute top-40 -right-28 h-[26rem] w-[26rem] rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-[120px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Greeting banner */}
        <div
          className="mb-8"
          style={{ animation: "fadeInUp 0.5s ease-out both" }}
        >
          <Tilt glow="cyan">
            <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                  {isDaytime ? <Sun size={13} /> : <Moon size={13} />}
                  {today}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {greeting()}, {name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Here&apos;s your EPC command center — every module, one glance away.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/db-agent"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
                >
                  <Sparkles size={14} />
                  Ask the DB Agent
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/reportsdashboard"
                  className="inline-flex items-center rounded-2xl border border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-white/5 px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:-translate-y-0.5 hover:border-cyan-400"
                >
                  View Reports
                </Link>
              </div>
            </div>
          </Tilt>
        </div>

        {/* Module bento grid */}
        <div
          className="grid grid-cols-2 gap-5 lg:grid-cols-6"
          style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
        >
          {moduleCards.map((module, index) => (
            <ModuleTile key={module.label} module={module} index={index} stat={statFor(module.key, stats)} stats={stats} delay={stagger[index]} />
          ))}
        </div>

        {/* Footer note */}
        <div
          className="liquid-glass liquid-glass-slate mt-10 rounded-3xl border p-5 text-center"
          style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }}
        >
          <p className="text-xs text-slate-600 dark:text-slate-400">
            🚀 More modules and features coming soon. Your feedback helps us build better.
          </p>
        </div>
      </section>
    </div>
  );
}
