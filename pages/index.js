import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ModuleGrid from "../components/ModuleGrid";
import { Boxes, Users, TrendingUp, Layers, ArrowRight, Zap } from "lucide-react";

function Home() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="app-page min-h-screen">
      <Head>
        <title>OPTAIMYZE Portal</title>
        <meta
          name="description"
          content="EPC-ready project, vendor and material management for engineering, construction, and commissioning teams."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header is provided globally by AppLayout; page-level header removed */}

      <main>
        {mounted && session ? (
          <ModuleGrid />
        ) : (
          <div className="relative overflow-hidden">
            {/* Glowing Backdrop Orbs */}
            <div className="absolute top-10 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[80px] animate-pulse"></div>
            <div className="absolute top-40 right-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse duration-4000"></div>
            <div className="absolute bottom-10 left-1/3 -z-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-[90px]"></div>

            {/* Hero Section */}
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-32">
              <div className="text-center space-y-8 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-app-accent/30 bg-app-accent-soft/20 px-4 py-1.5 text-xs font-semibold text-app-accent tracking-wide uppercase shadow-sm">
                  <Zap size={14} className="animate-bounce" />
                  Digital EPC Management Center
                </div>
                
                <h1 className="text-4xl font-extrabold tracking-tight text-app-text sm:text-6xl lg:text-7xl leading-tight">
                  One portal for project, vendor & material management
                  <span className="block mt-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 drop-shadow">
                    across any ERP source.
                  </span>
                </h1>
                
                <p className="text-lg leading-8 text-app-text-secondary max-w-2xl mx-auto">
                  Connect engineering, procurement, construction, and commissioning workflows with a clean, modern interface that works on top of SAP, Tally, Excel and more.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row justify-center items-center">
                  <Link href="/auth/register" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-app-accent px-8 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-app-accent-hover transition-all hover:scale-[1.02] transform">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  <Link href="#features" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-app-border bg-app-surface px-8 py-4 text-sm font-bold text-app-text hover:border-app-accent hover:bg-app-surface-muted transition-all">
                    Explore Features
                  </Link>
                </div>
              </div>
            </div>

            {/* Core Capabilities Section */}
            <section id="features" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
              <div className="space-y-4 text-center max-w-2xl mx-auto">
                <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-app-accent">Core Capabilities</span>
                <h2 className="text-3xl font-bold text-app-text sm:text-4xl">Designed for every stage of EPC execution</h2>
                <p className="text-app-text-secondary text-sm sm:text-base">
                  From bids and vendor onboarding to materials planning and site commissioning, the portal makes complex EPC operations transparent.
                </p>
              </div>

              {/* 3D Cards Grid */}
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1 */}
                <div className="group relative bg-app-surface/85 dark:bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-border p-6 shadow-md hover:border-app-accent hover:shadow-cyan-500/10 hover:-translate-y-3 hover:scale-[1.02] transition-all duration-300 transform-gpu flex flex-col justify-between h-72">
                  <div>
                    <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 dark:bg-gradient-to-br dark:from-cyan-500/10 dark:to-blue-500/5 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-app-text">Project Controls</h3>
                    <p className="mt-2 text-xs leading-5 text-app-text-secondary line-clamp-4">
                      Track milestones, schedules and budgets in one place with real-time clarity for engineering and construction teams.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 group-hover:text-cyan-500 dark:group-hover:text-cyan-300">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Card 2 */}
                <div className="group relative bg-app-surface/85 dark:bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-border p-6 shadow-md hover:border-app-accent hover:shadow-emerald-500/10 hover:-translate-y-3 hover:scale-[1.02] transition-all duration-300 transform-gpu flex flex-col justify-between h-72">
                  <div>
                    <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 dark:bg-gradient-to-br dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-app-text">Vendor Intelligence</h3>
                    <p className="mt-2 text-xs leading-5 text-app-text-secondary line-clamp-4">
                      Assess suppliers, manage contracts and monitor delivery performance across procurement and quality workflows.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-300">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Card 3 */}
                <div className="group relative bg-app-surface/85 dark:bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-border p-6 shadow-md hover:border-app-accent hover:shadow-purple-500/10 hover:-translate-y-3 hover:scale-[1.02] transition-all duration-300 transform-gpu flex flex-col justify-between h-72">
                  <div>
                    <div className="inline-flex p-3 rounded-xl bg-purple-500/10 dark:bg-gradient-to-br dark:from-purple-500/10 dark:to-indigo-500/5 border border-purple-500/20 text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Boxes className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-app-text">Materials Control</h3>
                    <p className="mt-2 text-xs leading-5 text-app-text-secondary line-clamp-4">
                      Coordinate material receipts, issue tracking and stock planning with precision for on-time delivery.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:text-purple-500 dark:group-hover:text-purple-300">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Card 4 */}
                <div className="group relative bg-app-surface/85 dark:bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-border p-6 shadow-md hover:border-app-accent hover:shadow-amber-500/10 hover:-translate-y-3 hover:scale-[1.02] transition-all duration-300 transform-gpu flex flex-col justify-between h-72">
                  <div>
                    <div className="inline-flex p-3 rounded-xl bg-amber-500/10 dark:bg-gradient-to-br dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-app-text">Tracking & Timelines</h3>
                    <p className="mt-2 text-xs leading-5 text-app-text-secondary line-clamp-4">
                      Keep testing and handover activities aligned with engineering, procurement and project control workflows.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:text-amber-500 dark:group-hover:text-amber-300">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </section>

            {/* Workflow / Stepper Section */}
            <section id="workflow" className="py-24 bg-app-surface/10 border-y border-app-border/40">
              <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
                <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] items-center">
                  <div className="space-y-6">
                    <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-app-accent">Unified Flow</span>
                    <h2 className="text-3xl font-bold text-app-text sm:text-4xl">Fast integration, low disruption</h2>
                    <p className="text-sm sm:text-base text-app-text-secondary leading-7">
                      Use the portal alongside your existing ERP or spreadsheet workflows. Map structured data once, then manage all project, vendor and material details from a single modern dashboard.
                    </p>
                  </div>

                  {/* Stepper Node list */}
                  <div className="relative border-l-2 border-dashed border-app-border/60 pl-8 ml-4 space-y-8">
                    {/* Step 1 */}
                    <div className="relative group">
                      <div className="absolute -left-12 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-500 text-cyan-600 dark:text-cyan-400 text-xs font-bold shadow-md shadow-cyan-500/10 group-hover:scale-110 transition-transform">
                        1
                      </div>
                      <h4 className="text-base font-bold text-app-text group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Connect data sources</h4>
                      <p className="text-xs text-app-text-secondary mt-1 leading-5">Pull structured data from SAP, Tally, Excel or any ERP-like system without forcing a painful migration.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative group">
                      <div className="absolute -left-12 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-md shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                        2
                      </div>
                      <h4 className="text-base font-bold text-app-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Align department teams</h4>
                      <p className="text-xs text-app-text-secondary mt-1 leading-5">Keep engineering, procurement and contractors speaking from the same project and material plan.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative group">
                      <div className="absolute -left-12 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-500 text-purple-600 dark:text-purple-400 text-xs font-bold shadow-md shadow-purple-500/10 group-hover:scale-110 transition-transform">
                        3
                      </div>
                      <h4 className="text-base font-bold text-app-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Reduce execution risks</h4>
                      <p className="text-xs text-app-text-secondary mt-1 leading-5">Surface vendor, schedule and material gaps early so execution stays on track.</p>
                    </div>

                    {/* Step 4 */}
                    <div className="relative group">
                      <div className="absolute -left-12 top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-500 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-md shadow-amber-500/10 group-hover:scale-110 transition-transform">
                        4
                      </div>
                      <h4 className="text-base font-bold text-app-text group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Deploy and configure quickly</h4>
                      <p className="text-xs text-app-text-secondary mt-1 leading-5">Begin using the portal with existing data and minimal IT overhead.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Who Benefits Section */}
            <section id="who" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
              <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
                <div className="space-y-6">
                  <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-app-accent">Target Audience</span>
                  <h2 className="text-3xl font-bold text-app-text sm:text-4xl">From small EPC offices to large project controls teams</h2>
                  <p className="text-sm sm:text-base text-app-text-secondary leading-7">
                    Whether your team runs a single project or multiple sites across oil & gas, power, water and infrastructure, this portal brings consistency to engineering, procurement and commissioning work.
                  </p>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="bg-app-surface/85 dark:bg-app-surface/30 border border-app-border p-6 rounded-2xl shadow-sm hover:border-app-accent transition-colors">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">Design & Eng</span>
                    <h4 className="text-base font-bold text-app-text mt-3">Design & Engineering</h4>
                    <p className="text-xs text-app-text-secondary mt-2 leading-5">Keep document status, approvals and engineering deliverables in sync with the project plan.</p>
                  </div>

                  <div className="bg-app-surface/85 dark:bg-app-surface/30 border border-app-border p-6 rounded-2xl shadow-sm hover:border-app-accent transition-colors">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Construction</span>
                    <h4 className="text-base font-bold text-app-text mt-3">Construction & Testing</h4>
                    <p className="text-xs text-app-text-secondary mt-2 leading-5">Monitor material arrivals, site activities and pre-commissioning checks with confidence.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA section */}
            <section id="contact" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
              <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-950/60 border border-slate-200 dark:border-app-border p-8 md:p-12 shadow-xl dark:shadow-2xl text-center space-y-6">
                {/* Inner radial gradient light */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-72 rounded-full bg-cyan-500/5 blur-[70px]"></div>
                
                <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-indigo-600 dark:text-app-accent">Ready to Start?</span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-app-text sm:text-4xl max-w-2xl mx-auto">
                  Launch your EPC management portal with a simple sign up.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-app-text-secondary max-w-xl mx-auto leading-6">
                  Start with your existing ERP or spreadsheet data and begin managing projects, vendors and materials in one modern, lightweight portal.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                  <Link href="/auth/register" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 dark:bg-none dark:bg-app-accent px-8 py-3.5 text-sm font-bold text-white dark:text-slate-950 shadow-lg shadow-cyan-500/20 hover:opacity-90 dark:hover:bg-app-accent-hover transition-all">
                    Register Now
                  </Link>
                  <Link href="/auth/login" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-app-border bg-white dark:bg-app-surface px-8 py-3.5 text-sm font-bold text-slate-700 dark:text-app-text hover:bg-slate-50 dark:hover:bg-app-surface-muted transition-all">
                    Sign In
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-app-border bg-app-bg/95 px-6 py-10 text-app-text-muted sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-app-accent">OPTAIMYZE Portal</p>
            <p className="max-w-2xl text-sm leading-6 text-app-text-muted">
              A modern portal for EPC project teams, built to work seamlessly with existing ERP systems and structured data sources.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-app-text-muted">
            <a href="#features" className="hover:text-app-text transition">Features</a>
            <a href="#workflow" className="hover:text-app-text transition">Workflow</a>
            <a href="#who" className="hover:text-app-text transition">Who it serves</a>
              <Link href="/auth/login" className="rounded-full bg-app-surface px-4 py-2 text-xs font-semibold text-app-text transition hover:bg-app-surface">
                Sign in
              </Link>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

