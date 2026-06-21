import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiLayers, FiFolder, FiSearch, FiLoader } from 'react-icons/fi';
import VendorGroupMapping from '../../components/VendorGroupMapping';
import useDebounce from '../../lib/useDebounce';

const PAGE_LIMIT = 50;

export default function NonSapVendorsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('card');
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  const [mappingVendor, setMappingVendor] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  const observerRef = useRef(null);

  const fetchVendors = useCallback(async (skip = 0, isNewSearch = false) => {
    try {
      if (isNewSearch) setLoading(true);
      else setLoadingMore(true);

      const qs = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        skip: String(skip),
      });
      
      if (debouncedSearchTerm.length >= 3) {
        qs.set('search', debouncedSearchTerm);
      }

      const res = await fetch(`/api/registeredvendors?${qs}`);
      if (!res.ok) throw new Error('Failed to load vendors');
      
      const data = await res.json();
      
      if (isNewSearch) {
        setVendors(data.vendors || []);
      } else {
        setVendors(prev => [...prev, ...(data.vendors || [])]);
      }
      
      setHasMore(Boolean(data.hasMore));
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error(e);
      if (isNewSearch) {
        setVendors([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchVendors(0, true);
  }, [fetchVendors]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchVendors(vendors.length, false);
    }
  }, [loadingMore, hasMore, vendors.length, fetchVendors]);

  // Infinite scroll intersection observer setup
  useEffect(() => {
    const el = observerRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const ensureVendorCode = async (vendor) => {
    if (vendor.vendorcode && vendor.vendorcode.startsWith('NON')) {
      return vendor.vendorcode;
    }

    try {
      setActionLoading(vendor._id);
      const res = await fetch('/api/registeredvendors/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor._id })
      });
      
      if (!res.ok) throw new Error('Failed to generate vendor code');
      const data = await res.json();
      
      // Update local state so it doesn't need to generate again
      setVendors(prev => prev.map(v => 
        v._id === vendor._id ? { ...v, vendorcode: data.vendorcode } : v
      ));
      
      return data.vendorcode;
    } catch (e) {
      console.error(e);
      alert('Failed to generate fictitious vendor code. Please try again.');
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  const handleMapClick = async (vendor) => {
    const code = await ensureVendorCode(vendor);
    if (code) {
      setMappingVendor(vendor);
    }
  };

  const handleDocumentsClick = async (vendor) => {
    const code = await ensureVendorCode(vendor);
    if (code) {
      window.open(`/vendordocview/${code}`, '_blank');
    }
  };

  return (
    <div className="app-page min-h-screen font-sans text-app-text">
      <Head>
        <title>Non-SAP Vendors | MM Portal</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Area */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Non-SAP Vendors</h1>
            <p className="text-app-text-muted mt-1">Manage registration, mapping, and documents for non-SAP vendors.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-app-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search vendor name (min 3 chars)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-app-border rounded-lg leading-5 bg-app-surface text-app-text placeholder-app-text-disabled focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent sm:text-sm"
            />
          </div>
        </div>

        {/* Total Count and Toggle */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-app-text-muted font-medium">
            {loading && vendors.length === 0 ? 'Searching...' : `Found ${total} Vendor${total !== 1 ? 's' : ''}`}
          </div>
          
          <div className="flex bg-app-surface border border-app-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'card'
                  ? 'bg-app-surface text-app-accent shadow-sm'
                  : 'text-app-text-muted hover:text-app-text-secondary'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-app-surface text-app-accent shadow-sm'
                  : 'text-app-text-muted hover:text-app-text-secondary'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Vendors List/Cards */}
        {vendors.length === 0 && !loading ? (
          <div className="text-center py-20 bg-app-surface-muted rounded-xl border border-app-border border-dashed">
            <FiLayers className="mx-auto h-12 w-12 text-slate-700 mb-4" />
            <p className="text-app-text-muted text-lg">No vendors found matching your search.</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <div key={vendor._id} className="bg-app-surface border border-app-border rounded-xl overflow-hidden hover:border-cyan-900/50 transition-colors flex flex-col shadow-lg shadow-slate-900/50">
                
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-app-accent break-words pr-4 leading-tight">{vendor.vendorname}</h3>
                    {vendor.vendorcode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-cyan-950 text-app-accent border border-cyan-800 whitespace-nowrap">
                        {vendor.vendorcode}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3 text-sm mt-4">
                    <div className="flex flex-col">
                      <span className="text-app-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Contact</span>
                      <span className="text-app-text-secondary">{vendor.contact?.salesname || 'No Name'}</span>
                      <span className="text-app-text-muted">{vendor.contact?.salesemail || 'No Email'}</span>
                      <span className="text-app-text-muted">{vendor.contact?.salesmobile || vendor.contact?.telephone1 || 'No Phone'}</span>
                    </div>
                    
                    <div className="flex flex-col pt-3 border-t border-app-border/60">
                      <span className="text-app-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Location</span>
                      <span className="text-app-text-secondary">{vendor.address?.city ? `${vendor.address.city}, ` : ''}{vendor.address?.countrycode || 'No Country'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-app-bg p-3 border-t border-app-border flex gap-2">
                  <button
                    onClick={() => handleMapClick(vendor)}
                    disabled={actionLoading === vendor._id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-app-surface hover:bg-cyan-900/40 text-app-accent rounded-lg transition-colors border border-app-border hover:border-cyan-800 text-sm font-semibold disabled:opacity-50"
                  >
                    {actionLoading === vendor._id ? <FiLoader className="animate-spin" /> : <FiLayers />}
                    Map Groups
                  </button>
                  <button
                    onClick={() => handleDocumentsClick(vendor)}
                    disabled={actionLoading === vendor._id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-app-surface hover:bg-emerald-900/40 text-emerald-400 rounded-lg transition-colors border border-app-border hover:border-emerald-800 text-sm font-semibold disabled:opacity-50"
                  >
                    {actionLoading === vendor._id ? <FiLoader className="animate-spin" /> : <FiFolder />}
                    Documents
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-xl shadow-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-bg border-b border-app-border text-app-text-muted text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Vendor Name</th>
                    <th className="px-6 py-4 font-bold">Code</th>
                    <th className="px-6 py-4 font-bold">Contact</th>
                    <th className="px-6 py-4 font-bold">Location</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/60">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-app-surface-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-app-accent">{vendor.vendorname}</div>
                        <div className="text-xs text-app-text-muted mt-1">{vendor.companyemail}</div>
                      </td>
                      <td className="px-6 py-4">
                        {vendor.vendorcode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-cyan-950 text-app-accent border border-cyan-800 whitespace-nowrap">
                            {vendor.vendorcode}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-app-text-secondary">{vendor.contact?.salesname || '—'}</div>
                        <div className="text-xs text-app-text-muted mt-1">{vendor.contact?.salesmobile || vendor.contact?.telephone1}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-app-text-secondary">{vendor.address?.city || '—'}</div>
                        <div className="text-xs text-app-text-muted mt-1">{vendor.address?.countrycode}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleMapClick(vendor)}
                            disabled={actionLoading === vendor._id}
                            title="Map Groups"
                            className="p-2 bg-app-bg hover:bg-cyan-900/40 text-app-accent rounded-lg transition-colors border border-app-border hover:border-cyan-800 disabled:opacity-50"
                          >
                            {actionLoading === vendor._id ? <FiLoader className="animate-spin" /> : <FiLayers size={18} />}
                          </button>
                          <button
                            onClick={() => handleDocumentsClick(vendor)}
                            disabled={actionLoading === vendor._id}
                            title="Documents"
                            className="p-2 bg-app-bg hover:bg-emerald-900/40 text-emerald-400 rounded-lg transition-colors border border-app-border hover:border-emerald-800 disabled:opacity-50"
                          >
                            {actionLoading === vendor._id ? <FiLoader className="animate-spin" /> : <FiFolder size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loading Sentinel */}
        <div ref={observerRef} className="h-10 mt-4 flex items-center justify-center">
          {(loading || loadingMore) && (
            <div className="flex items-center gap-2 text-cyan-500">
              <FiLoader className="animate-spin" />
              <span className="text-sm font-medium">Loading more vendors...</span>
            </div>
          )}
        </div>

        {/* Mapping Modal */}
        {mappingVendor && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in-up">
            <div className="bg-app-surface border border-app-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
              
              <div className="flex items-center justify-between p-6 border-b border-app-border">
                <div>
                  <h2 className="text-xl font-bold text-app-text flex items-center gap-2">
                    <FiLayers className="text-app-accent" />
                    Map Material & Service Groups
                  </h2>
                  <p className="text-app-text-muted text-sm mt-1 font-mono">
                    {mappingVendor.vendorname} | <span className="text-app-accent">{mappingVendor.vendorcode}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="p-2 text-app-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  onClick={() => setMappingVendor(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="bg-app-bg p-4 rounded-xl border border-app-border">
                  <VendorGroupMapping
                    nonsapVendorId={mappingVendor._id.toString()}
                    vendorName={mappingVendor.vendorname}
                    vendorCode={mappingVendor.vendorcode}
                    onSaveSuccess={() => setMappingVendor(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
