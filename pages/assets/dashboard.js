import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Box,
  ClipboardList,
  Download,
  Filter,
  Users,
  Wrench,
} from "lucide-react";

import { AssetStatusChart } from "../../components/assets/dashboard/AssetStatusChart";
import { AssetTypeDistribution } from "../../components/assets/dashboard/AssetTypeDistribution";
import { MaintenanceSchedule } from "../../components/assets/dashboard/MaintenanceSchedule";

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch('/api/assets/dashboard/overview');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load overview');
      }
      setOverview(json);
    } catch (e) {
      setOverview(null);
      setOverviewError(e instanceof Error ? e.message : 'Failed to load overview');
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
      subtitle: c.calibratedby
        ? `Certificate valid to · Last calibrated by ${c.calibratedby}`
        : 'Upcoming certificate expiry',
      dateLabel: c.calibrationtodate
        ? new Date(c.calibrationtodate).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : '—',
      status: 'scheduled',
    }));
  }, [overview]);

  const fmtDateTime = (iso) =>
    iso
      ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : '—';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Asset Management Dashboard</h1>
            <p className="text-slate-400 mt-1">Monitor and manage all your assets in one place</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm gap-2">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <button className="btn btn-outline btn-sm gap-2">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="btn btn-primary btn-sm">Generate Report</button>
          </div>
        </div>

        <div role="tablist" className="tabs tabs-boxed bg-slate-800 w-fit">
          <button role="tab" className={`tab ${activeTab === "overview" ? "tab-active" : "text-slate-300"}`} onClick={() => setActiveTab("overview")}>Overview</button>
          <button role="tab" className={`tab ${activeTab === "analytics" ? "tab-active" : "text-slate-300"}`} onClick={() => setActiveTab("analytics")}>Analytics</button>
          <button role="tab" className={`tab ${activeTab === "reports" ? "tab-active" : "text-slate-300"}`} onClick={() => setActiveTab("reports")}>Reports</button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {overviewError && (
              <div className="alert alert-error shadow-lg">
                <div>
                  <AlertTriangle />
                  <span>{overviewError}</span>
                </div>
                <div className="flex-none">
                  <button className="btn btn-sm btn-ghost" onClick={() => loadOverview()}>Retry</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <h2 className="card-title text-sm text-slate-300">Total Assets</h2>
                    <Box className="text-teal-400 h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewLoading ? '...' : overview ? overview.summary.totalAssets.toLocaleString() : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {overviewLoading
                      ? 'Loading...'
                      : `${overview?.summary.assetsAddedThisMonth ?? 0} added this month`}
                  </p>
                </div>
              </div>

              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <h2 className="card-title text-sm text-slate-300">In Custody</h2>
                    <Users className="text-teal-400 h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewLoading ? '...' : overview ? overview.summary.assetsInCustody.toLocaleString() : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {overviewLoading
                      ? 'Loading...'
                      : `${overview?.summary.custodyPercent ?? 0}% active custody`}
                  </p>
                </div>
              </div>

              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <h2 className="card-title text-sm text-slate-300">Calibrations Due Soon</h2>
                    <Wrench className="text-teal-400 h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewLoading ? '...' : overview ? overview.summary.calibrationsDueSoon : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Next 30 days</p>
                </div>
              </div>

              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <h2 className="card-title text-sm text-slate-300">Expired Calibrations</h2>
                    <AlertTriangle className="text-error h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-white mt-2">
                    {overviewLoading ? '...' : overview ? overview.summary.expiredCalibrations : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Action required</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              <div className="card bg-slate-800 border border-slate-700 lg:col-span-4">
                <div className="card-body p-5">
                  <h2 className="card-title text-lg">Asset Status Overview</h2>
                  <p className="text-sm text-slate-400 mb-4">Counts by recorded status</p>
                  <AssetStatusChart data={overview?.assetStatus ?? []} />
                </div>
              </div>
              
              <div className="card bg-slate-800 border border-slate-700 lg:col-span-3">
                <div className="card-body p-5">
                  <h2 className="card-title text-lg">Asset Type Distribution</h2>
                  <p className="text-sm text-slate-400 mb-4">Merged categories</p>
                  <AssetTypeDistribution segments={overview?.assetTypeDistribution ?? []} theme="dark" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <h2 className="card-title text-lg">Recent Custody Activity</h2>
                  <p className="text-sm text-slate-400 mb-4">Newest assignments</p>
                  <div className="space-y-3">
                    {overviewLoading ? (
                      <p className="text-sm text-slate-500">Loading...</p>
                    ) : overview?.recentCustody?.length ? (
                      overview.recentCustody.map((row, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-teal-400">{row.assetnumber}</span>
                            <span className="text-xs text-slate-400">{fmtDateTime(row.custodyfrom)}</span>
                          </div>
                          <p className="text-sm">{row.employeename || '—'} {row.employeenumber ? `(${row.employeenumber})` : ''}</p>
                          <p className="text-xs text-slate-500 mt-1">{row.locationType} - {row.location}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No recent custody activity.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <h2 className="card-title text-lg">Upcoming Calibration Expiries</h2>
                  <p className="text-sm text-slate-400 mb-4">Next certificate end date per asset</p>
                  <MaintenanceSchedule items={calibrationScheduleItems} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <h2 className="card-title text-lg">Latest PPE Transactions</h2>
                  <div className="space-y-3 mt-4">
                    {overviewLoading ? (
                      <p className="text-sm text-slate-500">Loading...</p>
                    ) : overview?.recentPpe?.length ? (
                      overview.recentPpe.map((r, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold">{r.ppeName}</span>
                            <span className="text-xs text-slate-400">{fmtDateTime(r.dateOfIssue)}</span>
                          </div>
                          <p className="text-sm text-slate-300">Issued to {r.userEmpName} (Qty: {r.quantityIssued})</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No PPE transactions.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card bg-slate-800 border border-slate-700">
                <div className="card-body p-5">
                  <h2 className="card-title text-lg">Recent Project Return Materials</h2>
                  <div className="space-y-3 mt-4">
                    {overviewLoading ? (
                      <p className="text-sm text-slate-500">Loading...</p>
                    ) : overview?.recentProjectReturns?.length ? (
                      overview.recentProjectReturns.map((m, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold">{m.materialDescription}</span>
                            <span className="text-xs text-slate-400">{fmtDateTime(m.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-300">Code: {m.materialCode} | Qty: {m.quantity} {m.uom}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No returns found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === "analytics" && (
          <div className="card bg-slate-800 border border-slate-700 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-teal-400 mb-4" />
              <h2 className="text-xl font-bold">Analytics Dashboard</h2>
              <p className="text-slate-400 mt-2">Detailed analytics coming soon...</p>
            </div>
          </div>
        )}
        
        {activeTab === "reports" && (
          <div className="card bg-slate-800 border border-slate-700 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-teal-400 mb-4" />
              <h2 className="text-xl font-bold">Report Center</h2>
              <p className="text-slate-400 mt-2">Generate custom reports coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
