import Link from "next/link";
import { useRouter } from "next/router";
import { moduleDashboards } from "./moduleData";

export default function ModulePageNav({ currentModuleKey }) {
  const router = useRouter();
  const currentModule = moduleDashboards[currentModuleKey] || moduleDashboards.projects;
  const navigationModules = Object.values(moduleDashboards);

  return (
    <div className="sticky top-[88px] z-40 border-b border-app-border bg-app-bg/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-app-accent">Module dashboard</p>
            <h2 className="text-2xl font-semibold text-app-text">{currentModule.label}</h2>
            <p className="max-w-2xl text-sm text-app-text-muted">{currentModule.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {navigationModules.map((module) => (
              <Link
                key={module.key}
                href={module.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  module.key === currentModuleKey
                    ? "bg-app-accent text-slate-950"
                    : "bg-app-surface text-app-text hover:bg-app-surface-muted"
                }`}
              >
                {module.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentModule.sublinks.map((link) => {
            const isActive = router.asPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-sky-500 text-app-text"
                    : "bg-app-surface text-app-text-secondary hover:bg-app-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
