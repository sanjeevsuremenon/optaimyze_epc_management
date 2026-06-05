import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FiMenu } from 'react-icons/fi'
import {
  faRightFromBracket,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function ModuleHeader() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-3 text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-lg font-bold text-slate-950">
              J
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">OPTAIMYZE PORTAL</p>
              <p className="text-xs text-slate-400">EPC Management, simplified</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            aria-label="Toggle sidebar"
            onClick={() => {
              try {
                const cur = localStorage.getItem('opt_sidebar_open');
                const next = cur === 'true' ? 'false' : 'true';
                localStorage.setItem('opt_sidebar_open', next);
                // dispatch storage event for same-tab listeners
                window.dispatchEvent(new StorageEvent('storage', { key: 'opt_sidebar_open', newValue: next }));
              } catch (e) {
                // ignore
              }
            }}
            className="inline-flex items-center justify-center rounded-md p-2 bg-slate-800/60 text-slate-200 hover:bg-slate-800"
          >
            <FiMenu />
          </button>
          {mounted && session ? (
            <div className="flex items-center gap-3 rounded-full bg-slate-900/80 px-4 py-2 text-sm text-slate-200 shadow-sm shadow-slate-950/10">
              <FontAwesomeIcon icon={faUserCircle} className="text-cyan-400" />
              <span>{session.user?.name || session.user?.email}</span>
              <button
                type="button"
                onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                <FontAwesomeIcon icon={faRightFromBracket} /> Sign out
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
    </header>
  );
}
