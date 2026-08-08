import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import moment from "moment";
import Link from "next/link";
import { FiFileText, FiArrowUp, FiArrowDown, FiSearch } from "react-icons/fi";

function VendorsNoPOList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "created_date", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <FiArrowUp className="inline ml-1" />
    ) : (
      <FiArrowDown className="inline ml-1" />
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/reports/vendors/no-purchaseorders");
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setVendors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedVendors = useMemo(() => {
    const items = [...vendors];
    const { key, direction } = sortConfig;
    items.sort((a, b) => {
      const dir = direction === "asc" ? 1 : -1;

      if (key === "vendor-code") {
        return (a["vendor-code"] || "").localeCompare(b["vendor-code"] || "") * dir;
      }
      if (key === "vendor-name") {
        return (a["vendor-name"] || "").localeCompare(b["vendor-name"] || "") * dir;
      }
      if (key === "created_date") {
        const da = a["created_date"] ? new Date(a["created_date"]) : new Date(0);
        const db = b["created_date"] ? new Date(b["created_date"]) : new Date(0);
        return (da - db) * dir;
      }
      if (key === "created_by") {
        return (a["created_by"] || "").localeCompare(b["created_by"] || "") * dir;
      }
      return 0;
    });
    return items;
  }, [vendors, sortConfig]);

  const filteredVendors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sortedVendors;
    return sortedVendors.filter((v) => {
      const code = String(v["vendor-code"] || "").toLowerCase();
      const name = String(v["vendor-name"] || "").toLowerCase();
      const createdBy = String(v["created_by"] || "").toLowerCase();
      return code.includes(q) || name.includes(q) || createdBy.includes(q);
    });
  }, [sortedVendors, searchTerm]);

  return (
    <div className="app-page min-h-full flex-1 flex flex-col text-app-text">
      <Head>
        <title>Vendors without Purchase Orders | Optaimyze</title>
      </Head>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">
            Vendors without Purchase Orders
          </h1>
          <p className="text-sm text-app-text-muted mt-1">
            Vendors with no purchase orders. A docs link appears when documents have been
            uploaded.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
              <FiSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vendor code, name, or created by"
              className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text placeholder:text-app-text-disabled focus:outline-none focus:border-app-accent text-sm"
            />
          </div>
          <p className="text-sm text-app-text-muted px-1">
            {loading
              ? "Loading…"
              : `Showing ${filteredVendors.length.toLocaleString()} of ${vendors.length.toLocaleString()} vendors`}
          </p>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            Error: {error}
          </div>
        )}

        <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface-muted">
              <tr>
                {[
                  { key: "vendor-code", label: "Vendor Code" },
                  { key: "vendor-name", label: "Vendor Name" },
                  { key: "created_date", label: "Registered" },
                  { key: "created_by", label: "Created By" },
                  { key: "docs", label: "Docs", sortable: false },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3.5 text-left text-xs font-bold text-app-text-secondary uppercase tracking-wider"
                  >
                    {col.sortable === false ? (
                      col.label
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-app-accent transition"
                        onClick={() => requestSort(col.key)}
                      >
                        {col.label}
                        <SortIndicator columnKey={col.key} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-app-text-muted">
                    <div className="inline-flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-app-accent" />
                      Loading vendor report…
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-app-text-muted">
                    {searchTerm
                      ? `No vendors matching "${searchTerm}".`
                      : "No vendors without purchase orders found."}
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v, idx) => (
                  <tr
                    key={`${v["vendor-code"]}-${idx}`}
                    className="hover:bg-app-surface-muted/70 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-app-accent font-mono">
                      <Link
                        href={`/vendor-dashboard?vendorcode=${encodeURIComponent(v["vendor-code"] || "")}`}
                        className="hover:underline"
                      >
                        {v["vendor-code"] || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-app-text max-w-md">
                      {v["vendor-name"] || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-muted">
                      {v["created_date"]
                        ? moment(v["created_date"]).format("YYYY-MM-DD")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-secondary">
                      {v["created_by"] || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {v.documentsUploaded ? (
                        <Link
                          href={`/vendordocview/${encodeURIComponent(v["vendor-code"] || "")}`}
                          className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-semibold"
                        >
                          <FiFileText />
                          Docs
                        </Link>
                      ) : (
                        <span className="text-xs text-app-text-disabled">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VendorsNoPOList;
