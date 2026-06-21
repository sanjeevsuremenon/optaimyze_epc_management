import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { moduleDashboards } from "./moduleData";

export default function ModuleDashboardPage({ currentModuleKey }) {
  const { data: session } = useSession();
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

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <div className="app-card rounded-[2rem] p-8 shadow-md">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-app-accent">{currentModule.label} Hub</p>
                <h1 className="text-4xl font-semibold text-app-text">{currentModule.label} Dashboard</h1>
                <p className="max-w-3xl text-lg leading-8 text-app-text-secondary">
                  {currentModule.description} Use the cards below to open the pages you already know, or
                  switch modules using the navigation above.
                </p>
              </div>
            </div>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {currentModule.sublinks
                .filter((link) => !link.adminOnly || session?.user?.role === "admin")
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group app-card rounded-3xl p-6 transition hover:border-app-accent hover:shadow-md"
                  >
                    <p className="text-lg font-semibold text-app-text group-hover:text-app-accent">
                      {link.label}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-app-text-muted">
                      Open the current page for {link.label.toLowerCase()} details and actions.
                    </p>
                  </Link>
                ))}
            </section>
          </div>

          <aside className="app-card space-y-6 rounded-[2rem] p-8 shadow-md">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-app-accent">Quick actions</p>
              <h2 className="text-2xl font-semibold text-app-text">Jump to a related workflow</h2>
              <p className="text-sm leading-7 text-app-text-muted">
                The module navigation above gives you fast access to sub-pages and the other core modules
                in the portal.
              </p>
            </div>
            <div className="grid gap-4">
              <Link href={currentModule.href} className="app-btn-primary rounded-2xl px-5 py-4 text-center">
                Return to {currentModule.label} dashboard
              </Link>
              <Link
                href="/"
                className="app-btn-secondary rounded-2xl px-5 py-4 text-center hover:border-app-accent hover:text-app-accent"
              >
                Back to home
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
