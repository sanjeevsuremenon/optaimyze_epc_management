import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ModuleGrid from "../components/ModuleGrid";
import LandingPage from "../components/landing/LandingPage";

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
          <LandingPage />
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

