import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import useDebounce from "../../lib/useDebounce";
import { Search, Calendar, Eye, Loader2 } from "lucide-react";

const PAGE_SIZE = 100;

const getVal = (val) => (val && val.$numberDecimal != null ? val.$numberDecimal : val);

function normalizePoNumber(value) {
  if (value == null) return "";
  return String(value).trim();
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatMoney(value) {
  const n = Number(getVal(value) || 0);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const skipRef = useRef(0);

  const fetchPage = useCallback(
    async ({ reset }) => {
      if (reset) {
        setLoading(true);
        skipRef.current = 0;
      } else {
        setLoadingMore(true);
      }

      try {
        const skip = reset ? 0 : skipRef.current;
        const qs = new URLSearchParams({
          limit: String(PAGE_SIZE),
          skip: String(skip),
        });
        if (debouncedSearch.trim()) {
          qs.set("search", debouncedSearch.trim());
        }

        const res = await fetch(`/api/purchaseorders?${qs}`);
        if (!res.ok) throw new Error("Failed to load purchase orders");
        const json = await res.json();
        const next = json.data || [];

        setRows((prev) => (reset ? next : [...prev, ...next]));
        setTotal(json.total || 0);
        setHasMore(Boolean(json.hasMore));
        skipRef.current = skip + next.length;
      } catch (err) {
        console.error(err);
        if (reset) {
          setRows([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    fetchPage({ reset: true });
  }, [fetchPage]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchPage({ reset: false });
        }
      },
      { rootMargin: "240px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage, rows.length]);

  const openSchedule = (po) => {
    const id = normalizePoNumber(po);
    if (!id) return;
    window.open(`/openpurchaseorders1/schedule/${encodeURIComponent(id)}`, "_blank");
  };

  const openView = (po) => {
    const id = normalizePoNumber(po);
    if (!id) return;
    window.open(`/openpurchaseorders1/view/${encodeURIComponent(id)}`, "_blank");
  };

  const openDetails = (po) => {
    const id = normalizePoNumber(po);
    if (!id) return;
    // Use plain path segment — Next.js decodes query; avoid double-encoding
    router.push(`/purchaseorders/${id}`);
  };

  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Purchase Orders | Optaimyze</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-app-text-muted mt-1">
            All PO line items, newest first. Scroll to load more.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search PO number, vendor, material…"
              className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text placeholder:text-app-text-disabled focus:outline-none focus:border-app-accent text-sm"
            />
          </div>
          <p className="text-xs text-app-text-muted px-1">
            {loading
              ? "Loading…"
              : `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} line item${total === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface-muted">
              <tr>
                {[
                  "PO Number",
                  "Line",
                  "PO Date",
                  "Delivery",
                  "Vendor",
                  "Material",
                  "Qty",
                  "Value (SAR)",
                  "Pending",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider ${
                      h === "Actions" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-app-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading purchase orders…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-app-text-muted">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const po = normalizePoNumber(row["po-number"]);
                  return (
                    <tr key={row._id} className="hover:bg-app-surface-muted/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-app-accent">
                        <button
                          type="button"
                          onClick={() => openSchedule(po)}
                          className="hover:underline"
                          title="Open PO schedule"
                        >
                          {po || "—"}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-secondary">
                        {row["po-line-item"] || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-muted">
                        {formatDate(row["po-date"])}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-muted">
                        {formatDate(row["delivery-date"])}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[14rem]">
                        <div className="font-medium text-app-text truncate">{row.vendorname || "—"}</div>
                        <div className="text-xs text-app-text-muted font-mono">{row.vendorcode || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[16rem]">
                        <div className="text-app-text-secondary truncate">
                          {row.material?.matdescription || "—"}
                        </div>
                        <div className="text-xs text-app-text-muted font-mono">
                          {row.material?.matcode || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-secondary">
                        {formatMoney(row["po-quantity"])} {row["po-unit-of-measure"] || ""}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-app-text">
                        {formatMoney(row["po-value-sar"])}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-muted">
                        {formatMoney(row["pending-val-sar"])}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => openSchedule(po)}
                          className="text-app-text-muted hover:text-app-accent transition p-1"
                          title="PO schedule"
                          disabled={!po}
                        >
                          <Calendar className="w-4 h-4 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openView(po)}
                          className="text-app-text-muted hover:text-app-accent transition p-1"
                          title="PO view"
                          disabled={!po}
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetails(po)}
                          className="text-xs font-semibold text-app-accent hover:underline px-1 disabled:opacity-40"
                          title={`PO details ${po}`}
                          disabled={!po}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div ref={loadMoreRef} className="py-4 text-center text-sm text-app-text-muted">
          {loadingMore ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading more…
            </span>
          ) : hasMore ? (
            "Scroll for more purchase orders"
          ) : rows.length > 0 ? (
            "End of list"
          ) : null}
        </div>
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
  return { props: { session } };
}
