import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import moment from "moment";
import { FiDownload, FiFilter, FiBox, FiDollarSign, FiHash, FiLayers } from "react-icons/fi";

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
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent"></div>
          <span className="ml-4 text-app-text-secondary font-medium">Loading comprehensive report data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen flex-1 flex flex-col font-sans">
      <Head>
        <title>Comprehensive Purchases Report | MM Portal</title>
      </Head>
      <main className="w-full max-w-full px-4 py-8">
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          
          {/* Header */}
          <div className="mb-8 bg-app-surface border border-app-border rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative z-10 mb-4 md:mb-0">
              <h1 className="text-3xl font-extrabold text-app-text tracking-tight mb-2">Comprehensive Purchases Report</h1>
              <p className="text-app-text-muted">
                Analyze material purchasing frequency, volume, and total spend across all procurement channels.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-4 bg-app-bg/50 p-4 rounded-xl border border-app-border/50">
              <div className="flex flex-col">
                <label htmlFor="year-select" className="text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1">
                  Report Year
                </label>
                <select
                  id="year-select"
                  value={selectedYear ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedYear(v === "all" ? "all" : parseInt(v, 10));
                  }}
                  className="bg-app-surface border border-app-border text-app-text rounded px-3 py-1.5 focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-sm font-medium"
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
                className="ml-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                <FiDownload className="mr-2" /> Export
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto space-x-2 border-b border-app-border mb-6 pb-px scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-5 font-semibold text-sm rounded-t-lg transition-colors flex items-center whitespace-nowrap ${
                  activeTab.id === tab.id
                    ? 'bg-app-surface text-app-accent border-t border-x border-slate-800'
                    : 'text-app-text-muted hover:text-app-text-secondary hover:bg-app-surface-muted'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400 flex items-center shadow-inner">
              <FiFilter className="mr-3 text-lg" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Loading Data State */}
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20 bg-app-surface border border-app-border rounded-xl shadow-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-accent mb-4" />
              <span className="text-app-text-muted font-medium tracking-wide">Crunching numbers for {activeTab.label}...</span>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-5 flex items-center">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mr-4">
                    <FiHash className="text-blue-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1">Total POs</p>
                    <p className="text-2xl font-black text-app-text">{distinctPoCount != null ? distinctPoCount.toLocaleString() : "—"}</p>
                  </div>
                </div>
                
                <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-5 flex items-center">
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg mr-4">
                    <FiBox className="text-violet-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1">Unique Materials</p>
                    <p className="text-2xl font-black text-app-text">{displayData.length.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-5 flex items-center">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mr-4">
                    <FiDollarSign className="text-emerald-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1">Total Value (SAR)</p>
                    <p className="text-2xl font-black text-app-text">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden">
                <div className="p-4 bg-app-surface/80 border-b border-app-border flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Filter by Material Code..."
                      value={filterMaterialCode}
                      onChange={(e) => setFilterMaterialCode(e.target.value)}
                      className="w-full bg-app-bg border border-app-border text-app-text text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent placeholder-app-text-disabled transition-colors"
                    />
                    <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Filter by Material Description..."
                      value={filterMaterialDescription}
                      onChange={(e) => setFilterMaterialDescription(e.target.value)}
                      className="w-full bg-app-bg border border-app-border text-app-text text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent placeholder-app-text-disabled transition-colors"
                    />
                    <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
                  </div>
                  <div className="text-xs font-bold text-app-text-muted uppercase tracking-wide bg-app-bg px-3 py-2 rounded-lg border border-app-border">
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
