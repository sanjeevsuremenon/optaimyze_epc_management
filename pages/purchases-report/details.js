import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import moment from "moment";
import { FiArrowLeft, FiCalendar, FiMessageSquare, FiEye, FiDownload, FiInfo } from "react-icons/fi";
import POCommentModal from "../../components/PO/POCommentModal";

const PurchasesDetails = () => {
  const router = useRouter();
  const { type, materialKey, year } = router.query;
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPoNumber, setSelectedPoNumber] = useState(null);

  // Derive title from type
  const getTypeInfo = () => {
    switch (type) {
      case "import": return { title: "46* Import", backLabel: "Import Purchases Report" };
      case "domestic": return { title: "45* Domestic", backLabel: "Domestic Purchases Report" };
      case "cash": return { title: "47* Cash", backLabel: "Cash POs Report" };
      case "channel": return { title: "71* Channel Partner", backLabel: "Channel Partner Report" };
      case "services": return { title: "61* Services", backLabel: "Services Report" };
      case "all": 
      default:
        return { title: "All PO Types", backLabel: "All Purchases Report" };
    }
  };

  const { title, backLabel } = getTypeInfo();

  useEffect(() => {
    if (!router.isReady) return;
    if (!materialKey) {
      setError("Material Key is missing.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/details?type=${type || 'all'}&materialKey=${encodeURIComponent(materialKey)}&year=${encodeURIComponent(year || 'all')}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch PO details (${res.status})`);
        }
        const body = await res.json();
        setData(Array.isArray(body) ? body : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router.isReady, type, materialKey, year]);

  const handleOpenComment = (poNumber) => {
    setSelectedPoNumber(poNumber);
    setIsCommentModalOpen(true);
  };

  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num)) return "—";
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="app-page min-h-screen flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent"></div>
          <span className="ml-4 text-app-text-secondary font-medium">Loading PO details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen flex-1 flex flex-col font-sans">
      <Head>
        <title>Material PO Details | MM Portal</title>
      </Head>
      <main className="w-full max-w-full px-4 py-8">
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          
          <Link href="/purchases-report" className="inline-flex items-center text-app-accent hover:text-app-accent mb-4 transition-colors font-semibold text-sm">
            <FiArrowLeft className="mr-2" /> Back to {backLabel}
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-app-text tracking-tight mb-2">Material PO Details ({title})</h1>
            <div className="flex items-center gap-2 text-app-text-muted">
              <span className="font-semibold text-app-text-secondary">Material:</span> <span className="font-mono bg-app-surface px-2 py-0.5 rounded">{materialKey}</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="font-semibold text-app-text-secondary">Period:</span> <span>{year === "all" ? "All Years" : year}</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="font-semibold text-app-text-secondary">Total POs:</span> <span className="text-app-accent font-bold">{data.length}</span>
            </div>
          </div>

          {error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 flex items-center shadow-inner">
              <FiInfo className="mr-3 text-lg" />
              <span className="font-medium">{error}</span>
            </div>
          ) : (
            <div className="bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-app-bg border-b border-app-border">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">PO Date</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider text-right">Unit Rate</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider text-right">Qty</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider text-right">Value (SAR)</th>
                      <th className="px-5 py-4 text-[11px] font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/60">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-app-text-muted italic">
                          No POs found for this material in the selected period.
                        </td>
                      </tr>
                    ) : (
                      data.map((po, idx) => (
                        <tr key={idx} className="hover:bg-app-surface-muted transition-colors group">
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-app-accent">
                            {po.poNumber}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm text-app-text-secondary">
                            {po.poDate ? moment(po.poDate).format("MMM D, YYYY") : "—"}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-mono text-app-text-muted">
                            {po.vendorCode || "—"}
                          </td>
                          <td className="px-5 py-3 text-sm text-app-text capitalize font-medium break-words">
                            {po.vendorName?.toLowerCase() || "—"}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-mono text-app-text-secondary text-right">
                            {formatCurrency(po.unitRate)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-mono text-app-text-secondary text-right">
                            {formatCurrency(po.qty)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-mono text-emerald-400 font-bold text-right">
                            {formatCurrency(po.valueSar)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => router.push(`/openpurchaseorders1/schedule/${po.poNumber}`)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-violet-600 text-app-text-secondary hover:text-app-text rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-violet-500"
                                title="Update Schedule"
                              >
                                <FiCalendar size={12} /> Schedule
                              </button>
                              <button
                                onClick={() => handleOpenComment(po.poNumber)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-blue-600 text-app-text-secondary hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-blue-500"
                                title="View/Add Comments"
                              >
                                <FiMessageSquare size={12} /> Comment
                              </button>
                              <button
                                onClick={() => router.push(`/openpurchaseorders1/view/${po.poNumber}`)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-app-accent text-app-text-secondary hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-app-accent"
                                title="View PO Details & Timeline"
                              >
                                <FiEye size={12} /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reusable Comment Modal */}
      <POCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false);
          setSelectedPoNumber(null);
        }}
        poNumber={selectedPoNumber}
      />
    </div>
  );
};

export default PurchasesDetails;
