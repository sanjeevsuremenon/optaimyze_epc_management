import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiChevronDown, FiChevronRight, FiChevronLeft, FiMenu, FiX } from "react-icons/fi";

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
      { label: "Project Dashboard", path: "/projectsdashboard" },
      { label: "Projects", path: "/projects" },
      { label: "Projects (Alt)", path: "/projects1" },
      { label: "Open Projects", path: "/openprojects" },
      { label: "Project Details", path: "/projectdetails" },
      { label: "Networks", path: "/projects/networks" },
      { label: "WBS Elements", path: "/projects/wbs" },
      { label: "Project Documents", path: "/projectdocuments" },
      { label: "Documents Dashboard", path: "/projectdocumentsdashboard" },
      { label: "Long Lead Packages", path: "/longleadpackages" },
    ],
  },
  {
    id: "purchaseorders",
    label: "Purchase Orders",
    subs: [
      { label: "POs Dashboard", path: "/purchaseordersdashboard" },
      { label: "PO Search", path: "/purchaseordersearch" },
      { label: "Purchase Orders", path: "/purchaseorders" },
      { label: "Open POs", path: "/openpurchaseorders" },
      { label: "Open POs (Alt)", path: "/openpurchaseorders1" },
      { label: "PO Comments", path: "/po-comments" },
      { label: "PO Feedback", path: "/po-feedback" },
      { label: "Alert Report", path: "/po-alert-report" },
    ],
  },
  {
    id: "vendors",
    label: "Vendors",
    subs: [
      { label: "Vendors Dashboard", path: "/vendorsdashboard" },
      { label: "Vendors", path: "/vendors1" },
      { label: "Vendor Search", path: "/vendor-dashboard" },
      { label: "Non-SAP Vendors", path: "/nonsapvendors" },
      { label: "Document Upload", path: "/vendordocupload" },
      { label: "Document View", path: "/vendordocview" },
      { label: "Vendor Extract (AI)", path: "/vendor-extract" },
      { label: "Vendor Feedback", path: "/vendor-feedback" },
      { label: "Group Mapping", path: "/vendor-group-mapping" },
      { label: "Reg. Group Mapping", path: "/vendors/group-mapping" },
      { label: "Vendors with PO", path: "/vendorswithpo" },
      { label: "Vendor Evaluation", path: "/vendorevaluation/webformat" },
    ],
  },
  {
    id: "materials",
    label: "Materials",
    subs: [
      { label: "Material Dashboard", path: "/materialsdashboard" },
      { label: "Materials", path: "/materials" },
      { label: "Material Groups List", path: "/materials/materialgroups" },
      { label: "Material Types", path: "/materials/mattypes" },
      { label: "Standardisation", path: "/material-standardization" },
      { label: "Material Groups", path: "/material-groups" },
      { label: "Material Documents", path: "/materialdocuments" },
    ],
  },
  {
    id: "tracking",
    label: "Tracking",
    subs: [
      { label: "Tracking Dashboard", path: "/trackingdashboard" },
      { label: "Tracking Home", path: "/tracking" },
      { label: "PR Form", path: "/tracking/forms/PRForm" },
      { label: "PO Form", path: "/tracking/forms/POForm" },
      { label: "Delivery Form", path: "/tracking/forms/DeliveryForm" },
      { label: "Post Delivery Form", path: "/tracking/forms/PostDeliveryForm" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    subs: [
      { label: "Reports Dashboard", path: "/reportsdashboard" },
      { label: "Purchases Report", path: "/purchases-report" },
      { label: "No PO Vendors", path: "/vendor-reports/no-purchaseorders" },
      { label: "With PO No Docs", path: "/vendor-reports/with-po-no-docs" },
      { label: "PO Missing Docs", path: "/vendor-reports/po-missing-docs" },
      { label: "Lessons Learnt", path: "/lessons-learnt" },
    ],
  },
  {
    id: "assets",
    label: "Assets & Masters",
    subs: [
      { label: "Asset Dashboard", path: "/assetdashboard" },
      { label: "Assets Alt Dashboard", path: "/assets/dashboard" },
      { label: "MME Equipment", path: "/assets/mme" },
      { label: "Fixed Assets", path: "/assets/fixedassets" },
      { label: "Asset Masters", path: "/assetmanagement/masters" },
      { label: "Global Masters", path: "/global-masters" },
      { label: "Global Masters Dash", path: "/globalmastersdashboard" },
      { label: "Data Load", path: "/data-load" },
    ],
  },
];

export default function SidebarLayout({ children }) {
  const router = useRouter();
  const [openModule, setOpenModule] = useState(null);
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

  // Synchronize openModule with router pathname to auto-expand matching module and collapse others on navigation
  useEffect(() => {
    const match = MODULES.find((m) =>
      m.subs.some((s) => router.pathname === s.path || router.pathname.startsWith(`${s.path}/`))
    );
    if (match) {
      setOpenModule(match.id);
    } else {
      setOpenModule(null);
    }
  }, [router.pathname]);

  const handleModuleClick = (id) => setOpenModule((prev) => (prev === id ? null : id));

  const isActivePath = (path) => {
    const exactPaths = ["/", "/tracking", "/projects", "/materials", "/purchaseorders", "/global-masters"];
    if (exactPaths.includes(path)) {
      return router.pathname === path;
    }
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-app-bg text-app-text">
      <div className="flex flex-1 min-h-0 relative">
        {/* Backdrop for mobile slide-over drawer */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden animate-fade-in"
            onClick={() => {
              setShowSidebar(false);
              localStorage.setItem("opt_sidebar_open", "false");
            }}
          />
        )}

        {/* Sidebar container */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-app-border bg-[var(--app-sidebar-bg)] p-4 transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:shrink-0 ${
            showSidebar ? "translate-x-0 md:block" : "-translate-x-full md:hidden invisible"
          }`}
        >
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
                <FiX size={18} />
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
        </aside>

        <div className={`relative flex flex-1 flex-col min-h-0 p-4 sm:p-6 ${showSidebar ? "" : "pl-14"}`}>{children}</div>

        {!showSidebar && (
          <button
            type="button"
            onClick={() => {
              setShowSidebar(true);
              localStorage.setItem("opt_sidebar_open", "true");
            }}
            className="absolute top-6 left-4 z-40 flex items-center justify-center rounded-lg border border-app-border bg-app-surface p-2 text-app-text-muted shadow-md transition hover:scale-105 hover:bg-app-surface-muted hover:text-app-text active:scale-95 animate-fade-in"
            title="Show Sidebar"
          >
            <FiMenu size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
