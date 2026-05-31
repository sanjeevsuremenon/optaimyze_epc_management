import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FiMenu } from 'react-icons/fi';
import {
  faRightFromBracket,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { moduleDashboards } from "./moduleData";

export default function ModuleHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeModuleKey, setActiveModuleKey] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intelligent module detection based on current path
  useEffect(() => {
    let detectedKey = null;
    const path = router.pathname;

    for (const [key, module] of Object.entries(moduleDashboards)) {
      if (path === module.href || path.startsWith(module.href + "/")) {
        detectedKey = key;
        break;
      }
      if (module.sublinks.some((link) => path === link.href || path.startsWith(link.href + "/"))) {
        detectedKey = key;
        break;
      }
    }
    
    // Fallback to the first matching base path if exact/sublink match isn't found
    if (!detectedKey) {
        for (const [key, module] of Object.entries(moduleDashboards)) {
             // Basic generic matching for things like root modules that might share prefixes
             if(path.includes(key)) {
                 detectedKey = key;
                 break;
             }
        }
    }

    setActiveModuleKey(detectedKey);
  }, [router.pathname]);

  const navigationModules = Object.values(moduleDashboards);
  const currentModule = activeModuleKey ? moduleDashboards[activeModuleKey] : null;

  return (
    <header className="sticky top-0 z-50 flex flex-col border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      
      {/* Tier 1: Logo, Main Modules, User Profile */}
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
        
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-3 py-2 text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500 text-lg font-bold text-slate-950">
              J
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">OPTAIMYZE</p>
              <p className="text-[10px] text-slate-400">EPC Management</p>
            </div>
          </Link>
        </div>

        {/* Middle: Main Modules (Only show if logged in) */}
        {mounted && session && (
          <nav className="hidden xl:flex flex-1 items-center justify-center gap-1 mx-4">
            {navigationModules.map((module) => (
              <Link
                key={module.key}
                href={module.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${
                  module.key === activeModuleKey
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {module.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            aria-label="Toggle sidebar"
            onClick={() => {
              try {
                const cur = localStorage.getItem('opt_sidebar_open');
                const next = cur === 'true' ? 'false' : 'true';
                localStorage.setItem('opt_sidebar_open', next);
                window.dispatchEvent(new StorageEvent('storage', { key: 'opt_sidebar_open', newValue: next }));
              } catch (e) {
                // ignore
              }
            }}
            className="xl:hidden inline-flex items-center justify-center rounded-md p-2 bg-slate-800/60 text-slate-200 hover:bg-slate-800"
          >
            <FiMenu size={20} />
          </button>

          {mounted && session ? (
            <div className="flex items-center gap-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 shadow-sm shadow-slate-950/10 border border-slate-800">
              <FontAwesomeIcon icon={faUserCircle} className="text-cyan-400 text-lg" />
              <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
                <span className="font-medium text-slate-100 text-xs">{session.user?.name || session.user?.email}</span>
                {session.user?.role && (
                  <span className="text-[9px] font-bold text-slate-950 bg-cyan-400 px-1.5 rounded-sm uppercase tracking-widest mt-0.5">
                    {session.user.role}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
                title="Sign Out"
                className="inline-flex items-center justify-center rounded-full bg-rose-500/10 p-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-600 hover:text-white"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/auth/login" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Sign In
              </Link>
              <Link href="/auth/register" className="rounded-full border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-white">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Sub-links (Only show if logged in and a module is active) */}
      {mounted && session && currentModule && currentModule.sublinks && currentModule.sublinks.length > 0 && (
        <div className="w-full border-t border-slate-800/50 bg-slate-900/50">
          <div className="mx-auto flex w-full max-w-[1400px] overflow-x-auto px-4 py-2 lg:px-8 custom-scrollbar">
            <nav className="flex items-center gap-2">
              {currentModule.sublinks
                .filter(link => !link.adminOnly || session?.user?.role === "admin")
                .map((link) => {
                  const isActive = router.asPath === link.href || router.asPath.startsWith(link.href + "?") || router.asPath.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
            </nav>
          </div>
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              height: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #334155;
              border-radius: 20px;
            }
          `}</style>
        </div>
      )}
    </header>
  );
}
