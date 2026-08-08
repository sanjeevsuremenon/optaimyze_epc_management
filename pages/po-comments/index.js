import React, { useState, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";
import Head from "next/head";
import moment from "moment";
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function POCommentsPage() {
  const [poList, setPoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState({});
  const [analyzing, setAnalyzing] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [generatingAnalysisPdf, setGeneratingAnalysisPdf] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  useEffect(() => {
    fetchPOList();
  }, []);

  const fetchPOList = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/po-comments");
      if (!response.ok) {
        throw new Error("Failed to fetch PO comments list");
      }
      const data = await response.json();
      setPoList(data);
    } catch (error) {
      console.error("Error fetching PO list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (ponumber) => {
    try {
      setGeneratingPdf((prev) => ({ ...prev, [ponumber]: true }));
      
      const response = await fetch(`/api/po-comments/generate-pdf/${ponumber}`);
      
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PO_Comments_${ponumber}_${moment().format("YYYY-MM-DD")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf((prev) => ({ ...prev, [ponumber]: false }));
    }
  };

  const handleAnalyze = async (ponumber) => {
    try {
      setAnalyzing((prev) => ({ ...prev, [ponumber]: true }));
      
      const response = await fetch(`/api/po-comments/analyze/${ponumber}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate analysis");
      }

      const data = await response.json();
      setAnalysisResult({
        ponumber: ponumber,
        analysis: data.analysis,
        generatedAt: data.generatedAt,
      });
      setShowAnalysisModal(true);
    } catch (error) {
      console.error("Error generating analysis:", error);
      alert(`Failed to generate analysis: ${error.message}`);
    } finally {
      setAnalyzing((prev) => ({ ...prev, [ponumber]: false }));
    }
  };

  const handleGenerateAnalysisPDF = async (ponumber, analysis) => {
    try {
      setGeneratingAnalysisPdf(true);
      
      const response = await fetch(
        `/api/po-comments/analyze-pdf/${ponumber}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ analysis }),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PO_Analysis_${ponumber}_${moment().format("YYYY-MM-DD")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating analysis PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingAnalysisPdf(false);
    }
  };

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  // Sort PO list based on current sort configuration
  const sortedPOList = useMemo(() => {
    if (!sortConfig.key) return poList;
    
    let sortableItems = [...poList];
    
    sortableItems.sort((a, b) => {
      // Handle ponumber sorting
      if (sortConfig.key === 'ponumber') {
        const aNum = a.ponumber || '';
        const bNum = b.ponumber || '';
        if (aNum < bNum) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aNum > bNum) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle title sorting
      if (sortConfig.key === 'title') {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        if (aTitle < bTitle) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aTitle > bTitle) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle commentCount sorting
      if (sortConfig.key === 'commentCount') {
        const aCount = a.commentCount || 0;
        const bCount = b.commentCount || 0;
        if (aCount < bCount) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aCount > bCount) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle lastUpdated sorting
      if (sortConfig.key === 'lastUpdated') {
        const aDate = new Date(a.lastUpdated || 0);
        const bDate = new Date(b.lastUpdated || 0);
        if (aDate < bDate) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aDate > bDate) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle lastUpdatedBy sorting
      if (sortConfig.key === 'lastUpdatedBy') {
        const aUser = (a.lastUpdatedBy || '').toLowerCase();
        const bUser = (b.lastUpdatedBy || '').toLowerCase();
        if (aUser < bUser) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aUser > bUser) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle podate sorting
      if (sortConfig.key === 'podate') {
        const aDate = a.podate ? new Date(a.podate) : new Date(0);
        const bDate = b.podate ? new Date(b.podate) : new Date(0);
        if (aDate < bDate) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aDate > bDate) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle poval sorting
      if (sortConfig.key === 'poval') {
        const aVal = a.poval || 0;
        const bVal = b.poval || 0;
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle vendorname sorting
      if (sortConfig.key === 'vendorname') {
        const aName = (a.vendorname || '').toLowerCase();
        const bName = (b.vendorname || '').toLowerCase();
        if (aName < bName) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aName > bName) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      return 0;
    });
    
    return sortableItems;
  }, [poList, sortConfig]);

  return (
    <div className="app-page min-h-full flex-1 flex flex-col text-app-text">
      <Head>
        <title>PO Comments | Optaimyze</title>
      </Head>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">
            PO Comments Management
          </h1>
          <p className="text-sm text-app-text-muted mt-1">
            Purchase orders with comment threads. Generate comment PDFs or AI analysis.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-app-surface border border-app-border rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-app-accent" />
              <span className="text-sm text-app-text-muted">Loading PO comments…</span>
            </div>
          </div>
        ) : poList.length === 0 ? (
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm p-10 text-center">
            <p className="text-app-text-muted text-sm">No POs with comments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
            <table className="min-w-full divide-y divide-app-border text-sm">
              <thead className="bg-app-surface-muted">
                <tr>
                  {[
                    { key: "ponumber", label: "PO Number" },
                    { key: "podate", label: "PO Date" },
                    { key: "poval", label: "Value (SAR)" },
                    { key: "vendorname", label: "Vendor Name" },
                    { key: "title", label: "Title" },
                    { key: "commentCount", label: "Comments" },
                    { key: "lastUpdated", label: "Last Updated" },
                    { key: "lastUpdatedBy", label: "Updated By" },
                    { key: null, label: "Action" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      scope="col"
                      className={`px-4 py-3.5 text-left text-xs font-bold text-app-text-secondary uppercase tracking-wider ${
                        col.key ? "cursor-pointer hover:text-app-accent transition-colors" : ""
                      }`}
                      onClick={col.key ? () => requestSort(col.key) : undefined}
                    >
                      {col.label}
                      {col.key ? <SortIndicator columnKey={col.key} /> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
                {sortedPOList.map((po) => (
                  <tr
                    key={po.ponumber}
                    className="hover:bg-app-surface-muted/70 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-app-accent font-mono">
                      {po.ponumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-app-text-muted">
                      {po.podate ? moment(po.podate).format("DD-MM-YYYY") : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-app-text-secondary tabular-nums">
                      {po.poval ? Number(po.poval).toLocaleString() : "0"}
                    </td>
                    <td className="px-4 py-3 text-app-text max-w-xs truncate">
                      {po.vendorname || "—"}
                    </td>
                    <td className="px-4 py-3 text-app-text-secondary max-w-xs truncate">
                      {po.title || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-app-text-secondary tabular-nums">
                      {po.commentCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-app-text-muted">
                      {po.lastUpdated
                        ? moment(po.lastUpdated).format("DD-MM-YYYY HH:mm")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-app-text-secondary">
                      {po.lastUpdatedBy || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleGeneratePDF(po.ponumber)}
                          disabled={generatingPdf[po.ponumber]}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            generatingPdf[po.ponumber]
                              ? "bg-app-surface-muted text-app-text-disabled cursor-not-allowed border border-app-border"
                              : "bg-app-accent hover:bg-app-accent-hover text-app-accent-text"
                          }`}
                        >
                          {generatingPdf[po.ponumber] ? "Generating…" : "Comments"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnalyze(po.ponumber)}
                          disabled={analyzing[po.ponumber]}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                            analyzing[po.ponumber]
                              ? "bg-app-surface-muted text-app-text-disabled cursor-not-allowed border-app-border"
                              : "border-app-border bg-app-surface-muted text-app-text hover:border-app-accent hover:text-app-accent"
                          }`}
                        >
                          {analyzing[po.ponumber] ? "Analyzing…" : "Analysis"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col text-app-text">
            <div className="bg-app-accent text-app-accent-text px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                PO Analysis — {analysisResult.ponumber}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysisResult(null);
                }}
                className="text-app-accent-text/80 hover:text-app-accent-text text-2xl font-bold leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 text-xs text-app-text-muted">
                Generated on:{" "}
                {moment(analysisResult.generatedAt).format("DD-MM-YYYY HH:mm:ss")}
              </div>
              <div className="whitespace-pre-wrap text-app-text-secondary leading-relaxed text-sm">
                {analysisResult.analysis}
              </div>
            </div>
            <div className="bg-app-surface-muted border-t border-app-border px-6 py-4 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  handleGenerateAnalysisPDF(
                    analysisResult.ponumber,
                    analysisResult.analysis
                  )
                }
                disabled={generatingAnalysisPdf}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  generatingAnalysisPdf
                    ? "bg-app-surface text-app-text-disabled cursor-not-allowed border border-app-border"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {generatingAnalysisPdf ? "Generating PDF…" : "Generate PDF"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysisResult(null);
                }}
                className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-app-accent-text rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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

