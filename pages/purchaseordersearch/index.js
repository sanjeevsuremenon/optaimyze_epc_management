import React, { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import { FiSearch, FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Head from 'next/head';
import POCommentModal from '../../components/PO/POCommentModal';

function PurchaseOrderSearch() {
  const { data: session } = useSession();
  const router = useRouter();
  const [vendorSearch, setVendorSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [ponumberSearch, setPonumberSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Fetch purchase orders based on search criteria
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      // Only search if at least one field has a value
      const hasSearch = vendorSearch.trim() || projectSearch.trim() || 
                       materialSearch.trim() || ponumberSearch.trim();
      
      if (!hasSearch) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (vendorSearch.trim()) params.append('vendor', vendorSearch.trim());
        if (projectSearch.trim()) params.append('project', projectSearch.trim());
        if (materialSearch.trim()) params.append('material', materialSearch.trim());
        if (ponumberSearch.trim()) params.append('ponumber', ponumberSearch.trim());

        const response = await fetch(`/api/purchaseorders/search-advanced?${params.toString()}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        setResults([]);
      }
      setLoading(false);
    };

    // Debounce the search
    const debounceTimer = setTimeout(fetchPurchaseOrders, 500);
    return () => clearTimeout(debounceTimer);
  }, [vendorSearch, projectSearch, materialSearch, ponumberSearch]);

  const openComments = (poNum) => {
    setSelectedPO(poNum);
    setIsCommentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex-1 flex flex-col font-sans">
      <Head>
        <title>Purchase Order Search</title>
      </Head>
      <main className="w-full max-w-full px-4 py-8">
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Purchase Order Search</h1>
            <p className="text-slate-400">Search by vendor, project, material, or PO number. Use * to separate up to 4 search terms.</p>
          </div>

          {/* Search Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Vendor Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Vendor Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., vendor*name*term"
                    className="w-full px-4 py-2.5 pl-10 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder-slate-600"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Project Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Project Name/WBS
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., project*name*term"
                    className="w-full px-4 py-2.5 pl-10 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder-slate-600"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Material Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Material Description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., material*description*term"
                    className="w-full px-4 py-2.5 pl-10 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder-slate-600"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* PO Number Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  PO Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., 4500*1289"
                    className="w-full px-4 py-2.5 pl-10 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder-slate-600"
                    value={ponumberSearch}
                    onChange={(e) => setPonumberSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center">
                Search Results 
                {results.length > 0 && <span className="ml-3 px-2.5 py-0.5 rounded-full bg-cyan-900/50 text-cyan-400 text-xs font-medium border border-cyan-800/50">{results.length} found</span>}
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
                <span className="ml-4 text-slate-400 font-medium">Searching...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                  <FiSearch className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Results Found</h3>
                <p className="text-slate-500 text-sm max-w-sm">Enter search criteria above to find purchase orders. The table will update automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[30%]" />
                    <col className="w-[28%]" />
                  </colgroup>
                  <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">PO Number</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">PO Date</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor Code</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor Name</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {results.map((po, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-semibold text-cyan-400">
                          {po.ponum}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          {po.podate ? moment(po.podate).format('MM/DD/YYYY') : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YYYY') : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">
                          {po.vendorcode || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-200 capitalize break-words">
                          {po.vendorname?.toLowerCase() || 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/openpurchaseorders1/schedule/${po.ponum}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-slate-700 hover:border-violet-500"
                              title="Update Schedule"
                            >
                              <FiCalendar size={12} /> Schedule
                            </button>
                            <button
                              onClick={() => openComments(po.ponum)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-slate-700 hover:border-blue-500"
                              title="View/Add Comments"
                            >
                              <FiMessageSquare size={12} /> Comment
                            </button>
                            <button
                              onClick={() => router.push(`/openpurchaseorders1/view/${po.ponum}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-slate-700 hover:border-cyan-500"
                              title="View PO Details & Timeline"
                            >
                              <FiEye size={12} /> View
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
      </main>
      
      {/* Universal PO Comment Modal */}
      <POCommentModal 
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        poNumber={selectedPO}
      />
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

export default PurchaseOrderSearch;
