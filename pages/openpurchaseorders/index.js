import React, { useState, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Search, Calendar, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";

function Openpurchaseorders() {
  const router = useRouter();
  const [openpolist, setOpenpolist] = useState([]);
  const [poschfilled, setPoschfilled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [openRes, schRes] = await Promise.all([
          fetch(`/api/purchaseorders/openpo`),
          fetch(`/api/purchaseorders/poschedulefilled`),
        ]);
        const openJson = openRes.ok ? await openRes.json() : [];
        const schJson = schRes.ok ? await schRes.json() : [];

        setOpenpolist(
          (Array.isArray(openJson) ? openJson : []).filter(
            (row) =>
              row.openvalue > 10 &&
              row._id?.["po-number"] &&
              row._id["po-number"].substring(0, 2) !== "47" &&
              row._id["po-number"].substring(0, 2) !== "71" &&
              row._id["po-number"].substring(0, 2) !== "91"
          )
        );
        setPoschfilled(Array.isArray(schJson) ? schJson : []);
      } catch (err) {
        console.error(err);
        setOpenpolist([]);
        setPoschfilled([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const joined = useMemo(() => {
    return openpolist.map((rowpo) => {
      const match = poschfilled.find(
        (rowsch) => String(rowsch.ponumber) === String(rowpo._id?.["po-number"])
      );
      if (match) {
        const merged = { ...rowpo, ...match };
        if (rowpo._id) merged._id = rowpo._id;
        return merged;
      }
      return rowpo;
    });
  }, [openpolist, poschfilled]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return joined;
    return joined.filter((row) => {
      const po = String(row._id?.["po-number"] || "").toLowerCase();
      const vendor = String(row._id?.vendorname || "").toLowerCase();
      const code = String(row._id?.vendorcode || "").toLowerCase();
      const plant = String(row._id?.plant || "").toLowerCase();
      return (
        po.includes(q) ||
        vendor.includes(q) ||
        code.includes(q) ||
        plant.includes(q)
      );
    });
  }, [joined, search]);

  const openSchedule = (po) => {
    if (!po) return;
    router.push(`/openpurchaseorders1/schedule/${encodeURIComponent(po)}`);
  };

  const openComments = (po) => {
    if (!po) return;
    router.push(`/openpurchaseorders1/view/${encodeURIComponent(po)}`);
  };

  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Open Purchase Orders | Optaimyze</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Open Purchase Orders</h1>
          <p className="text-sm text-app-text-muted mt-1">
            Open line items only (open value &gt; 10). Use schedule to update PO execution data.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO, vendor, plant…"
              className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text placeholder:text-app-text-disabled focus:outline-none focus:border-app-accent text-sm"
            />
          </div>
          <p className="text-xs text-app-text-muted px-1">
            {loading
              ? "Loading…"
              : `${filtered.length.toLocaleString()} open PO${filtered.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface-muted">
              <tr>
                {[
                  "PO Number",
                  "Plant",
                  "Vendor Code",
                  "Vendor Name",
                  "Open Value",
                  "Schedule",
                  "Edited?",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-bold text-app-text-secondary uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-app-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading open purchase orders…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-app-text-muted">
                    No open purchase orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const po = row._id?.["po-number"];
                  const hasSchedule = Boolean(row?.bgdata || row?.generaldata || row?.bgtab);
                  return (
                    <tr
                      key={po || JSON.stringify(row._id)}
                      className="hover:bg-app-surface-muted/70 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-app-accent">
                        {po}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-secondary">
                        {row._id?.plant || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-muted font-mono">
                        {row._id?.vendorcode || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-app-text max-w-xs truncate">
                        {row._id?.vendorname || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-app-text">
                        {Number(row.openvalue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openSchedule(po)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-accent text-app-accent-text text-xs font-semibold hover:opacity-90 transition"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => openComments(po)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border bg-app-surface-muted text-app-text text-xs font-semibold hover:bg-app-border transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Comments
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {hasSchedule ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-app-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

  return {
    props: { session },
  };
}

export default Openpurchaseorders;
