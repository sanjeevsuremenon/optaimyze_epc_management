import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Box,
  ClipboardList,
  Download,
  FileText,
  Filter,
  HardHat,
  Package,
  Users,
  Wrench,
} from "lucide-react";

import { AssetStatusChart } from "../../components/assets/dashboard/AssetStatusChart";
import { AssetTypeDistribution } from "../../components/assets/dashboard/AssetTypeDistribution";
import { KpiCard } from "../../components/assets/dashboard/KpiCard";
import { MaintenanceSchedule } from "../../components/assets/dashboard/MaintenanceSchedule";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "reports", label: "Reports" },
];

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}


function DashboardCard({ title, subtitle, viewAllHref, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-app-border bg-app-surface p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-app-text">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-app-text-muted">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="shrink-0 text-[13px] font-medium text-app-accent hover:underline">
            View All
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyListState({ message, subtext }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center py-6 text-center">
      <ClipboardList className="mb-3 h-12 w-12 text-app-text-secondary" aria-hidden />
      <p className="text-sm text-app-text-muted">{message}</p>
      {subtext && <p className="mt-1 text-[13px] text-app-text-secondary">{subtext}</p>}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch("/api/assets/dashboard/overview");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load overview");
      }
      setOverview(json);
    } catch (e) {
      setOverview(null);
      setOverviewError(e instanceof Error ? e.message : "Failed to load overview");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const calibrationScheduleItems = useMemo(() => {
    if (!overview?.upcomingCalibrations?.length) return [];
    return overview.upcomingCalibrations.map((c, i) => ({
      id: `${c.assetnumber}-${i}`,
      asset: (c.assetdescription && c.assetdescription.trim()) || `Asset ${c.assetnumber}`,
      assetId: c.assetnumber,
      subtitle: c.calibratedby
        ? `Last calibrated by ${c.calibratedby}`
        : "Upcoming certificate expiry",
      dateLabel: c.calibrationtodate
        ? new Date(c.calibrationtodate).toLocaleDateString(undefined, { dateStyle: "medium" })
        : "—",
      expiryIso: c.calibrationtodate,
      status: "scheduled",
    }));
  }, [overview]);

  const summary = overview?.summary;

  return (
    <div className="app-page min-h-full">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-app-text-muted" aria-label="Breadcrumb">
          <span>Asset Management</span>
          <span className="mx-1.5 text-app-text-secondary">/</span>
          <span className="font-medium text-app-accent">Dashboard</span>
        </nav>

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-app-text">
              Asset Management Dashboard
            </h1>
            <p className="mt-1 text-sm text-app-text-muted">
              Monitor and manage all your assets in one place
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text-secondary shadow-sm transition hover:border-app-border hover:bg-app-surface-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
            >
              <Filter className="h-4 w-4" aria-hidden />
              Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text-secondary shadow-sm transition hover:border-app-border hover:bg-app-surface-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-app-accent-hover focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Generate Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-app-border" role="tablist" aria-label="Dashboard sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`mr-8 border-b-2 pb-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 ${
                activeTab === tab.id
                  ? "-mb-px border-app-accent text-app-accent"
                  : "border-transparent text-app-text-muted hover:text-app-text"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {overviewError && (
              <div
                className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{overviewError}</span>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                  onClick={() => loadOverview()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total Assets"
                value={summary ? summary.totalAssets.toLocaleString() : "—"}
                subLabel={
                  overviewLoading
                    ? "Loading…"
                    : `${summary?.assetsAddedThisMonth ?? 0} added this month`
                }
                icon={Box}
                iconBgClass="bg-app-accent-soft"
                iconClass="text-app-accent"
                loading={overviewLoading}
              />
              <KpiCard
                label="In Custody"
                value={summary ? summary.assetsInCustody.toLocaleString() : "—"}
                subLabel={
                  overviewLoading
                    ? "Loading…"
                    : `${summary?.custodyPercent ?? 0}% active custody`
                }
                icon={Users}
                iconBgClass="bg-amber-50"
                iconClass="text-amber-500"
                loading={overviewLoading}
              />
              <KpiCard
                label="Calibrations Due Soon"
                value={summary ? String(summary.calibrationsDueSoon) : "—"}
                subLabel="Next 30 days"
                icon={Wrench}
                iconBgClass="bg-orange-100"
                iconClass="text-orange-500"
                valueClass={
                  summary?.calibrationsDueSoon > 0 ? "text-orange-500" : "text-app-text"
                }
                loading={overviewLoading}
              />
              <KpiCard
                label="Expired Calibrations"
                value={summary ? String(summary.expiredCalibrations) : "—"}
                subLabel="Action required"
                icon={AlertTriangle}
                iconBgClass="bg-red-50"
                iconClass="text-red-500"
                valueClass={
                  summary?.expiredCalibrations > 0 ? "text-red-500" : "text-app-text"
                }
                urgent={!overviewLoading && (summary?.expiredCalibrations ?? 0) > 0}
                loading={overviewLoading}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <DashboardCard title="Asset Status Overview" subtitle="Counts by recorded status">
                <AssetStatusChart data={overview?.assetStatus ?? []} />
              </DashboardCard>

              <DashboardCard title="Asset Type Distribution" subtitle="Merged categories">
                <AssetTypeDistribution
                  segments={overview?.assetTypeDistribution ?? []}
                  
                />
              </DashboardCard>
            </div>

            {/* Custody + Calibration */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <DashboardCard
                title="Recent Custody Activity"
                subtitle="Newest assignments"
                viewAllHref="/assets/mme"
              >
                {overviewLoading ? (
                  <p className="text-sm text-app-text-muted">Loading…</p>
                ) : overview?.recentCustody?.length ? (
                  <ul className="divide-y divide-slate-100">
                    {overview.recentCustody.slice(0, 5).map((row, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-app-surface-muted"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-accent-soft text-xs font-semibold text-app-accent"
                          aria-hidden
                        >
                          {getInitials(row.employeename)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-app-text">
                            <span className="font-medium text-app-accent">{row.employeename || "—"}</span>
                            {row.employeenumber ? ` (${row.employeenumber})` : ""}
                            {" assigned "}
                            <span className="font-medium">{row.assetnumber}</span>
                            {row.location ? ` · ${row.location}` : ""}
                          </p>
                          <p className="text-xs text-app-text-muted">{formatRelativeTime(row.custodyfrom)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Active
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyListState
                    message="No recent custody activity."
                    subtext="Assignments will appear here when assets are transferred."
                  />
                )}
              </DashboardCard>

              <DashboardCard
                title="Upcoming Calibration Expiries"
                subtitle="Next certificate end date per asset"
                viewAllHref="/assets/mme"
              >
                {overviewLoading ? (
                  <p className="text-sm text-app-text-muted">Loading…</p>
                ) : (
                  <MaintenanceSchedule
                    items={calibrationScheduleItems}
                    viewAllHref="/assets/mme"
                  />
                )}
              </DashboardCard>
            </div>

            {/* PPE + Project returns */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <DashboardCard title="Latest PPE Transactions" subtitle="Recent issuances">
                {overviewLoading ? (
                  <p className="text-sm text-app-text-muted">Loading…</p>
                ) : overview?.recentPpe?.length ? (
                  <ul className="divide-y divide-slate-100">
                    {overview.recentPpe.slice(0, 5).map((r, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-app-surface-muted"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50">
                          <HardHat className="h-4 w-4 text-orange-500" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-app-text">{r.ppeName}</p>
                            <span className="shrink-0 text-xs text-app-text-muted">
                              {formatRelativeTime(r.dateOfIssue)}
                            </span>
                          </div>
                          <p className="text-sm text-app-text-secondary">
                            Issued to {r.userEmpName} · Qty {r.quantityIssued}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyListState message="No PPE transactions." />
                )}
              </DashboardCard>

              <DashboardCard title="Recent Project Return Materials" subtitle="Latest returns">
                {overviewLoading ? (
                  <p className="text-sm text-app-text-muted">Loading…</p>
                ) : overview?.recentProjectReturns?.length ? (
                  <ul className="divide-y divide-slate-100">
                    {overview.recentProjectReturns.slice(0, 5).map((m, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-app-surface-muted"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50">
                          <Package className="h-4 w-4 text-violet-500" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-app-text">
                              {m.materialDescription}
                            </p>
                            <span className="shrink-0 text-xs text-app-text-muted">
                              {formatRelativeTime(m.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-app-text-secondary">
                            Code {m.materialCode} · Qty {m.quantity} {m.uom}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyListState message="No returns found." />
                )}
              </DashboardCard>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-app-border bg-app-surface p-12 shadow-sm">
            <div className="text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-app-accent" aria-hidden />
              <h2 className="text-xl font-semibold text-app-text">Analytics Dashboard</h2>
              <p className="mt-2 text-sm text-app-text-muted">Detailed analytics coming soon…</p>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-app-border bg-app-surface p-12 shadow-sm">
            <div className="text-center">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-app-accent" aria-hidden />
              <h2 className="text-xl font-semibold text-app-text">Report Center</h2>
              <p className="mt-2 text-sm text-app-text-muted">Generate custom reports coming soon…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
