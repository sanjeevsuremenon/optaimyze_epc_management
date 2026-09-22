import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Database,
  Workflow,
  Building2,
  LineChart,
} from "lucide-react";
import { GlassStyles, Tilt } from "./glass";
import {
  ProjectsSvg,
  PurchaseOrdersSvg,
  VendorsSvg,
  MaterialsSvg,
  TrackingSvg,
  ReportsSvg,
  AiSparkSvg,
} from "./illustrations";

/* ------------------------------------------------------------------ */
/*  Motion helpers                                                      */
/* ------------------------------------------------------------------ */

function Reveal({ children, delay = 0, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                       */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 1600) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return [ref, value];
}

function Stat({ value, suffix, label }) {
  const [ref, count] = useCountUp(value);
  return (
    <div ref={ref} className="text-center px-4">
      <div className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-indigo-500 dark:from-cyan-400 dark:to-indigo-400">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero dashboard mockup (pure SVG/JSX product shot)                   */
/* ------------------------------------------------------------------ */

function HeroDashboard() {
  const bars = [42, 68, 38, 82, 56, 92, 64, 74];
  return (
    <div className="hero-shot relative rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden">
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-900/5 dark:border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex-1 max-w-xs mx-auto rounded-md bg-slate-900/5 dark:bg-white/5 px-3 py-1 text-[10px] text-slate-500 dark:text-slate-400 text-center truncate">
          app.optaimyze.com/dashboard
        </div>
      </div>
      <div className="grid grid-cols-[88px_1fr] sm:grid-cols-[104px_1fr]">
        {/* mini sidebar */}
        <div className="border-r border-slate-900/5 dark:border-white/5 p-3 space-y-2">
          {["Projects", "POs", "Vendors", "Stock", "Reports"].map((m, i) => (
            <div
              key={m}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                i === 0
                  ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-700 dark:text-cyan-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {m}
            </div>
          ))}
        </div>
        {/* main panel */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["PO Value", "SAR 4.2M", "text-cyan-600 dark:text-cyan-400"],
              ["Vendors", "51 active", "text-emerald-600 dark:text-emerald-400"],
              ["Stock", "98.2%", "text-indigo-600 dark:text-indigo-400"],
            ].map(([k, v, c]) => (
              <div key={k} className="rounded-xl bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/5 dark:border-white/5 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{k}</div>
                <div className={`text-xs sm:text-sm font-bold ${c}`}>{v}</div>
              </div>
            ))}
          </div>
          {/* animated bar chart */}
          <div className="rounded-xl bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/5 dark:border-white/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Monthly procurement</span>
              <span className="text-[9px] text-slate-400">2026</span>
            </div>
            <svg viewBox="0 0 320 110" className="w-full h-24">
              <defs>
                <linearGradient id="heroBars" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#22d3ee" stopOpacity=".5" />
                  <stop offset="1" stopColor="#6366f1" stopOpacity=".9" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={20 + i * 25} x2="320" y2={20 + i * 25} stroke="#64748b" strokeOpacity=".15" strokeWidth="1" />
              ))}
              {bars.map((h, i) => (
                <rect
                  key={i}
                  x={12 + i * 39}
                  width="22"
                  rx="5"
                  fill="url(#heroBars)"
                  className="hero-bar"
                  style={{ animationDelay: `${i * 90}ms` }}
                  y={105 - h}
                  height={h}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section headings                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({ kicker, title, lead }) {
  return (
    <Reveal className="text-center max-w-2xl mx-auto space-y-4 mb-14">
      <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-400/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
        {kicker}
      </span>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      {lead && <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-7">{lead}</p>}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    title: "Projects",
    desc: "WBS, networks, long-lead packages and project documents in one live view.",
    href: "/projectsdashboard",
    glow: "cyan",
    Svg: ProjectsSvg,
    accent: "text-cyan-600 dark:text-cyan-400",
    chip: "bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  },
  {
    title: "Purchase Orders",
    desc: "Search, track and analyse every PO line, schedule and alert in real time.",
    href: "/purchaseordersdashboard",
    glow: "emerald",
    Svg: PurchaseOrdersSvg,
    accent: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  {
    title: "Vendors",
    desc: "Vendor master, evaluations, feedback and document workflows that build trust.",
    href: "/vendorsdashboard",
    glow: "violet",
    Svg: VendorsSvg,
    accent: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300",
  },
  {
    title: "Materials & Stock",
    desc: "Complete stock, special stock and material standardisation across plants.",
    href: "/materialsdashboard",
    glow: "amber",
    Svg: MaterialsSvg,
    accent: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  {
    title: "Tracking",
    desc: "PR, PO and delivery tracking forms that keep field and office in sync.",
    href: "/trackingdashboard",
    glow: "sky",
    Svg: TrackingSvg,
    accent: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300",
  },
  {
    title: "Reports",
    desc: "Purchases, alerts, lessons learnt and executive dashboards, export-ready.",
    href: "/reportsdashboard",
    glow: "indigo",
    Svg: ReportsSvg,
    accent: "text-indigo-600 dark:text-indigo-400",
    chip: "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect your data",
    desc: "Load SAP, Excel or Tally extracts once — the portal maps them into clean projects, vendors and materials.",
    Icon: Database,
    color: "cyan",
  },
  {
    n: "02",
    title: "Unify your teams",
    desc: "Engineering, procurement and site crews work from the same live plan, alerts and documents.",
    Icon: Workflow,
    color: "emerald",
  },
  {
    n: "03",
    title: "Decide with confidence",
    desc: "Dashboards, reports and the read-only AI DB Agent turn raw records into answers and charts.",
    Icon: LineChart,
    color: "violet",
  },
];

const AUDIENCES = [
  { label: "Design & Engineering", desc: "Deliverables, documents and approvals in sync with the project plan." },
  { label: "Procurement & SCM", desc: "PO visibility, vendor performance and material availability at a glance." },
  { label: "Project Controls", desc: "Budgets, schedules and long-lead tracking with early risk signals." },
  { label: "Site & Commissioning", desc: "Deliveries, testing and handover status flowing back to the office." },
];

/* ------------------------------------------------------------------ */
/*  Landing page                                                        */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="landing-root relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <GlassStyles />

      {/* ============================== HERO ============================== */}
      <section className="relative">
        {/* video backdrop */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-[0.22] dark:opacity-[0.3]"
            autoPlay
            muted
            loop
            playsInline
            poster="/videos/hero-tech-loop-poster.jpg"
          >
            <source src="/videos/hero-tech-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-slate-50 dark:from-slate-950/85 dark:via-slate-950/75 dark:to-slate-950" />
          <div className="absolute inset-0 hero-grid-bg" />
          <div className="blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-400/25 dark:bg-cyan-500/20 blur-[110px]" />
          <div className="blob-2 absolute top-1/3 -right-28 h-[28rem] w-[28rem] rounded-full bg-indigo-400/25 dark:bg-indigo-500/20 blur-[120px]" />
          <div className="blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: copy */}
            <div className="space-y-8">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 shadow-sm">
                  <Sparkles size={14} />
                  Digital EPC Management Center
                  <span className="hidden sm:inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    v2
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <h1 className="text-4xl sm:text-6xl lg:text-[4.2rem] font-extrabold tracking-tight leading-[1.06] text-slate-900 dark:text-white">
                  One liquid portal for{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 dark:from-cyan-400 dark:via-sky-400 dark:to-indigo-400">
                    project, vendor &amp; material
                  </span>{" "}
                  intelligence.
                </h1>
              </Reveal>

              <Reveal delay={0.16}>
                <p className="text-lg leading-8 text-slate-600 dark:text-slate-400 max-w-xl">
                  Optaimyze unifies engineering, procurement, construction and commissioning workflows on top of
                  SAP, Tally and Excel — now with a read-only AI agent that answers questions from your live data.
                </p>
              </Reveal>

              <Reveal delay={0.24}>
                <div className="flex flex-col gap-4 sm:flex-row items-start sm:items-center">
                  <Link
                    href="/auth/register"
                    className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="#modules"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-8 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:-translate-y-0.5"
                  >
                    Explore the Modules
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.32}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" /> Read-only AI, enforced in code
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} className="text-cyan-500" /> Works with SAP / Excel / Tally
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Right: 3D product shot */}
            <Reveal delay={0.2} className="relative">
              <div style={{ animation: "heroFloat 7s ease-in-out infinite" }}>
                <Tilt glow="cyan">
                  <HeroDashboard />
                </Tilt>
              </div>
              {/* floating glass chips */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -top-5 -left-4 sm:-left-8 rounded-2xl border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-2.5 shadow-xl flex items-center gap-2"
              >
                <Sparkles size={15} className="text-amber-500" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-800 dark:text-slate-100">AI DB Agent</div>
                  <div className="text-slate-500 dark:text-slate-400">ask plain-English questions</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-5 -right-3 sm:-right-6 rounded-2xl border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-2.5 shadow-xl flex items-center gap-2"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400" style={{ animation: "pulseRing 1.6s ease-out infinite" }} />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-800 dark:text-slate-100">Live data sync</div>
                  <div className="text-slate-500 dark:text-slate-400">49 POs · 51 vendors · updated now</div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== STATS ============================== */}
      <section className="relative border-y border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Stat value={49} suffix="+" label="Purchase order lines tracked" />
            <Stat value={51} suffix="" label="Vendors onboarded" />
            <Stat value={100} suffix="%" label="Read-only, audited AI access" />
            <Stat value={6} suffix="" label="Integrated EPC modules" />
          </div>
        </div>
      </section>

      {/* ============================== MODULES ============================== */}
      <section id="modules" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            kicker="The Modules"
            title="Everything an EPC team touches, in six glass panes"
            lead="Each module is a live window into your ERP data — no migrations, no duplicates, just clarity."
          />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod, i) => (
              <Reveal key={mod.title} delay={i * 0.06}>
                <Link href={mod.href} className="block h-full group">
                  <Tilt glow={mod.glow} className="h-full">
                    <div className="relative z-10 flex h-full flex-col">
                      <div className={`mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${mod.chip}`}>
                        {mod.title}
                      </div>
                      {/* illustration */}
                      <div className="mb-5 rounded-2xl border border-slate-900/5 dark:border-white/5 bg-slate-900/[0.02] dark:bg-white/[0.03] p-3 transition-transform duration-500 group-hover:scale-[1.03]">
                        <mod.Svg id={`mod-art-${i}`} />
                      </div>
                      <h3 className={`text-lg font-bold ${mod.accent}`}>{mod.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 flex-1">{mod.desc}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:gap-3 transition-all">
                        Open module <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Tilt>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== AI SPOTLIGHT ============================== */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-cyan-500/[0.06] to-indigo-500/[0.08] dark:from-emerald-500/10 dark:via-cyan-500/5 dark:to-indigo-500/10 p-8 md:p-14">
              <div className="blob absolute -top-20 right-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-[90px]" aria-hidden="true" />
              <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                    <Sparkles size={13} /> New · Built-in
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Ask your database anything.{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">
                      Get charts, instantly.
                    </span>
                  </h2>
                  <p className="text-sm sm:text-base leading-7 text-slate-600 dark:text-slate-400 max-w-xl">
                    The DB Agent turns plain English into validated, read-only MongoDB queries — two-step verified,
                    with executive summaries, tables and charts. It can fetch and analyse, but never modify your data.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/db-agent"
                      className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      Try the DB Agent
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <ShieldCheck size={15} className="text-emerald-500" />
                      Find · Aggregate · Count · Distinct — nothing else
                    </span>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl">
                  <AiSparkSvg id="ai-spot" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== WORKFLOW ============================== */}
      <section id="workflow" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            kicker="How it works"
            title="From raw ERP dumps to decisions in three moves"
          />
          <div className="relative grid gap-8 lg:grid-cols-3">
            {/* connector line */}
            <div className="absolute top-10 left-[16%] right-[16%] hidden lg:block h-px bg-gradient-to-r from-cyan-400/50 via-emerald-400/50 to-violet-400/50" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1}>
                <div className="relative text-center px-4">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                    <step.Icon size={30} className={i === 0 ? "text-cyan-500" : i === 1 ? "text-emerald-500" : "text-violet-500"} />
                    <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-[11px] font-extrabold text-white shadow-lg">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 max-w-xs mx-auto">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== AUDIENCE ============================== */}
      <section className="relative py-24 border-y border-slate-200/70 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            kicker="Who it serves"
            title="Built for every desk on the project"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.label} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-3 h-1.5 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{a.label}</h4>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section id="cta" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-indigo-950 p-10 md:p-16 text-center shadow-2xl">
              {/* decorative rings + glow */}
              <svg className="absolute -top-24 -left-24 w-96 h-96 opacity-30" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#22d3ee" strokeOpacity=".5" strokeWidth="1" strokeDasharray="3 6" />
                <circle cx="100" cy="100" r="65" fill="none" stroke="#818cf8" strokeOpacity=".5" strokeWidth="1" />
                <circle cx="100" cy="100" r="40" fill="none" stroke="#34d399" strokeOpacity=".5" strokeWidth="1" strokeDasharray="2 5" />
              </svg>
              <svg className="absolute -bottom-28 -right-24 w-96 h-96 opacity-30" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#818cf8" strokeOpacity=".5" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="#22d3ee" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 6" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-cyan-500/15 blur-[90px]" aria-hidden="true" />

              <div className="relative space-y-6">
                <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Ready when you are
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
                  Launch your EPC command center{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">
                    in a day, not a quarter.
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-7">
                  Bring your existing ERP or spreadsheet data. Start managing projects, vendors and materials in one
                  beautiful, secure portal — the AI agent included.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
                  <Link
                    href="/auth/register"
                    className="group inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    Create your workspace
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 backdrop-blur px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/15 hover:-translate-y-0.5"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
