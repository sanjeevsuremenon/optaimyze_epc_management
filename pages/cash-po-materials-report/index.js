import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import moment from "moment";

const SORT_KEYS = ["materialCode", "materialDescription", "poCount", "totalValue", "totalQtyAll", "totalQtyCash"];

const CashPOMaterialsReport = () => {
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
  const [monthwiseOpen, setMonthwiseOpen] = useState(false);
  const [monthwiseData, setMonthwiseData] = useState([]);
  const [monthwiseLoading, setMonthwiseLoading] = useState(false);
  const [monthwiseError, setMonthwiseError] = useState(null);
  const [distinctPoCount, setDistinctPoCount] = useState(null);

  const isAllYears = selectedYear === "all";

  // Load available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch("/api/reports/cash-po-materials/years");
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

  // Load data when year or "all" is selected
  useEffect(() => {
    if (selectedYear == null) return;

    const fetchData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const url = selectedYear === "all"
          ? "/api/reports/cash-po-materials?year=all"
          : `/api/reports/cash-po-materials?year=${selectedYear}`;
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
  }, [selectedYear]);

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

  /** Binary string to ArrayBuffer (works in all environments; avoids "Unrecognized type array" in production) */
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
        "# of POs (47*)": row.poCount ?? 0,
        "Total value (SAR)": row.totalValue ?? 0,
        "Total qty (all POs)": row.totalQtyAll ?? 0,
        "Total qty (47* cash)": row.totalQtyCash ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cash PO Materials");
      const wbout = XLSX.write(wb, { type: "binary", bookType: "xlsx" });
      const blob = new Blob([s2ab(wbout)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cash_PO_Materials_Report_${selectedYear === "all" ? "all" : selectedYear}_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel download failed:", err);
    }
  }, [displayData, selectedYear]);

  const openMonthwiseModal = () => {
    if (isAllYears) return;
    setMonthwiseOpen(true);
    setMonthwiseError(null);
    setMonthwiseData([]);
    setMonthwiseLoading(true);
    fetch(`/api/reports/cash-po-materials/monthwise?year=${selectedYear}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return res.json();
      })
      .then((list) => setMonthwiseData(Array.isArray(list) ? list : []))
      .catch((err) => setMonthwiseError(err.message))
      .finally(() => setMonthwiseLoading(false));
  };

  const detailsUrl = (row) => {
    const year = selectedYear === "all" ? "all" : String(selectedYear);
    return `/cash-po-materials-report/details?materialKey=${encodeURIComponent(row.materialKey)}&year=${encodeURIComponent(year)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>47 Series Cash PO Materials Report | MM Portal</title>
        <meta name="description" content="Materials purchased most frequently and total value for 47 series POs, by year" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">47 Series Cash PO Materials Report</h1>
          <p className="text-gray-600 mt-2">
            Materials purchased most frequently (number of POs) and total value — for purchase orders starting with 47. Year: 1 Jan – 31 Dec.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Select year
            </label>
            <select
              id="year-select"
              value={selectedYear ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedYear(v === "all" ? "all" : parseInt(v, 10));
              }}
              className="rounded border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All years (entire collection)</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              {isAllYears ? "All 47-series POs in collection" : selectedYear != null ? `1 Jan ${selectedYear} – 31 Dec ${selectedYear}` : ""}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={openMonthwiseModal}
                disabled={isAllYears}
                title={isAllYears ? "Select a specific year for month-wise report" : "Open month-wise report in modal"}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  isAllYears ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                Month-wise report
              </button>
              <span className="text-sm text-gray-600">Sort by:</span>
              <button
                type="button"
                onClick={() => setSortBy("poCount")}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  sortBy === "poCount" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                # of POs
              </button>
              <button
                type="button"
                onClick={() => setSortBy("totalValue")}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  sortBy === "totalValue" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Total value
              </button>
              <button
                type="button"
                onClick={downloadExcel}
                disabled={loadingData || displayData.length === 0}
                className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download to Excel
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2 text-gray-600">Loading data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm font-medium text-gray-600">Number of PO</p>
                <p className="text-2xl font-bold text-gray-900">{distinctPoCount != null ? distinctPoCount.toLocaleString() : "—"}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm font-medium text-gray-600">Unique materials</p>
                <p className="text-2xl font-bold text-gray-900">{displayData.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm font-medium text-gray-600">Total value (SAR)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        <button type="button" onClick={() => handleSort("materialCode")} className="flex items-center gap-1 hover:text-gray-900">
                          Material code
                          {sortKey === "materialCode" && (sortDir === "asc" ? " ↑" : " ↓")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        <button type="button" onClick={() => handleSort("materialDescription")} className="flex items-center gap-1 hover:text-gray-900">
                          Material description
                          {sortKey === "materialDescription" && (sortDir === "asc" ? " ↑" : " ↓")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        <button type="button" onClick={() => handleSort("poCount")} className="ml-auto flex items-center gap-1 hover:text-gray-900">
                          # of POs (47*)
                          {sortKey === "poCount" && (sortDir === "asc" ? " ↑" : " ↓")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        <button type="button" onClick={() => handleSort("totalValue")} className="ml-auto flex items-center gap-1 hover:text-gray-900">
                          Total value (SAR)
                          {sortKey === "totalValue" && (sortDir === "asc" ? " ↑" : " ↓")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        <button type="button" onClick={() => handleSort("totalQtyAll")} className="ml-auto flex items-center gap-1 hover:text-gray-900">
                          Total qty (all POs)
                          {sortKey === "totalQtyAll" && (sortDir === "asc" ? " ↑" : " ↓")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        <button type="button" onClick={() => handleSort("totalQtyCash")} className="ml-auto flex items-center gap-1 hover:text-gray-900">
                          Total qty (47* cash)
                          {sortKey === "totalQtyCash" && (sortDir === "asc" ? " ↑" : " ↓")}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Details</th>
                    </tr>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <th className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={filterMaterialCode}
                          onChange={(e) => setFilterMaterialCode(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </th>
                      <th className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={filterMaterialDescription}
                          onChange={(e) => setFilterMaterialDescription(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </th>
                      <th colSpan={5} className="px-2 py-2 text-left text-xs text-gray-500">
                        {filteredData.length !== data.length && `${filteredData.length} of ${data.length} rows`}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          {data.length === 0
                            ? (isAllYears ? "No 47-series PO data in the collection." : "No 47-series PO data for the selected year.")
                            : "No rows match the current filters."}
                        </td>
                      </tr>
                    ) : (
                      displayData.map((row, idx) => (
                        <tr key={row.materialKey ?? idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.materialCode != null && String(row.materialCode).trim() !== "" ? row.materialCode : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 max-w-md truncate" title={row.materialDescription}>
                            {row.materialDescription != null && String(row.materialDescription).trim() !== "" ? row.materialDescription : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{row.poCount ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(row.totalValue)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatQuantity(row.totalQtyAll)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatQuantity(row.totalQtyCash)}</td>
                          <td className="px-4 py-3 text-center">
                            <a
                              href={detailsUrl(row)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Details
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Month-wise report modal */}
            {monthwiseOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setMonthwiseOpen(false)}>
                <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                      Month-wise report {!isAllYears && selectedYear != null ? `(${selectedYear})` : ""}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setMonthwiseOpen(false)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    {monthwiseLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        <span className="ml-2 text-gray-600">Loading month-wise data...</span>
                      </div>
                    ) : monthwiseError ? (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{monthwiseError}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Material code</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Material description</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase"># of POs (47*)</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total value (SAR)</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total qty (all POs)</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total qty (47* cash)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {monthwiseData.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No month-wise data.</td>
                              </tr>
                            ) : (
                              monthwiseData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.monthLabel ?? "—"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.materialCode != null && String(row.materialCode).trim() !== "" ? row.materialCode : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-800 max-w-md truncate" title={row.materialDescription}>
                                    {row.materialDescription != null && String(row.materialDescription).trim() !== "" ? row.materialDescription : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{row.poCount ?? 0}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(row.totalValue)}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatQuantity(row.totalQtyAll)}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatQuantity(row.totalQtyCash)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="mt-4 text-sm text-gray-500">
              Report generated: {moment().format("MMM D, YYYY HH:mm")}. Grouping: by material code when present, otherwise by material description.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CashPOMaterialsReport;
