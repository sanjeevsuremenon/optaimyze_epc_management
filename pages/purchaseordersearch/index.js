import React, { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import { FiSearch, FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi';
import { ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import POCommentModal from '../../components/PO/POCommentModal';
import GlassSubPageHero from '../../components/GlassSubPageHero';
import { GlassStyles, Tilt } from '../../components/landing/glass';

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
    <div className="app-page min-h-screen flex-1 flex flex-col font-sans">
      <GlassStyles />
      <Head>
        <title>Purchase Order Search | OPTAIMYZE</title>
      </Head>
      <main className="w-full max-w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Glass Subpage Hero */}
          <GlassSubPageHero
            icon={ShoppingBag}
            eyebrow="PROCUREMENT INTELLIGENCE"
            title="Purchase Order Search"
            description="Search by vendor, project, material, or PO number. Use * to separate up to 4 search terms."
            accent="amber"
            moduleKey="purchaseorders"
          >
            {results.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
                <Sparkles size={13} /> {results.length} PO{results.length !== 1 ? 's' : ''} Found
              </span>
            )}
          </GlassSubPageHero>

          {/* Search Bento Section */}
          <Tilt glow="amber" className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm p-5 md:p-6 transition-all">
            <div className="flex items-center justify-between mb-4 border-b border-app-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Search size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-app-text">Multi-Parameter Search Matrix</h2>
                  <p className="text-[11px] text-app-text-muted">Type terms to filter dynamically across procurement dimensions</p>
                </div>
              </div>
              {(vendorSearch || projectSearch || materialSearch || ponumberSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setVendorSearch('');
                    setProjectSearch('');
                    setMaterialSearch('');
                    setPonumberSearch('');
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {/* Vendor Search */}
              <div>
                <label className="block text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                  Vendor Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., vendor*name*term"
                    className="w-full px-3.5 py-2 pl-9 bg-app-bg border border-app-border text-app-text text-sm rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-app-text-disabled"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted text-sm" />
                </div>
              </div>

              {/* Project Search */}
              <div>
                <label className="block text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                  Project Name / WBS
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., project*name*term"
                    className="w-full px-3.5 py-2 pl-9 bg-app-bg border border-app-border text-app-text text-sm rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-app-text-disabled"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted text-sm" />
                </div>
              </div>

              {/* Material Search */}
              <div>
                <label className="block text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                  Material Description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., material*description*term"
                    className="w-full px-3.5 py-2 pl-9 bg-app-bg border border-app-border text-app-text text-sm rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-app-text-disabled"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted text-sm" />
                </div>
              </div>

              {/* PO Number Search */}
              <div>
                <label className="block text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                  PO Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., 4500*1289"
                    className="w-full px-3.5 py-2 pl-9 bg-app-bg border border-app-border text-app-text text-sm rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-app-text-disabled"
                    value={ponumberSearch}
                    onChange={(e) => setPonumberSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted text-sm" />
                </div>
              </div>
            </div>
          </Tilt>

          {/* Results Section */}
          <div className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-app-border bg-app-surface-muted/50 flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-app-text flex items-center gap-2">
                <span>Search Results</span>
                {results.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                    {results.length} found
                  </span>
                )}
              </h2>
            </div>
            
            {loading ? (
              <div className="flex flex-col justify-center items-center p-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
                <span className="mt-4 text-app-text-muted font-medium text-sm">Searching purchase orders...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-app-surface-muted flex items-center justify-center mb-4 border border-app-border/70 text-app-text-muted">
                  <FiSearch className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-app-text mb-1">
                  {vendorSearch || projectSearch || materialSearch || ponumberSearch ? "No Results Match Your Search" : "No Search Criteria Entered"}
                </h3>
                <p className="text-app-text-muted text-xs max-w-sm">
                  {vendorSearch || projectSearch || materialSearch || ponumberSearch
                    ? "Try adjusting your search terms or using wildcard asterisk (*) syntax."
                    : "Enter search criteria above to find purchase orders. Results will update automatically with debounced search."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-app-bg/90 sticky top-0 z-10 border-b border-app-border">
                    <tr>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">PO Date</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Delivery</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/50">
                    {results.map((po, index) => (
                      <tr 
                        key={po.ponum || index} 
                        className="hover:bg-app-surface-muted/60 transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                          {po.ponum}
                        </td>
                        <td className="px-4 py-3 text-xs text-app-text-secondary">
                          {po.podate ? moment(po.podate).format('MM/DD/YYYY') : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-app-text-secondary">
                          {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YYYY') : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-app-text-muted">
                          {po.vendorcode || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-app-text capitalize max-w-xs truncate">
                          {po.vendorname?.toLowerCase() || '—'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/openpurchaseorders1/schedule/${po.ponum}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-app-surface hover:bg-violet-600 hover:text-white text-app-text-secondary rounded-lg text-[11px] font-medium transition-all shadow-sm border border-app-border hover:border-violet-500"
                              title="Update Schedule"
                            >
                              <FiCalendar size={12} /> Schedule
                            </button>
                            <button
                              onClick={() => openComments(po.ponum)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-app-surface hover:bg-blue-600 hover:text-white text-app-text-secondary rounded-lg text-[11px] font-medium transition-all shadow-sm border border-app-border hover:border-blue-500"
                              title="View/Add Comments"
                            >
                              <FiMessageSquare size={12} /> Comment
                            </button>
                            <button
                              onClick={() => router.push(`/openpurchaseorders1/view/${po.ponum}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-app-surface hover:bg-amber-600 hover:text-white text-app-text-secondary rounded-lg text-[11px] font-medium transition-all shadow-sm border border-app-border hover:border-amber-500"
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
