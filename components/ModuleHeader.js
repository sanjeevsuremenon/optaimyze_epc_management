import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FiMenu, FiChevronDown } from "react-icons/fi";
import { faRightFromBracket, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  {
    label: "Projects",
    links: [
      { label: "Dashboard", href: "/projectsdashboard" },
      { label: "Projects List", href: "/projects" },
      { label: "Projects (Alt)", href: "/projects1" },
      { label: "Open Projects", href: "/openprojects" },
      { label: "Project Details", href: "/projectdetails" },
      { label: "Networks", href: "/projects/networks" },
      { label: "WBS Elements", href: "/projects/wbs" },
      { label: "Project Documents", href: "/projectdocuments" },
      { label: "Documents Dashboard", href: "/projectdocumentsdashboard" },
      { label: "Long Lead Packages", href: "/longleadpackages" },
    ],
    dynamic: (query) => {
      const { projectid } = query;
      if (!projectid) return null;
      return [
        { label: `Timeline (Proj: ${projectid})`, href: `/projectpurchasetimelines/${projectid}` }
      ];
    }
  },
  {
    label: "Purchase Orders",
    links: [
      { label: "Dashboard", href: "/purchaseordersdashboard" },
      { label: "PO Search", href: "/purchaseordersearch" },
      { label: "Purchase Orders", href: "/purchaseorders" },
      { label: "Open POs", href: "/openpurchaseorders" },
      { label: "Open POs (Alt)", href: "/openpurchaseorders1" },
      { label: "PO Comments", href: "/po-comments" },
      { label: "PO Feedback", href: "/po-feedback" },
      { label: "Alert Report", href: "/po-alert-report" },
    ],
    dynamic: (query) => {
      const { ponum, ponumber } = query;
      const num = ponum || ponumber;
      if (!num) return null;
      return [
        { label: `PO Details: ${num}`, href: `/purchaseorders/${num}` },
        { label: `PO Schedule: ${num}`, href: `/openpurchaseorders1/schedule/${num}` },
        { label: `PO View: ${num}`, href: `/openpurchaseorders1/view/${num}` }
      ];
    }
  },
  {
    label: "Vendors",
    links: [
      { label: "Dashboard", href: "/vendorsdashboard" },
      { label: "Vendors", href: "/vendors1" },
      { label: "Non-SAP Vendors", href: "/nonsapvendors" },
      { label: "Document Upload", href: "/vendordocupload" },
      { label: "Document View", href: "/vendordocview" },
      { label: "Vendor Extract (AI)", href: "/vendor-extract" },
      { label: "Vendor Feedback", href: "/vendor-feedback" },
      { label: "Group Mapping", href: "/vendor-group-mapping" },
      { label: "Reg. Group Mapping", href: "/vendors/group-mapping" },
      { label: "Vendors with PO", href: "/vendorswithpo" },
      { label: "Vendor Evaluation", href: "/vendorevaluation/webformat" },
    ],
    dynamic: (query) => {
      const { vendorcode, code, id } = query;
      const val = vendorcode || code || id;
      if (!val) return null;
      return [
        { label: `Doc View (Ven: ${val})`, href: `/vendordocview/${val}` },
        { label: `Evaluation (Ven: ${val})`, href: `/vendorevaluation/webformat/${val}` },
        { label: `Edit Vendor`, href: `/vendors/edit/${val}` }
      ];
    }
  },
  {
    label: "Materials",
    links: [
      { label: "Dashboard", href: "/materialsdashboard" },
      { label: "Materials", href: "/materials" },
      { label: "Material Groups List", href: "/materials/materialgroups" },
      { label: "Material Types", href: "/materials/mattypes" },
      { label: "Standardisation", href: "/material-standardization" },
      { label: "Material Groups", href: "/material-groups" },
      { label: "Material Documents", href: "/materialdocuments" },
    ],
    dynamic: (query) => {
      const { matgroupid, materialid } = query;
      if (matgroupid) {
        return [{ label: `Group List: ${matgroupid}`, href: `/matgroupwiselist/${matgroupid}` }];
      }
      if (materialid) {
        return [{ label: `Mat ID: ${materialid}`, href: `/materials/${materialid}` }];
      }
      return null;
    }
  },
  {
    label: "Tracking",
    links: [
      { label: "Dashboard", href: "/trackingdashboard" },
      { label: "Tracking Home", href: "/tracking" },
      { label: "PR Form", href: "/tracking/forms/PRForm" },
      { label: "PO Form", href: "/tracking/forms/POForm" },
      { label: "Delivery Form", href: "/tracking/forms/DeliveryForm" },
      { label: "Post Delivery Form", href: "/tracking/forms/PostDeliveryForm" },
    ],
    dynamic: (query) => {
      const { type, id } = query;
      if (!type || !id) return null;
      return [
        { label: `Tracking Details (${type})`, href: `/tracking/${type}/${id}` }
      ];
    }
  },
  {
    label: "Assets & Masters",
    links: [
      { label: "Asset Dashboard", href: "/assetdashboard" },
      { label: "Assets Alt Dashboard", href: "/assets/dashboard" },
      { label: "MME Equipment", href: "/assets/mme" },
      { label: "Fixed Assets", href: "/assets/fixedassets" },
      { label: "Asset Masters", href: "/assetmanagement/masters" },
      { label: "Global Masters", href: "/global-masters" },
      { label: "Global Masters Dash", href: "/globalmastersdashboard" },
      { label: "Data Load", href: "/data-load" },
    ],
    dynamic: (query) => {
      const { assetnumber } = query;
      if (!assetnumber) return null;
      return [
        { label: `Asset: ${assetnumber}`, href: `/assets/${assetnumber}` },
        { label: `Public Data: ${assetnumber}`, href: `/assets/publicdata/${assetnumber}` }
      ];
    }
  },
  {
    label: "Reports",
    links: [
      { label: "Dashboard", href: "/reportsdashboard" },
      { label: "Purchases Report", href: "/purchases-report" },
      { label: "No PO Vendors", href: "/vendor-reports/no-purchaseorders" },
      { label: "With PO No Docs", href: "/vendor-reports/with-po-no-docs" },
      { label: "PO Missing Docs", href: "/vendor-reports/po-missing-docs" },
      { label: "Lessons Learnt", href: "/lessons-learnt" },
    ],
    dynamic: (query) => {
      const { slug } = query;
      if (!slug) return null;
      return [
        { label: `Lesson: ${slug}`, href: `/lessons-learnt/${slug}` }
      ];
    }
  }
];

export default function ModuleHeader() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-[var(--app-header-bg)] shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <div className="flex items-center gap-6">
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

        {/* Premium Navigation NAV bar */}
        {mounted && session && (
          <nav className="hidden xl:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const dynamicLinks = item.dynamic(router.query) || [];
              const allLinks = [...item.links, ...dynamicLinks];
              const isCurrentModule = allLinks.some((l) => router.pathname === l.href || router.pathname.startsWith(l.href + "/"));

              return (
                <div key={item.label} className="relative group py-2">
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-app-surface-muted hover:text-app-text ${
                      isCurrentModule
                        ? "text-app-accent bg-app-accent-soft/20 border-b-2 border-app-accent"
                        : "text-app-text-secondary"
                    }`}
                  >
                    <span>{item.label}</span>
                    <FiChevronDown className="transition-transform duration-200 group-hover:rotate-180" />
                  </button>

                  {/* Glassmorphism drop-down card */}
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900/90 dark:bg-slate-950/90 border border-app-border rounded-xl shadow-2xl backdrop-blur-xl opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 overflow-hidden p-2">
                    {item.links.map((link) => {
                      const isActive = router.pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                            isActive
                              ? "bg-app-accent text-slate-950 font-bold shadow-md shadow-cyan-500/10"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}

                    {dynamicLinks.length > 0 && (
                      <div className="mt-1 pt-1.5 border-t border-slate-800">
                        {dynamicLinks.map((link) => {
                          const isActive = router.pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`block px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                                isActive
                                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
                                  : "text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/60"
                              }`}
                            >
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        )}

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
              <span className="max-w-[120px] truncate">{session.user?.name || session.user?.email}</span>
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
