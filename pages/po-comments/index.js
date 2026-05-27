import React, { useState, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";
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
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 w-11/12 ml-9">
        <div className="mt-6">
          <h1 className="font-bold text-2xl mb-6 text-gray-800">
            PO Comments Management
          </h1>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading PO comments...</p>
            </div>
          ) : poList.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">
                No POs with comments found.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('ponumber')}
                    >
                      PO Number <SortIndicator columnKey="ponumber" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('podate')}
                    >
                      PO Date <SortIndicator columnKey="podate" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('poval')}
                    >
                      Value (SAR) <SortIndicator columnKey="poval" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('vendorname')}
                    >
                      Vendor Name <SortIndicator columnKey="vendorname" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('title')}
                    >
                      Title <SortIndicator columnKey="title" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('commentCount')}
                    >
                      Comment Count <SortIndicator columnKey="commentCount" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('lastUpdated')}
                    >
                      Last Updated <SortIndicator columnKey="lastUpdated" />
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('lastUpdatedBy')}
                    >
                      Last Updated By <SortIndicator columnKey="lastUpdatedBy" />
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPOList.map((po, index) => (
                    <tr
                      key={po.ponumber}
                      className={`bg-white border-b hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-gray-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {po.ponumber}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {po.podate ? moment(po.podate).format("DD-MM-YYYY") : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {po.poval ? po.poval.toLocaleString() : "0"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {po.vendorname || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {po.title || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {po.commentCount}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {moment(po.lastUpdated).format("DD-MM-YYYY HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {po.lastUpdatedBy || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleGeneratePDF(po.ponumber)}
                            disabled={generatingPdf[po.ponumber]}
                            className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                              generatingPdf[po.ponumber]
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {generatingPdf[po.ponumber]
                              ? "Generating..."
                              : "Comments"}
                          </button>
                          <button
                            onClick={() => handleAnalyze(po.ponumber)}
                            disabled={analyzing[po.ponumber]}
                            className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                              analyzing[po.ponumber]
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 text-white"
                            }`}
                          >
                            {analyzing[po.ponumber]
                              ? "Analyzing..."
                              : "Analysis"}
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
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-11/12 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                PO Analysis - {analysisResult.ponumber}
              </h2>
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysisResult(null);
                }}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 text-sm text-gray-600">
                Generated on: {moment(analysisResult.generatedAt).format("DD-MM-YYYY HH:mm:ss")}
              </div>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {analysisResult.analysis}
                </div>
              </div>
            </div>
            <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() =>
                  handleGenerateAnalysisPDF(
                    analysisResult.ponumber,
                    analysisResult.analysis
                  )
                }
                disabled={generatingAnalysisPdf}
                className={`px-6 py-2 rounded font-semibold text-sm transition-all ${
                  generatingAnalysisPdf
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {generatingAnalysisPdf ? "Generating PDF..." : "Generate PDF"}
              </button>
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysisResult(null);
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

