import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FiMenu } from "react-icons/fi";
import { faRightFromBracket, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import ThemeToggle from "./ThemeToggle";

export default function ModuleHeader() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-[var(--app-header-bg)] shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-2.5 shadow-sm transition hover:border-app-accent hover:shadow-md"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-app-accent text-base font-bold text-app-accent-text">
              J
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-app-text">
                OPTAIMYZE PORTAL
              </p>
              <p className="text-xs text-app-text-muted">EPC Management, simplified</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />

          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => {
              try {
                const cur = localStorage.getItem("opt_sidebar_open");
                const next = cur === "true" ? "false" : "true";
                localStorage.setItem("opt_sidebar_open", next);
                window.dispatchEvent(
                  new StorageEvent("storage", { key: "opt_sidebar_open", newValue: next })
                );
              } catch (e) {
                // ignore
              }
            }}
            className="inline-flex items-center justify-center rounded-lg border border-app-border bg-app-surface p-2 text-app-text-secondary transition hover:bg-app-surface-muted hover:text-app-text"
          >
            <FiMenu />
          </button>

          {mounted && session ? (
            <div className="flex items-center gap-3 rounded-full border border-app-border bg-app-surface px-4 py-2 text-sm text-app-text-secondary shadow-sm">
              <FontAwesomeIcon icon={faUserCircle} className="text-app-accent" />
              <span>{session.user?.name || session.user?.email}</span>
              <button
                type="button"
                onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
                className="sign-out-btn"
              >
                <FontAwesomeIcon icon={faRightFromBracket} /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/auth/login" className="app-btn-primary rounded-full px-4 py-2">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full border border-app-border px-4 py-2 text-sm font-semibold text-app-accent transition hover:border-app-accent hover:bg-app-accent-soft"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
