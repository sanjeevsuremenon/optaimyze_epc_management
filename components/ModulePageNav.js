import Link from "next/link";
import { useRouter } from "next/router";
import { moduleDashboards } from "./moduleData";

export default function ModulePageNav({ currentModuleKey }) {
  const router = useRouter();
  const currentModule = moduleDashboards[currentModuleKey] || moduleDashboards.projects;
  const navigationModules = Object.values(moduleDashboards);

  return (
    <div className="sticky top-[88px] z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Module dashboard</p>
            <h2 className="text-2xl font-semibold text-white">{currentModule.label}</h2>
            <p className="max-w-2xl text-sm text-slate-400">{currentModule.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {navigationModules.map((module) => (
              <Link
                key={module.key}
                href={module.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  module.key === currentModuleKey
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
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
                    ? "bg-sky-500 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
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
