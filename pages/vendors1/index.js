import React, { useState, useEffect, useRef, useCallback } from "react";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import moment from "moment";
import { 
  FiSearch, FiUsers, FiPieChart, FiFolder, FiStar, 
  FiGrid, FiList, FiShoppingCart, FiCalendar, 
  FiMessageSquare, FiEye, FiArrowUp, FiArrowDown 
} from 'react-icons/fi';
import POCommentModal from '../../components/PO/POCommentModal';

export default function Vendors1() {
  const router = useRouter();
  
  // Vendors State
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState('table'); // 'table' or 'card'
  
  // PO State
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poSortConfig, setPOSortConfig] = useState({ key: null, direction: 'asc' });

  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPoNumber, setSelectedPoNumber] = useState(null);

  // Observer for Infinite Scroll
  const observer = useRef();
  const lastVendorElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch Vendors
  const fetchVendors = async (pageNum, search, isNewSearch = false) => {
    setLoading(true);
    try {
      const url = `/api/vendors?page=${pageNum}&limit=20${search ? `&str=${encodeURIComponent(search)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Lazily fetch PO counts for the new batch
      const vendorsWithPOs = await Promise.all(
        data.vendors.map(async (vendor) => {
          try {
            const poResponse = await fetch(`/api/purchaseorders/vendor/${vendor["vendor-code"]}`);
            const poData = await poResponse.json();
            return { ...vendor, poCount: poData.length };
          } catch {
            return { ...vendor, poCount: 0 };
          }
        })
      );
      
      setVendors(prev => isNewSearch ? vendorsWithPOs : [...prev, ...vendorsWithPOs]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search reset when searchTerm changes (with debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchVendors(1, searchTerm, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Trigger next page fetch
  useEffect(() => {
    if (page > 1) {
      fetchVendors(page, searchTerm, false);
    }
  }, [page]);

  // Fetch POs when vendor selected
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      if (!selectedVendor) return;
      setPoLoading(true);
      try {
        const response = await fetch(`/api/purchaseorders/vendor/${selectedVendor}`);
        const data = await response.json();
        setPurchaseOrders(data);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
      } finally {
        setPoLoading(false);
      }
    };
    fetchPurchaseOrders();
  }, [selectedVendor]);

  const requestPOSort = (key) => {
    let direction = 'asc';
    if (poSortConfig.key === key && poSortConfig.direction === 'asc') direction = 'desc';
    setPOSortConfig({ key, direction });
  };

  const sortedPurchaseOrders = React.useMemo(() => {
    if (!poSortConfig.key) return purchaseOrders;
    let sortableItems = [...purchaseOrders];
    sortableItems.sort((a, b) => {
      if (poSortConfig.key === 'status') {
        const aStatus = a.balgrval === 0 ? 'Complete' : 'Pending';
        const bStatus = b.balgrval === 0 ? 'Complete' : 'Pending';
        if (aStatus < bStatus) return poSortConfig.direction === 'asc' ? -1 : 1;
        if (aStatus > bStatus) return poSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      let aVal = a[poSortConfig.key];
      let bVal = b[poSortConfig.key];
      
      if (poSortConfig.key === 'podate' || poSortConfig.key === 'delivery-date') {
        aVal = aVal ? new Date(aVal) : null;
        bVal = bVal ? new Date(bVal) : null;
      }
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      if (aVal < bVal) return poSortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return poSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [purchaseOrders, poSortConfig]);

  const POSortIndicator = ({ columnKey }) => {
    if (poSortConfig.key !== columnKey) return null;
    return poSortConfig.direction === 'asc' ? <FiArrowUp className="inline ml-1" /> : <FiArrowDown className="inline ml-1" />;
  };

  const handleOpenComment = (poNumber, e) => {
    e.stopPropagation();
    setSelectedPoNumber(poNumber);
    setIsCommentModalOpen(true);
  };

  return (
    <div className="app-page min-h-screen flex-1 flex flex-col font-sans">
      <Head>
        <title>Master Vendors Hub | MM Portal</title>
      </Head>
      <main className="w-full max-w-full px-4 py-8">
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          
          {/* Header & Search */}
          <div className="mb-8 bg-app-surface border border-app-border rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-app-text tracking-tight mb-2">Master Vendors Hub</h1>
                <p className="text-app-text-muted">Search and manage vendor qualifications, evaluations, and purchase orders.</p>
              </div>
              <div className="flex items-center gap-2 bg-app-bg border border-app-border p-1 rounded-lg">
                <button
                  onClick={() => setLayoutMode('table')}
                  className={`p-2 rounded-md transition-colors ${layoutMode === 'table' ? 'bg-app-surface text-app-accent' : 'text-app-text-muted hover:text-app-text-secondary'}`}
                  title="Table View"
                >
                  <FiList className="text-lg" />
                </button>
                <button
                  onClick={() => setLayoutMode('card')}
                  className={`p-2 rounded-md transition-colors ${layoutMode === 'card' ? 'bg-app-surface text-app-accent' : 'text-app-text-muted hover:text-app-text-secondary'}`}
                  title="Card View"
                >
                  <FiGrid className="text-lg" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendors by name or code..."
                className="w-full bg-app-bg border border-app-border text-app-text text-lg rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent placeholder-app-text-disabled transition-colors shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-app-text-muted text-xl" />
            </div>
          </div>

          {/* Vendors List Section */}
          <div className="bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden mb-8">
            {vendors.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FiUsers className="w-16 h-16 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-app-text-secondary mb-2">No Vendors Found</h3>
                <p className="text-app-text-muted">Try adjusting your search criteria.</p>
              </div>
            ) : layoutMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-app-bg border-b border-app-border">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                      <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                      <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">PO Count</th>
                      <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/60">
                    {vendors.map((vendor, index) => {
                      const isSelected = selectedVendor === vendor["vendor-code"];
                      const isLast = index === vendors.length - 1;
                      return (
                        <tr 
                          key={vendor["vendor-code"]}
                          ref={isLast ? lastVendorElementRef : null}
                          onClick={() => setSelectedVendor(isSelected ? null : vendor["vendor-code"])}
                          className={`cursor-pointer transition-colors group ${isSelected ? 'bg-cyan-900/20 border-l-4 border-app-accent' : 'hover:bg-app-surface-muted border-l-4 border-transparent'}`}
                        >
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-app-accent">
                            {vendor["vendor-code"]}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-app-text capitalize">
                            {vendor["vendor-name"]?.toLowerCase()}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-app-text-muted text-right">
                            {vendor.poCount || 0}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(`/vendor-dashboard?vendorcode=${vendor["vendor-code"]}`, '_blank'); }}
                                className="p-2 bg-app-surface hover:bg-violet-600 text-app-text-secondary hover:text-app-text rounded-lg transition-all shadow-sm border border-app-border hover:border-violet-500"
                                title="Vendor Dashboard"
                              >
                                <FiPieChart />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(`/vendordocview/${vendor["vendor-code"]}`, '_blank'); }}
                                className="p-2 bg-app-surface hover:bg-emerald-600 text-app-text-secondary hover:text-white rounded-lg transition-all shadow-sm border border-app-border hover:border-emerald-500"
                                title="Qualification & Documents"
                              >
                                <FiFolder />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(`/vendorevaluation/webformat/${vendor["vendor-code"]}`, '_blank'); }}
                                className="p-2 bg-app-surface hover:bg-amber-600 text-app-text-secondary hover:text-white rounded-lg transition-all shadow-sm border border-app-border hover:border-amber-500"
                                title="Vendor Evaluation"
                              >
                                <FiStar />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {vendors.map((vendor, index) => {
                  const isSelected = selectedVendor === vendor["vendor-code"];
                  const isLast = index === vendors.length - 1;
                  return (
                    <div 
                      key={vendor["vendor-code"]}
                      ref={isLast ? lastVendorElementRef : null}
                      onClick={() => setSelectedVendor(isSelected ? null : vendor["vendor-code"])}
                      className={`cursor-pointer p-5 rounded-xl border transition-all duration-200 ${isSelected ? 'bg-cyan-900/10 border-app-accent shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-app-bg border-slate-800 hover:border-slate-600 shadow-md'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-mono font-bold text-app-accent bg-cyan-950 px-2 py-1 rounded border border-cyan-900">
                          {vendor["vendor-code"]}
                        </span>
                        <span className="text-xs font-bold text-app-text-muted bg-app-surface px-2 py-1 rounded border border-app-border">
                          {vendor.poCount || 0} POs
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-app-text capitalize mb-6 line-clamp-2 min-h-[56px]">
                        {vendor["vendor-name"]?.toLowerCase()}
                      </h3>
                      <div className="flex justify-between pt-4 border-t border-app-border/80">
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`/vendor-dashboard?vendorcode=${vendor["vendor-code"]}`, '_blank'); }}
                          className="flex-1 flex justify-center py-2 text-app-text-muted hover:text-violet-400 transition-colors"
                          title="Dashboard"
                        >
                          <FiPieChart className="text-xl" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`/vendordocview/${vendor["vendor-code"]}`, '_blank'); }}
                          className="flex-1 flex justify-center py-2 text-app-text-muted hover:text-emerald-400 transition-colors"
                          title="Qualification"
                        >
                          <FiFolder className="text-xl" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`/vendorevaluation/webformat/${vendor["vendor-code"]}`, '_blank'); }}
                          className="flex-1 flex justify-center py-2 text-app-text-muted hover:text-amber-400 transition-colors"
                          title="Evaluation"
                        >
                          <FiStar className="text-xl" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Loading Indicator for Infinite Scroll */}
            {loading && (
              <div className="flex justify-center p-6 bg-app-surface">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
              </div>
            )}
          </div>

          {/* PO List Section */}
          {selectedVendor && (
            <div className="bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden mt-8 animate-fade-in-up">
              <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-bg/50">
                <div>
                  <h2 className="text-xl font-bold text-app-text flex items-center">
                    <FiShoppingCart className="mr-3 text-cyan-500" />
                    Vendor Purchase Orders
                  </h2>
                  <p className="text-sm text-app-text-muted mt-1">Viewing all POs for <span className="text-app-text-secondary font-mono font-bold">{selectedVendor}</span></p>
                </div>
              </div>

              {poLoading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-accent"></div>
                </div>
              ) : purchaseOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FiShoppingCart className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-app-text-muted">This vendor has no purchase orders.</p>
                </div>
              ) : (
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left">
                    <thead className="bg-app-bg border-b border-app-border">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider cursor-pointer hover:text-app-accent" onClick={() => requestPOSort('podate')}>
                          Date <POSortIndicator columnKey="podate" />
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider cursor-pointer hover:text-app-accent" onClick={() => requestPOSort('delivery-date')}>
                          Delivery <POSortIndicator columnKey="delivery-date" />
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right cursor-pointer hover:text-app-accent" onClick={() => requestPOSort('poval')}>
                          Value (SAR) <POSortIndicator columnKey="poval" />
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">Balance</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-center cursor-pointer hover:text-app-accent" onClick={() => requestPOSort('status')}>
                          Status <POSortIndicator columnKey="status" />
                        </th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/60">
                      {sortedPurchaseOrders.map((po, index) => (
                        <tr key={index} className="hover:bg-app-surface/40 transition-colors group">
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-app-accent">
                            {po.ponum}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-app-text-secondary">
                            {po.podate ? moment(po.podate).format('MMM D, YYYY') : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-app-text-secondary">
                            {po["delivery-date"] ? moment(po["delivery-date"]).format('MMM D, YYYY') : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-app-text-secondary text-right">
                            {po.poval ? po.poval.toLocaleString() : '0'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-app-text-muted text-right">
                            {po.balgrval ? po.balgrval.toLocaleString() : '0'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${po.balgrval === 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                              {po.balgrval === 0 ? 'Complete' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(`/openpurchaseorders1/schedule/${po.ponum}`, '_blank'); }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-violet-600 text-app-text-secondary hover:text-app-text rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-violet-500"
                                title="Update Schedule"
                              >
                                <FiCalendar size={12} /> Schedule
                              </button>
                              <button
                                onClick={(e) => handleOpenComment(po.ponum, e)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-blue-600 text-app-text-secondary hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-blue-500"
                                title="View/Add Comments"
                              >
                                <FiMessageSquare size={12} /> Comment
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(`/openpurchaseorders1/view/${po.ponum}`, '_blank'); }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-app-accent text-app-text-secondary hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-app-accent"
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
          )}
        </div>
      </main>

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
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
  return { props: { session } };
}