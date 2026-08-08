import React, { useState, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Search, Star, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

/**
 * Vendors with any historical PO (through today) — eligible for evaluation.
 * Evaluation reuses /vendorevaluation/webformat/[vendorcode].
 */
function Vendorswithpo() {
  const [vendorlist, setVendorlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyVendorsNotMapped, setOnlyVendorsNotMapped] = useState(false);
  const [onlyNotEvaluated, setOnlyNotEvaluated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetch(`/api/vendors/vendorswithpo`);
        if (!result.ok) throw new Error("Failed to load vendors with POs");
        const json = await result.json();
        setVendorlist(Array.isArray(json) ? json : json.vendors || []);
      } catch (err) {
        console.error("Error fetching vendor data:", err);
        setError(err.message || "Error loading vendors");
        setVendorlist([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vendorlist.filter((v) => {
      if (onlyVendorsNotMapped && v.mapped) return false;
      if (onlyNotEvaluated && v.evaluated) return false;
      if (!q) return true;
      const code = String(v["vendor-code"] || "").toLowerCase();
      const name = String(v["vendor-name"] || "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [vendorlist, searchTerm, onlyVendorsNotMapped, onlyNotEvaluated]);

  const openEvaluation = (vendorCode) => {
    if (!vendorCode) return;
    window.open(
      `/vendorevaluation/webformat/${encodeURIComponent(vendorCode)}`,
      "_blank"
    );
  };

  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Vendors with Purchase Orders | Optaimyze</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">
            Vendors with Purchase Orders
          </h1>
          <p className="text-sm text-app-text-muted mt-1">
            All vendors who have received purchase orders (any year through today) and are
            eligible for evaluation. Opens the existing Vendor Evaluation screen.
          </p>
        </div>

        <div className="flex flex-col gap-4 bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor code or name…"
                className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text placeholder:text-app-text-disabled focus:outline-none focus:border-app-accent text-sm"
              />
            </div>
            <p className="text-xs text-app-text-muted px-1">
              {isLoading
                ? "Loading…"
                : `Showing ${filtered.length.toLocaleString()} of ${vendorlist.length.toLocaleString()} vendors`}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-app-text-secondary">
              <input
                type="checkbox"
                checked={onlyVendorsNotMapped}
                onChange={(e) => setOnlyVendorsNotMapped(e.target.checked)}
                className="rounded border-app-border text-app-accent focus:ring-app-accent"
              />
              Show only vendors not mapped
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-app-text-secondary">
              <input
                type="checkbox"
                checked={onlyNotEvaluated}
                onChange={(e) => setOnlyNotEvaluated(e.target.checked)}
                className="rounded border-app-border text-app-accent focus:ring-app-accent"
              />
              Show only not yet evaluated
            </label>
          </div>
        </div>

        <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface-muted">
              <tr>
                {["Vendor Code", "Vendor Name", "PO Count", "Last PO", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-app-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading vendors with purchase orders…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-app-text-muted">
                    No vendors with purchase orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const code = v["vendor-code"];
                  return (
                    <tr
                      key={code}
                      className="hover:bg-app-surface-muted/70 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-app-accent font-mono">
                        {code}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-text max-w-md">
                        {v["vendor-name"] || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-secondary">
                        {(v.poCount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-muted">
                        {formatDate(v.lastPoDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {v.evaluated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Evaluated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                              Eligible
                            </span>
                          )}
                          {v.mapped && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-app-accent-soft text-app-accent">
                              Mapped
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEvaluation(code)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-accent text-app-accent-text text-xs font-semibold hover:opacity-90 transition"
                            title="Open vendor evaluation"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Evaluation
                          </button>
                          <Link
                            href={`/vendor-dashboard?vendorcode=${encodeURIComponent(code)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-app-border bg-app-surface-muted text-app-text text-xs font-semibold hover:border-app-accent hover:text-app-accent transition"
                            title="Vendor dashboard"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Dashboard
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-app-text-muted">
          Evaluation opens{" "}
          <code className="text-app-accent">/vendorevaluation/webformat/[vendorcode]</code> — the
          existing evaluation component.
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default Vendorswithpo;
