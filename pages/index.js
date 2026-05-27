import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ModuleGrid from "../components/ModuleGrid";

function Home() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-8">
                <div className="max-w-xl space-y-3">
                  <p className="inline-flex rounded-full bg-cyan-500/15 px-4 py-1 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-500/15">
                    Built for EPC teams in oil, gas, power, water and infrastructure
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    One portal for project, vendor and material management across any ERP or structured data source.
                  </h1>
                  <p className="text-lg leading-8 text-slate-300">
                    Connect engineering, procurement, construction, testing and commissioning workflows with a clean, modern interface that works on top of SAP, Tally, Excel and more.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href="/auth/register" className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
                      Start free trial
                  </Link>
                  <Link href="#features" className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
                      Explore features
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
                <div className="space-y-6">
                  <div className="rounded-3xl bg-slate-950/70 p-6 text-slate-100 ring-1 ring-white/10">
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Platform overview</p>
                    <h2 className="mt-4 text-2xl font-semibold text-white">EPC digital control center</h2>
                    <p className="mt-3 text-slate-400">
                      Manage project budgets, vendor performance, material flow and approvals without replacing your ERP.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-300 ring-1 ring-white/10">
                      <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">ERP-agnostic</p>
                      <p className="mt-3 font-semibold text-white">Works with SAP, Tally, Excel, and any structured source.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-300 ring-1 ring-white/10">
                      <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Fast adoption</p>
                      <p className="mt-3 font-semibold text-white">Minimal training for project, procurement and engineering teams.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="features" className="mt-24 space-y-10">
              <div className="space-y-3 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Core capabilities</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">Designed for every stage of EPC execution</h2>
                <p className="mx-auto max-w-2xl text-base leading-8 text-slate-400">
                  From bids and vendor on-boarding to materials planning and site commissioning, the portal makes complex EPC operations transparent and actionable.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:border-cyan-500/40">
                  <p className="text-2xl font-semibold text-white">Project Management</p>
                  <p className="text-sm leading-7 text-slate-400">
                    Track milestones, schedules and budgets in one place with real-time clarity for engineering and construction teams.
                  </p>
                </div>
                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:border-cyan-500/40">
                  <p className="text-2xl font-semibold text-white">Vendor Management</p>
                  <p className="text-sm leading-7 text-slate-400">
                    Assess suppliers, manage contracts and monitor delivery performance across procurement and quality workflows.
                  </p>
                </div>
                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:border-cyan-500/40">
                  <p className="text-2xl font-semibold text-white">Materials Control</p>
                  <p className="text-sm leading-7 text-slate-400">
                    Coordinate material receipts, issue tracking and stock planning with precision for on-time delivery.
                  </p>
                </div>
                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:border-cyan-500/40">
                  <p className="text-2xl font-semibold text-white">Commissioning Support</p>
                  <p className="text-sm leading-7 text-slate-400">
                    Keep testing and handover activities aligned with engineering, procurement and project control workflows.
                  </p>
                </div>
              </div>
            </section>

            <section id="workflow" className="mt-24 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">How it works</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">Fast integration, low disruption</h2>
                <p className="max-w-xl text-base leading-8 text-slate-400">
                  Use the portal alongside your existing ERP or spreadsheet workflows. Map structured data once, then manage all project, vendor and material details from a single modern dashboard.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/80 p-6 ring-1 ring-white/10">
                  <p className="font-semibold text-white">Connect data sources</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Pull structured data from SAP, Tally, Excel or any ERP-like system without forcing a painful migration.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-6 ring-1 ring-white/10">
                  <p className="font-semibold text-white">Align teams</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Keep engineering, procurement and contractors speaking from the same project and material plan.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-6 ring-1 ring-white/10">
                  <p className="font-semibold text-white">Reduce risk</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Surface vendor, schedule and material gaps early so execution stays on track.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-6 ring-1 ring-white/10">
                  <p className="font-semibold text-white">Deploy quickly</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Begin using the portal with existing data and minimal IT overhead.</p>
                </div>
              </div>
            </section>

            <section id="who" className="mt-24 rounded-[2rem] border border-slate-800 bg-slate-900/80 px-8 py-12 shadow-2xl shadow-slate-950/20">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Who benefits</p>
                  <h2 className="text-3xl font-semibold text-white sm:text-4xl">From small EPC offices to large project controls teams</h2>
                  <p className="max-w-xl text-base leading-8 text-slate-400">
                    Whether your team runs a single project or multiple sites across oil & gas, petrochemical, power, water and infrastructure, this portal brings consistency to engineering, procurement and commissioning work.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950/80 p-6 ring-1 ring-white/10">
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Design & Engineering</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">Keep document status, approvals and engineering deliverables in sync with the project plan.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-6 ring-1 ring-white/10">
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Construction & Testing</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">Monitor material arrivals, site activities and pre-commissioning checks with confidence.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="contact" className="mt-24 rounded-[2rem] border border-cyan-500/20 bg-cyan-500/10 px-8 py-12 text-slate-100">
              <div className="max-w-4xl space-y-6 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Ready to move forward?</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">Launch your EPC management portal with a simple sign up.</h2>
                <p className="mx-auto max-w-2xl text-base leading-8 text-slate-200">
                  Start with your existing ERP or spreadsheet data and begin managing projects, vendors and materials in one modern, lightweight portal.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/auth/register" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/10 transition hover:bg-slate-100">
                      Register now
                  </Link>
                  <Link href="/auth/login" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                      Sign in
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/95 px-6 py-10 text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">OPTAIMYZE Portal</p>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              A modern portal for EPC project teams, built to work seamlessly with existing ERP systems and structured data sources.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workflow" className="hover:text-white transition">Workflow</a>
            <a href="#who" className="hover:text-white transition">Who it serves</a>
              <Link href="/auth/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
                Sign in
              </Link>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

