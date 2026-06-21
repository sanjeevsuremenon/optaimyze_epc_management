import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiChevronDown, FiChevronRight, FiChevronLeft, FiMenu } from "react-icons/fi";

function prettify(path) {
  if (!path) return "";
  const out = path.split("/").filter(Boolean).slice(-1)[0] || path;
  return out.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const MODULES = [
  {
    id: "projects",
    label: "Projects",
    subs: [
      { label: "Projects", path: "/projects" },
      { label: "Projects (new)", path: "/projects1" },
      { label: "Project Dashboard", path: "/projectsdashboard" },
    ],
  },
  {
    id: "purchaseorders",
    label: "Purchase Orders",
    subs: [
      { label: "PO Search", path: "/purchaseordersearch" },
      { label: "Purchase Orders", path: "/purchaseorders" },
      { label: "POs Dashboard", path: "/purchaseordersdashboard" },
    ],
  },
  {
    id: "vendors",
    label: "Vendors",
    subs: [
      { label: "Vendors", path: "/vendors1" },
      { label: "Vendor Dashboard", path: "/vendor-dashboard" },
      { label: "Non SAP Vendors", path: "/nonsapvendors" },
      { label: "Vendor Feedback", path: "/vendor-feedback" },
      { label: "Vendor Evaluation", path: "/vendorevaluation/webformat" },
    ],
  },
  {
    id: "materials",
    label: "Materials",
    subs: [
      { label: "Materials", path: "/materials" },
      { label: "Materials (alt)", path: "/materials1" },
      { label: "Material Groups", path: "/material-groups" },
      { label: "Material Dashboard", path: "/materialsdashboard" },
    ],
  },
  { id: "tracking", label: "Tracking", subs: [{ label: "Tracking", path: "/tracking" }] },
  {
    id: "reports",
    label: "Reports",
    subs: [
      { label: "All Purchases", path: "/all-purchases-report" },
      { label: "Import Purchases", path: "/import-purchases-report" },
      { label: "Domestic Purchases", path: "/domestic-purchases-report" },
    ],
  },
  {
    id: "assets",
    label: "Asset Management",
    subs: [
      { label: "Dashboard", path: "/assetdashboard" },
      { label: "Asset Masters", path: "/assetmanagement/masters" },
      { label: "MME Equipment", path: "/assets/mme" },
      { label: "Fixed Assets", path: "/assets/fixedassets" },
      { label: "Assets Dashboard", path: "/assets/dashboard" },
      { label: "Global Masters", path: "/global-masters" },
    ],
  },
  {
    id: "globalmasters",
    label: "Global Masters",
    subs: [{ label: "Global Masters", path: "/global-masters" }],
  },
];

export default function SidebarLayout({ children }) {
  const router = useRouter();
  const [openModule, setOpenModule] = useState(() => {
    const match = MODULES.find((m) => m.subs.some((s) => router.pathname.startsWith(s.path)));
    return match ? match.id : MODULES[0].id;
  });
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    try {
      const cur = localStorage.getItem("opt_sidebar_open");
      setShowSidebar(cur !== "false");
    } catch (e) {
      setShowSidebar(true);
    }

    const onStorage = (e) => {
      if (e.key === "opt_sidebar_open") {
        setShowSidebar(e.newValue !== "false");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleModuleClick = (id) => setOpenModule((prev) => (prev === id ? null : id));

  const isActivePath = (path) =>
    router.pathname === path || router.pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-bg text-app-text">
      <div className="flex">
        {showSidebar && (
          <aside className="hidden w-[260px] shrink-0 border-r border-app-border bg-[var(--app-sidebar-bg)] p-4 md:block">
            <div className="mb-6 px-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-app-text-disabled">
                  Modules
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSidebar(false);
                    localStorage.setItem("opt_sidebar_open", "false");
                  }}
                  className="flex items-center justify-center rounded p-1 text-app-text-muted transition hover:bg-app-surface-muted hover:text-app-text"
                  title="Collapse Sidebar"
                >
                  <FiChevronLeft size={18} />
                </button>
              </div>
              {MODULES.map((mod) => (
                <div key={mod.id} className="mb-2">
                  <button
                    type="button"
                    onClick={() => handleModuleClick(mod.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-app-surface-muted ${
                      openModule === mod.id ? "bg-app-surface-muted font-semibold text-app-text" : "text-app-text-secondary"
                    }`}
                  >
                    <span>{mod.label}</span>
                    <span className="text-app-text-muted">
                      {openModule === mod.id ? <FiChevronDown /> : <FiChevronRight />}
                    </span>
                  </button>
                  {openModule === mod.id && (
                    <div className="mt-1 ml-2 border-l border-app-border-light pl-3">
                      {mod.subs.map((s) => (
                        <Link
                          key={s.path}
                          href={s.path}
                          className={`block rounded-lg px-3 py-2 text-sm transition hover:bg-app-surface-muted ${
                            isActivePath(s.path)
                              ? "border-l-2 border-app-accent bg-app-accent-soft font-medium text-app-accent"
                              : "text-app-text-muted hover:text-app-text"
                          }`}
                        >
                          {s.label || prettify(s.path)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-app-border px-2 pt-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-app-text-disabled">
                Other Modules
              </div>
              {MODULES.filter((m) => m.id !== openModule).map((mod) => (
                <Link
                  key={mod.id}
                  href={mod.subs?.[0]?.path || "#"}
                  className="mb-1 block rounded-lg px-3 py-2 text-sm text-app-text-muted transition hover:bg-app-surface-muted hover:text-app-text"
                >
                  {mod.label}
                </Link>
              ))}
            </div>
          </aside>
        )}

        <div className={`relative flex-1 p-4 sm:p-6 ${showSidebar ? "" : "pl-14"}`}>{children}</div>

        {!showSidebar && (
          <button
            type="button"
            onClick={() => {
              setShowSidebar(true);
              localStorage.setItem("opt_sidebar_open", "true");
            }}
            className="absolute top-6 left-4 z-40 flex items-center justify-center rounded-lg border border-app-border bg-app-surface p-2 text-app-text-muted shadow-md transition hover:scale-105 hover:bg-app-surface-muted hover:text-app-text active:scale-95"
            title="Show Sidebar"
          >
            <FiMenu size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
