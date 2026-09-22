import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import moment from "moment";
import { FiDownload, FiFilter, FiBox, FiDollarSign, FiHash, FiLayers } from "react-icons/fi";
import { TrendingUp, BarChart3, Download, Layers } from "lucide-react";
import GlassSubPageHero from "../../components/GlassSubPageHero";
import { GlassStyles, Tilt } from "../../components/landing/glass";

const SORT_KEYS = ["materialCode", "materialDescription", "poCount", "totalValue", "totalQty"];

const TABS = [
  { id: "all", label: "All Purchases", endpoint: "/api/reports/all-purchases", icon: <FiLayers className="mr-2" /> },
  { id: "domestic", label: "Domestic (KSA)", endpoint: "/api/reports/domestic-purchases", icon: <FiBox className="mr-2" /> },
  { id: "import", label: "Import", endpoint: "/api/reports/import-purchases", icon: <FiBox className="mr-2" /> },
  { id: "channel", label: "Channel Partner", endpoint: "/api/reports/channel-partner-purchases", icon: <FiBox className="mr-2" /> },
  { id: "cash", label: "Cash POs", endpoint: "/api/reports/cash-po-materials", icon: <FiDollarSign className="mr-2" /> },
  { id: "services", label: "Services", endpoint: "/api/reports/services-purchases", icon: <FiBox className="mr-2" /> },
];

const PurchasesReport = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("poCount");
  const [sortKey, setSortKey] = useState("poCount");
  const [sortDir, setSortDir] = useState("desc");
  const [filterMaterialCode, setFilterMaterialCode] = useState("");
  const [filterMaterialDescription, setFilterMaterialDescription] = useState("");
  const [distinctPoCount, setDistinctPoCount] = useState(null);

  const isAllYears = selectedYear === "all";

  // Fetch available years using the all-purchases endpoint as master
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch("/api/reports/all-purchases/years");
        if (res.ok) {
          const list = await res.json();
          setYears(Array.isArray(list) ? list : []);
          if (list.length > 0 && selectedYear == null) {
            setSelectedYear(Math.max(...list));
          }
        } else {
          const currentYear = new Date().getFullYear();
          const fallback = Array.from({ length: 12 }, (_, i) => currentYear - 10 + i);
          setYears(fallback);
          if (selectedYear == null) setSelectedYear(currentYear);
        }
      } catch (err) {
        const currentYear = new Date().getFullYear();
        setYears(Array.from({ length: 12 }, (_, i) => currentYear - 10 + i));
        if (selectedYear == null) setSelectedYear(currentYear);
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, [selectedYear]);

  // Fetch data when year or tab changes
  useEffect(() => {
    if (selectedYear == null) return;

    const fetchData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const url = selectedYear === "all"
          ? `${activeTab.endpoint}?year=all`
          : `${activeTab.endpoint}?year=${selectedYear}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load data (${res.status})`);
        }
        const body = await res.json();
        const list = body?.data != null ? body.data : (Array.isArray(body) ? body : []);
        setData(list);
        setDistinctPoCount(typeof body?.distinctPoCount === "number" ? body.distinctPoCount : null);
      } catch (err) {
        setError(err.message);
        setData([]);
        setDistinctPoCount(null);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedYear, activeTab]);

  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num)) return "—";
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatQuantity = (value) => {
    if (value == null || value === "") return "—";
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num)) return "—";
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const filteredData = data.filter((row) => {
    const code = (row.materialCode != null ? String(row.materialCode) : "").toLowerCase();
    const desc = (row.materialDescription != null ? String(row.materialDescription) : "").toLowerCase();
    const codeMatch = !filterMaterialCode.trim() || code.includes(filterMaterialCode.trim().toLowerCase());
    const descMatch = !filterMaterialDescription.trim() || desc.includes(filterMaterialDescription.trim().toLowerCase());
    return codeMatch && descMatch;
  });

  const displayData = [...filteredData].sort((a, b) => {
    const key = sortKey;
    const dir = sortDir === "asc" ? 1 : -1;
    let aVal = a[key];
    let bVal = b[key];
    if (key === "materialCode" || key === "materialDescription") {
      aVal = (aVal != null ? String(aVal) : "").toLowerCase();
      bVal = (bVal != null ? String(bVal) : "").toLowerCase();
      return dir * (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
    }
    aVal = Number(aVal) || 0;
    bVal = Number(bVal) || 0;
    return dir * (aVal - bVal);
  });

  const totalValue = displayData.reduce((sum, row) => sum + (row.totalValue || 0), 0);

  const handleSort = (key) => {
    if (!SORT_KEYS.includes(key)) return;
    setSortKey(key);
    setSortDir((prev) => (prev === "asc" && sortKey === key ? "desc" : "asc"));
    if (key === "poCount" || key === "totalValue") setSortBy(key);
  };

  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  };

  const downloadExcel = useCallback(async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = displayData.map((row) => ({
        "Material code": row.materialCode != null && String(row.materialCode).trim() !== "" ? row.materialCode : "—",
        "Material description": row.materialDescription != null && String(row.materialDescription).trim() !== "" ? row.materialDescription : "—",
        "# of POs": row.poCount ?? 0,
        "Total value (SAR)": row.totalValue ?? 0,
        "Total qty (all POs)": row.totalQty ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab.label);
      const wbout = XLSX.write(wb, { type: "binary", bookType: "xlsx" });
      const blob = new Blob([s2ab(wbout)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab.id}_Purchases_Report_${selectedYear === "all" ? "all" : selectedYear}_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel download failed:", err);
    }
  }, [displayData, selectedYear, activeTab]);

  const detailsUrl = (row) => {
    const year = selectedYear === "all" ? "all" : String(selectedYear);
    return `/purchases-report/details?type=${encodeURIComponent(activeTab.id)}&materialKey=${encodeURIComponent(row.materialKey)}&year=${encodeURIComponent(year)}`;
  };

  if (loading) {
    return (
      <div className="app-page min-h-screen flex flex-col font-sans">
        <GlassStyles />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl px-6 py-4 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="text-app-text-secondary font-medium text-sm">Loading comprehensive report data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen flex-1 flex flex-col font-sans">
      <GlassStyles />
      <Head>
        <title>Purchases Report | OPTAIMYZE</title>
      </Head>
      <main className="w-full max-w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          {/* Glass Subpage Hero */}
          <GlassSubPageHero
            icon={TrendingUp}
            eyebrow="PROCUREMENT METRICS"
            title="Comprehensive Purchases Report"
            description="Analyze material purchasing frequency, volume, and total spend across all procurement channels."
            accent="emerald"
            moduleKey="purchaseorders"
          >
            <div className="flex items-center gap-3 bg-app-surface/60 backdrop-blur-sm p-2.5 rounded-2xl border border-app-border/60">
              <div className="flex flex-col">
                <label htmlFor="year-select" className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider mb-1">
                  Report Year
                </label>
                <select
                  id="year-select"
                  value={selectedYear ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedYear(v === "all" ? "all" : parseInt(v, 10));
                  }}
                  className="bg-app-bg border border-app-border text-app-text rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 text-xs font-bold"
                >
                  <option value="all">All Years (Lifetime)</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={downloadExcel}
                disabled={loadingData || displayData.length === 0}
                className="mt-4 px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                <FiDownload className="mr-1.5" /> Export Excel
              </button>
            </div>
          </GlassSubPageHero>

          {/* Tab Navigation Pill Bar */}
          <div className="flex overflow-x-auto space-x-2 p-1.5 bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl shadow-sm scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 font-bold text-xs rounded-xl transition-all flex items-center whitespace-nowrap ${
                  activeTab.id === tab.id
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-500 flex items-center shadow-sm">
              <FiFilter className="mr-3 text-lg" />
              <span className="font-semibold text-xs">{error}</span>
            </div>
          )}

          {/* Loading Data State */}
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20 bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4" />
              <span className="text-app-text-muted font-medium text-xs tracking-wide">Crunching numbers for {activeTab.label}...</span>
            </div>
          ) : (
            <>
              {/* Summary Metrics Bento Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                <Tilt glow="sky" className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Total POs</p>
                    <p className="text-2xl font-black text-app-text">{distinctPoCount != null ? distinctPoCount.toLocaleString() : "—"}</p>
                  </div>
                  <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-500">
                    <FiHash className="text-xl" />
                  </div>
                </Tilt>
                
                <Tilt glow="violet" className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Unique Materials</p>
                    <p className="text-2xl font-black text-app-text">{displayData.length.toLocaleString()}</p>
                  </div>
                  <div className="p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-500">
                    <FiBox className="text-xl" />
                  </div>
                </Tilt>
                
                <Tilt glow="emerald" className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Total Spend Value (SAR)</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalValue)}</p>
                  </div>
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
                    <FiDollarSign className="text-xl" />
                  </div>
                </Tilt>
              </div>

              {/* Data Table Section */}
              <div className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-app-surface-muted/40 border-b border-app-border flex flex-col md:flex-row items-center gap-3">
                  <div className="flex-1 w-full relative">
                    <input
                      type="text"
                      placeholder="Filter by Material Code..."
                      value={filterMaterialCode}
                      onChange={(e) => setFilterMaterialCode(e.target.value)}
                      className="w-full bg-app-bg border border-app-border text-app-text text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 placeholder-app-text-disabled transition-colors"
                    />
                    <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted text-xs" />
                  </div>
                  <div className="flex-1 w-full relative">
                    <input
                      type="text"
                      placeholder="Filter by Material Description..."
                      value={filterMaterialDescription}
                      onChange={(e) => setFilterMaterialDescription(e.target.value)}
                      className="w-full bg-app-bg border border-app-border text-app-text text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 placeholder-app-text-disabled transition-colors"
                    />
                    <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted text-xs" />
                  </div>
                  <div className="text-[11px] font-bold text-app-text-muted uppercase tracking-wide bg-app-bg px-3 py-2 rounded-xl border border-app-border shrink-0">
                    {filteredData.length !== data.length ? `${filteredData.length} of ${data.length} records` : `${data.length} records`}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-app-bg border-b border-app-border">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">
                          <button onClick={() => handleSort("materialCode")} className="flex items-center hover:text-app-accent transition-colors">
                            Material Code
                            {sortKey === "materialCode" && (sortDir === "asc" ? " ↑" : " ↓")}
                          </button>
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">
                          <button onClick={() => handleSort("materialDescription")} className="flex items-center hover:text-app-accent transition-colors">
                            Material Description
                            {sortKey === "materialDescription" && (sortDir === "asc" ? " ↑" : " ↓")}
                          </button>
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">
                          <button onClick={() => handleSort("poCount")} className="ml-auto flex items-center hover:text-app-accent transition-colors">
                            # of POs
                            {sortKey === "poCount" && (sortDir === "asc" ? " ↑" : " ↓")}
                          </button>
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">
                          <button onClick={() => handleSort("totalValue")} className="ml-auto flex items-center hover:text-app-accent transition-colors">
                            Total Value (SAR)
                            {sortKey === "totalValue" && (sortDir === "asc" ? " ↑" : " ↓")}
                          </button>
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">
                          <button onClick={() => handleSort("totalQty")} className="ml-auto flex items-center hover:text-app-accent transition-colors">
                            Total Qty
                            {sortKey === "totalQty" && (sortDir === "asc" ? " ↑" : " ↓")}
                          </button>
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/60">
                      {displayData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-app-text-muted italic bg-app-bg/30 border border-app-border border-dashed m-4 rounded-xl">
                            {data.length === 0
                              ? (isAllYears ? "No purchase data found in the collection." : `No purchase data for ${selectedYear}.`)
                              : "No rows match your current filters."}
                          </td>
                        </tr>
                      ) : (
                        displayData.map((row, idx) => (
                          <tr key={row.materialKey ?? idx} className="hover:bg-app-surface-muted transition-colors group">
                            <td className="px-5 py-3 text-sm font-bold text-app-accent">
                              {row.materialCode != null && String(row.materialCode).trim() !== "" ? row.materialCode : "—"}
                            </td>
                            <td className="px-5 py-3 text-sm text-app-text max-w-md truncate" title={row.materialDescription}>
                              {row.materialDescription != null && String(row.materialDescription).trim() !== "" ? row.materialDescription : "—"}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-app-text-secondary text-right">
                              {row.poCount ?? 0}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-emerald-400 text-right">
                              {formatCurrency(row.totalValue)}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-app-text-secondary text-right">
                              {formatQuantity(row.totalQty)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <a
                                href={detailsUrl(row)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-3 py-1.5 rounded-md text-[11px] font-bold bg-app-surface text-app-text-secondary hover:bg-app-accent hover:text-white transition-all shadow-sm border border-app-border hover:border-app-accent opacity-80 group-hover:opacity-100"
                              >
                                View Details
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PurchasesReport;
