import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FiMenu, FiChevronDown } from "react-icons/fi";
import {
  FolderKanban,
  ShoppingCart,
  Users,
  Boxes,
  Truck,
  Globe,
  BarChart3,
} from "lucide-react";
import { faRightFromBracket, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import ThemeToggle from "./ThemeToggle";

const NAV_ICONS = {
  Projects: FolderKanban,
  "Purchase Orders": ShoppingCart,
  Vendors: Users,
  Materials: Boxes,
  Tracking: Truck,
  "Assets & Masters": Globe,
  Reports: BarChart3,
};

const NAV_ITEMS = [
  {
    label: "Projects",
    icon: NAV_ICONS.Projects,
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
    icon: NAV_ICONS["Purchase Orders"],
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
    icon: NAV_ICONS["Vendors"],
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
    icon: NAV_ICONS["Materials"],
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
    icon: NAV_ICONS["Tracking"],
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
    icon: NAV_ICONS["Assets & Masters"],
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
    icon: NAV_ICONS["Reports"],
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

const LANDING_NAV_LINKS = [
  { label: "Top", href: "#top" },
  { label: "Why It Matters", href: "#problem" },
  { label: "How It Works", href: "#workflow" },
  { label: "Modules", href: "#modules" },
  { label: "Showcase", href: "#showcase" },
  { label: "Industries", href: "#industries" },
  { label: "FAQ", href: "#faq" },
];

export default function ModuleHeader() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLandingUnauth = router.pathname === "/" && (!mounted || !session);

  if (isLandingUnauth) {
    return (
      <>
        {/* EPCORA TopBar */}
        <div className="hidden border-b border-[#E7E3F5] bg-white md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs text-[#505E6B]">
            <div className="flex items-center gap-6">
              <span>
                Welcome to EPCORA Stack — Digital Transformation for Construction &amp; EPC
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#E8A020]">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#E8A020]" />
                Optaimyze EPC Portal · v2 Live
              </span>
            </div>
            <div className="flex items-center gap-4 font-display text-[11px] font-semibold uppercase tracking-wider text-[#074E84]">
              <Link href="/db-agent" className="transition-colors hover:text-[#E8A020]">
                AI DB Agent
              </Link>
              <span className="text-[#E7E3F5]">|</span>
              <Link href="/auth/login" className="transition-colors hover:text-[#E8A020]">
                Portal Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* EPCORA Sticky Nav */}
        <header
          className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow duration-300 ${
            scrolled
              ? "border-[#E7E3F5] shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)]"
              : "border-[#E7E3F5]/60"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/#top" className="flex items-center gap-3">
              <img
                src="/images/epcora/epcora-mark.svg"
                alt="EPCORA logo"
                className="h-10 w-auto object-contain"
              />
              <div>
                <span className="font-display text-xl font-extrabold tracking-tight text-[#074E84]">
                  EPC<span className="text-[#2380C6]">ORA</span>{" "}
                  <span className="text-[#0A1B33]">Optaimyze</span>
                </span>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8A020]">
                  EPC Management Portal
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {LANDING_NAV_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`font-display text-[13px] uppercase tracking-[0.15em] transition-colors hover:text-[#E8A020] ${
                    item.label === "Modules"
                      ? "font-bold text-[#E8A020]"
                      : "font-semibold text-[#074E84]"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/auth/login"
                className="border-2 border-[#074E84] px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#074E84] transition-colors duration-300 hover:bg-[#074E84] hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-[#FCBC45] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#05052D] transition-colors duration-300 hover:bg-[#E8A020]"
              >
                Register
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center justify-center border border-[#E7E3F5] p-2 text-[#074E84] lg:hidden"
            >
              <FiMenu size={22} />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-[#E7E3F5] bg-white px-6 py-5 lg:hidden">
              <div className="flex flex-col gap-3.5">
                {LANDING_NAV_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-[#074E84] hover:text-[#E8A020]"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-2 flex flex-wrap gap-3 pt-2 border-t border-[#E7E3F5]">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="border-2 border-[#074E84] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#074E84]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-[#FCBC45] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#05052D]"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-[var(--app-header-bg)] shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-2.5 shadow-sm transition hover:border-app-accent hover:shadow-md"
          >
            <img
              src="/images/epcora/epcora-mark.svg"
              alt="EPCORA logo"
              className="h-9 w-9 object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-app-text">
                OPTAIMYZE PORTAL
              </p>
              <p className="text-xs text-app-text-muted">EPCORA Stack · EPC Management</p>
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
              const ItemIcon = item.icon;

              return (
                <div key={item.label} className="relative group py-2">
                  <button
                    type="button"
                    className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px ${
                      isCurrentModule
                        ? "text-app-accent"
                        : "text-app-text-secondary hover:bg-app-surface-muted hover:text-app-text"
                    }`}
                  >
                    {ItemIcon && (
                      <ItemIcon
                        size={15}
                        strokeWidth={2.2}
                        className={`transition-colors duration-200 ${
                          isCurrentModule
                            ? "text-app-accent"
                            : "text-app-text-muted group-hover:text-app-accent"
                        }`}
                      />
                    )}
                    <span>{item.label}</span>
                    <FiChevronDown
                      size={13}
                      className={`transition-all duration-300 group-hover:rotate-180 ${
                        isCurrentModule ? "text-app-accent" : "text-app-text-muted group-hover:text-app-accent"
                      }`}
                    />
                    <span
                      className={`absolute inset-x-3 -bottom-px h-[2px] origin-left rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-transform duration-300 ${
                        isCurrentModule ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </button>

                  {/* Glassmorphism drop-down card */}
                  <div className="invisible absolute left-0 z-50 mt-2 w-64 translate-y-2 overflow-hidden rounded-2xl border border-app-border bg-app-surface/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.links.map((link) => {
                      const isActive = router.pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`group/link flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? "bg-app-accent-soft font-bold text-app-accent shadow-sm"
                              : "text-app-text-secondary hover:translate-x-0.5 hover:bg-app-surface-muted hover:text-app-text"
                          }`}
                        >
                          {link.label}
                          <span
                            className={`text-[10px] transition-all duration-150 ${
                              isActive
                                ? "translate-x-0 text-app-accent opacity-100"
                                : "-translate-x-1 text-app-accent opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-70"
                            }`}
                          >
                            →
                          </span>
                        </Link>
                      );
                    })}

                    {dynamicLinks.length > 0 && (
                      <div className="mt-1 border-t border-app-border pt-1.5">
                        {dynamicLinks.map((link) => {
                          const isActive = router.pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`group/link flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                                isActive
                                  ? "bg-app-accent-soft font-bold text-app-accent shadow-sm"
                                  : "text-app-accent hover:translate-x-0.5 hover:bg-app-surface-muted"
                              }`}
                            >
                              {link.label}
                              <span
                                className={`text-[10px] transition-all duration-150 ${
                                  isActive
                                    ? "translate-x-0 opacity-100"
                                    : "-translate-x-1 opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-70"
                                }`}
                              >
                                →
                              </span>
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
