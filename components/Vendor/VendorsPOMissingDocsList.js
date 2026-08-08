import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import moment from "moment";
import Link from "next/link";
import { FiArrowUp, FiArrowDown, FiSearch, FiUpload } from "react-icons/fi";

function VendorsPOMissingDocsList() {
  const [docTypes, setDocTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "vendor-name", direction: "asc" });
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
        const res = await fetch("/api/reports/vendors/po-missing-docs");
        if (!res.ok) throw new Error("Failed to fetch report");
        const { documentTypes, vendors: list } = await res.json();
        setDocTypes(documentTypes || []);
        setVendors(list || []);
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
    const dir = direction === "asc" ? 1 : -1;
    items.sort((a, b) => {
      if (key === "vendor-code") {
        return (a["vendor-code"] || "").localeCompare(b["vendor-code"] || "") * dir;
      }
      if (key === "vendor-name") {
        return (a["vendor-name"] || "").localeCompare(b["vendor-name"] || "") * dir;
      }
      if (key === "poCount") {
        return ((a.poCount || 0) - (b.poCount || 0)) * dir;
      }
      if (key === "created_date") {
        const at = a.created_date ? new Date(a.created_date).getTime() : 0;
        const bt = b.created_date ? new Date(b.created_date).getTime() : 0;
        return (at - bt) * dir;
      }
      return 0;
    });
    return items;
  }, [vendors, sortConfig]);

  const filteredVendors = useMemo(() => {
    if (!searchTerm) return sortedVendors;
    const s = searchTerm.trim().toLowerCase();
    return sortedVendors.filter((v) => {
      const code = (v["vendor-code"] || "").toLowerCase();
      const name = (v["vendor-name"] || "").toLowerCase();
      return code.includes(s) || name.includes(s);
    });
  }, [sortedVendors, searchTerm]);

  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Vendors Missing Documents | Optaimyze</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">
            Vendors Without Documents
          </h1>
          <p className="text-sm text-app-text-muted mt-1">
            All vendors in the vendors collection with no documents uploaded. Document-type
            columns show missing (✕) until files are uploaded.
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
              placeholder="Search by vendor code or name"
              className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text placeholder:text-app-text-disabled focus:outline-none focus:border-app-accent text-sm"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-app-text-muted">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="hover:text-app-accent hover:underline"
              >
                Clear
              </button>
            )}
            <span>
              Showing {filteredVendors.length.toLocaleString()} of{" "}
              {vendors.length.toLocaleString()}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="bg-app-surface border border-app-border rounded-2xl py-16 text-center text-app-text-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent mx-auto" />
            <p className="mt-4">Loading report…</p>
          </div>
        ) : error ? (
          <div className="bg-app-surface border border-rose-500/30 rounded-2xl py-12 text-center text-rose-500">
            Error: {error}
          </div>
        ) : (
          <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
            <table className="min-w-full divide-y divide-app-border text-left">
              <thead className="bg-app-surface-muted">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-app-accent"
                      onClick={() => requestSort("vendor-code")}
                    >
                      Vendor Code <SortIndicator columnKey="vendor-code" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-app-accent"
                      onClick={() => requestSort("vendor-name")}
                    >
                      Vendor Name <SortIndicator columnKey="vendor-name" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-app-accent"
                      onClick={() => requestSort("created_date")}
                    >
                      Registered <SortIndicator columnKey="created_date" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-app-accent"
                      onClick={() => requestSort("poCount")}
                    >
                      PO Count <SortIndicator columnKey="poCount" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                    Upload
                  </th>
                  {docTypes.map((dt) => (
                    <th
                      key={dt.code}
                      className="px-3 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider whitespace-nowrap"
                      title={dt.label}
                    >
                      {dt.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6 + docTypes.length}
                      className="px-4 py-16 text-center text-app-text-muted"
                    >
                      No vendors without documents found.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v, idx) => (
                    <tr
                      key={`${v["vendor-code"]}-${idx}`}
                      className="hover:bg-app-surface-muted/70 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-app-accent whitespace-nowrap">
                        <Link
                          href={`/vendor-dashboard?vendorcode=${encodeURIComponent(
                            v["vendor-code"]
                          )}`}
                          className="hover:underline"
                        >
                          {v["vendor-code"]}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-app-text max-w-xs truncate">
                        {v["vendor-name"] || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-text-muted whitespace-nowrap">
                        {v.created_date
                          ? moment(v.created_date).format("YYYY-MM-DD")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-text-secondary">
                        {v.created_by || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-text-secondary">
                        {v.poCount || 0}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <Link
                          href={`/vendor-dashboard?vendorcode=${encodeURIComponent(
                            v["vendor-code"]
                          )}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-app-border bg-app-surface-muted text-app-text text-xs font-semibold hover:border-app-accent hover:text-app-accent transition"
                          title="Open vendor dashboard to upload documents"
                        >
                          <FiUpload className="w-3.5 h-3.5" />
                          Upload
                        </Link>
                      </td>
                      {(v.missing || []).map((m) => (
                        <td key={m.code} className="px-3 py-3 text-sm text-center">
                          {m.missing ? (
                            <span className="text-rose-500 font-bold" title="Missing">
                              ✕
                            </span>
                          ) : (
                            <span className="text-emerald-500" title="Uploaded">
                              ✓
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <p className="text-sm text-app-text-muted">
            Total vendors without documents: {vendors.length.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default VendorsPOMissingDocsList;
