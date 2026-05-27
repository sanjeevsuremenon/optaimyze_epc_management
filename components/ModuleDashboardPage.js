import Head from "next/head";
import Link from "next/link";
import ModulePageNav from "./ModulePageNav";
import { moduleDashboards } from "./moduleData";

export default function ModuleDashboardPage({ currentModuleKey }) {
  const currentModule = moduleDashboards[currentModuleKey];
  if (!currentModule) return null;

  return (
    <>
      <Head>
        <title>{currentModule.label} Dashboard | OPTAIMYZE Portal</title>
        <meta
          name="description"
          content={`Access dashboards and sub-modules for ${currentModule.label}.`}
        />
      </Head>

      <ModulePageNav currentModuleKey={currentModuleKey} />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{currentModule.label} Hub</p>
                <h1 className="text-4xl font-semibold text-white">{currentModule.label} Dashboard</h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-300">
                  {currentModule.description} Use the cards below to open the pages you already know, or switch modules using the navigation above.
                </p>
              </div>
            </div>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {currentModule.sublinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-3xl border border-slate-800 bg-slate-900/85 p-6 transition hover:border-cyan-500 hover:bg-slate-900"
                >
                  <p className="text-lg font-semibold text-white group-hover:text-cyan-300">
                    {link.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Open the current page for {link.label.toLowerCase()} details and actions.
                  </p>
                </Link>
              ))}
            </section>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Quick actions</p>
              <h2 className="text-2xl font-semibold text-white">Jump to a related workflow</h2>
              <p className="text-sm leading-7 text-slate-400">
                The module navigation above gives you fast access to sub-pages and the other core modules in the portal.
              </p>
            </div>
            <div className="grid gap-4">
              <Link href={currentModule.href} className="rounded-2xl bg-cyan-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Return to {currentModule.label} dashboard
              </Link>
              <Link href="/" className="rounded-2xl border border-slate-700 px-5 py-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-white">
                Back to home
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
