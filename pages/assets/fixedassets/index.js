import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Tablecomponent from '../../../components/Tablecomponent';
import { Boldstyle1, Cellstyle, Numberstyle } from '../../../components/Tablecomponent';

export default function FixedAssetsPage() {
  const [origin, setOrigin] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [data, setData] = useState([]);
  const [assetNumberSearch, setAssetNumberSearch] = useState('');
  const [assetNameSearch, setAssetNameSearch] = useState('');
  const [minAcquiredDateSearch, setMinAcquiredDateSearch] = useState('');
  const [minAcquiredValueSearch, setMinAcquiredValueSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Custody modal state
  const [custodyAsset, setCustodyAsset] = useState(null);
  const [custodyRecords, setCustodyRecords] = useState([]);
  const [loadingCustody, setLoadingCustody] = useState(false);
  const [isCustodyOpen, setIsCustodyOpen] = useState(false);

  const loadMoreRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchAssets = async (isLoadMore = false) => {
    // Abort any active requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const skipOffset = isLoadMore ? data.length : 0;
      const params = new URLSearchParams({
        limit: "100",
        skip: String(skipOffset)
      });
      if (assetNumberSearch?.trim()) params.append('assetNumber', assetNumberSearch.trim());
      if (assetNameSearch?.trim()) params.append('assetName', assetNameSearch.trim());
      if (minAcquiredDateSearch) params.append('minAcquiredDate', minAcquiredDateSearch);
      if (minAcquiredValueSearch) params.append('minAcquiredValue', minAcquiredValueSearch);

      const response = await fetch(`/api/assets/fixedassets?${params.toString()}`, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Failed to fetch fixed assets');
      const result = await response.json();
      
      if (isLoadMore) {
        setData((prev) => [...prev, ...result]);
      } else {
        setData(result);
      }
      setHasMore(result.length === 100);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching fixed assets:', error);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger interaction state on typing or date/value selection
  useEffect(() => {
    if (assetNumberSearch || assetNameSearch || minAcquiredDateSearch || minAcquiredValueSearch) {
      setHasInteracted(true);
    }
  }, [assetNumberSearch, assetNameSearch, minAcquiredDateSearch, minAcquiredValueSearch]);

  // Trigger interaction state on scroll, mouse wheel, or touch swipe
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasInteracted(true);
      }
    };
    const handleWheel = (e) => {
      if (e.deltaY > 0) {
        setHasInteracted(true);
      }
    };
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY - touchEndY > 10) {
        setHasInteracted(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!hasInteracted) return;

    const timer = setTimeout(() => {
      fetchAssets(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [assetNumberSearch, assetNameSearch, minAcquiredDateSearch, minAcquiredValueSearch, hasInteracted]);

  // Infinite scroll hook
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading || loadingMore || !hasInteracted) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchAssets(true);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, data.length, hasInteracted]);

  const handleOpenCustody = async (assetNumber) => {
    setCustodyAsset(assetNumber);
    setIsCustodyOpen(true);
    setLoadingCustody(true);
    try {
      const res = await fetch(`/api/assets/custody/${assetNumber}`);
      if (!res.ok) throw new Error('Failed to fetch custody records');
      const data = await res.json();
      setCustodyRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCustodyRecords([]);
    } finally {
      setLoadingCustody(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Asset Number",
        accessor: "assetnumber",
        Cell: ({ value }) => (
          <Link href={`/assets/${value}`} className="text-app-accent hover:text-app-accent font-bold transition-colors">
            {value}
          </Link>
        ),
      },
      {
        Header: "Description",
        accessor: "assetdescription",
        Cell: ({ value }) => <span className="text-app-text">{value}</span>,
      },
      {
        Header: "Category",
        accessor: "assetcategory",
        Cell: ({ value }) => <span className="text-app-text font-semibold text-xs bg-app-surface px-2 py-0.5 rounded border border-app-border">{value || 'N/A'}</span>,
      },
      {
        Header: "Subcategory",
        accessor: "assetsubcategory",
        Cell: ({ value }) => <span className="text-app-text-secondary font-medium text-xs">{value || 'N/A'}</span>,
      },
      {
        Header: "Status",
        accessor: "assetstatus",
        Cell: ({ value }) => <Cellstyle value={value || 'N/A'} />,
      },
      {
        Header: "Value",
        accessor: "acquiredvalue",
        Cell: ({ value }) => typeof value === 'number' ? <Numberstyle value={value} /> : 'N/A',
      },
      {
        Header: "Date",
        accessor: "acquireddate",
        Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A',
      },
      {
        Header: "Actions",
        id: "actions",
        accessor: "assetnumber",
        Cell: ({ row: { original } }) => {
          const value = original.assetnumber;
          return (
            <div className="flex items-center gap-3">
              {/* QR Code Dropdown */}
              <div className="dropdown dropdown-left dropdown-hover">
                <label tabIndex={0} className="btn btn-sm btn-ghost p-1 bg-white hover:bg-slate-100 rounded-md cursor-pointer flex items-center justify-center">
                  <QRCodeSVG value={`${origin}/assets/publicdata/${value}`} size={28} />
                </label>
                <div tabIndex={0} className="dropdown-content z-[100] card card-compact w-48 p-2 shadow-2xl bg-white text-slate-800 rounded-lg border border-slate-200">
                  <div className="card-body items-center text-center p-2">
                    <QRCodeSVG value={`${origin}/assets/publicdata/${value}`} size={128} />
                    <p className="text-[10px] font-mono mt-2 text-app-text-muted font-bold">{value}</p>
                  </div>
                </div>
              </div>

              {/* Custody Button */}
              <button
                onClick={() => handleOpenCustody(value)}
                className="btn btn-sm btn-circle btn-outline border-slate-600 hover:border-app-accent text-app-text-secondary hover:text-app-accent hover:bg-app-accent/10 transition-all duration-200"
                title="View Custody"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          );
        }
      }
    ],
    [origin]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Head>
        <title>Fixed Assets - Asset Management</title>
      </Head>

      <div className="mb-6 bg-app-surface-muted/80 rounded-xl p-6 border border-app-border shadow-xl">
        <h1 className="text-2xl font-bold text-app-text mb-2">Fixed Assets</h1>
        <p className="text-app-text-muted">Search and manage company Fixed Assets</p>
      </div>

      <div className="mb-6 app-card rounded-xl p-6 border border-app-border shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-app-text-muted font-semibold uppercase mb-2">Asset Number</label>
            <input
              type="text"
              value={assetNumberSearch}
              onChange={(e) => setAssetNumberSearch(e.target.value)}
              placeholder="Search by number..."
              className="input input-bordered bg-app-surface-muted text-app-text border-slate-600 focus:border-app-accent w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-app-text-muted font-semibold uppercase mb-2">Asset Description</label>
            <input
              type="text"
              value={assetNameSearch}
              onChange={(e) => setAssetNameSearch(e.target.value)}
              placeholder="Search by description..."
              className="input input-bordered bg-app-surface-muted text-app-text border-slate-600 focus:border-app-accent w-full text-sm"
            />
          </div>
          <div className="relative">
            <label className="block text-xs text-app-text-muted font-semibold uppercase mb-2">Acquired After Date</label>
            <DatePicker
              selected={minAcquiredDateSearch ? new Date(minAcquiredDateSearch) : null}
              onChange={(date) => {
                if (date) {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const dd = String(date.getDate()).padStart(2, '0');
                  setMinAcquiredDateSearch(`${yyyy}-${mm}-${dd}`);
                } else {
                  setMinAcquiredDateSearch('');
                }
              }}
              placeholderText="Select date..."
              className="input input-bordered bg-app-surface-muted text-app-text border-slate-600 focus:border-app-accent w-full text-sm"
              isClearable
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-xs text-app-text-muted font-semibold uppercase mb-2">Min Value (SAR)</label>
            <input
              type="number"
              value={minAcquiredValueSearch}
              onChange={(e) => setMinAcquiredValueSearch(e.target.value)}
              placeholder="Min acquired value..."
              className="input input-bordered bg-app-surface-muted text-app-text border-slate-600 focus:border-app-accent w-full text-sm"
            />
          </div>
        </div>
      </div>

      <div className="app-card rounded-xl p-6 border border-app-border shadow-xl min-h-[400px] flex flex-col justify-between">
        <div className="flex-1">
          {!hasInteracted ? (
            <button
              onClick={() => setHasInteracted(true)}
              className="flex flex-col items-center justify-center h-72 w-full text-app-text-muted hover:text-app-accent group transition-all duration-300 border border-dashed border-slate-700/60 hover:border-app-accent/40 rounded-xl bg-app-surface/10 cursor-pointer"
            >
              <svg className="w-12 h-12 mb-3 text-app-text-muted group-hover:text-cyan-500 animate-bounce transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p className="text-lg font-semibold text-app-text-secondary">Scroll down, click, or search to load fixed assets</p>
              <p className="text-xs text-app-text-muted mt-1.5">Lazy loading is active to optimize load performance</p>
            </button>
          ) : loading && data.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg text-cyan-500"></span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-app-text-muted">
              <p className="text-lg">No assets found matching the search criteria</p>
            </div>
          ) : (
            <Tablecomponent 
              columns={columns} 
              data={data} 
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              enablePagination={false}
            />
          )}
        </div>

        {hasInteracted && data.length > 0 && (
          <div ref={loadMoreRef} className="py-6 text-center border-t border-app-border/30 mt-6">
            {loadingMore ? (
              <span className="text-sm text-app-accent font-semibold animate-pulse">Loading more fixed assets...</span>
            ) : hasMore ? (
              <span className="text-xs text-app-text-muted font-medium">Scroll down to load more</span>
            ) : (
              <span className="text-xs text-app-text-muted font-medium">All {data.length} records loaded.</span>
            )}
          </div>
        )}
      </div>

      {/* Custody Modal */}
      {isCustodyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-surface-muted backdrop-blur-sm">
          <div className="bg-app-surface border border-app-border rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-bg/40">
              <div>
                <h3 className="text-xl font-bold text-app-text flex items-center gap-2">
                  <svg className="w-5 h-5 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Custody Information
                </h3>
                <p className="text-xs text-app-text-muted mt-1">Asset: <span className="font-mono text-app-accent font-semibold">{custodyAsset}</span></p>
              </div>
              <button 
                onClick={() => setIsCustodyOpen(false)}
                className="btn btn-sm btn-circle btn-ghost text-app-text-muted hover:text-app-text"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingCustody ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="loading loading-spinner loading-lg text-cyan-500 mb-2"></span>
                  <span className="text-sm text-app-text-muted">Loading custody records...</span>
                </div>
              ) : custodyRecords.length === 0 ? (
                <div className="text-center py-12 text-app-text-muted">
                  <p className="text-lg">No custody records found for this asset.</p>
                </div>
              ) : (
                <>
                  {/* Current Custody Card */}
                  {(() => {
                    const current = custodyRecords.find(r => !r.custodyto);
                    return (
                      <div className="bg-app-bg/40 border border-app-border rounded-xl p-5 shadow-inner">
                        <h4 className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-3">Current Custody</h4>
                        {current ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-app-text-muted font-semibold uppercase">Custodian Employee</p>
                              <p className="text-base font-bold text-app-text mt-1">{current.employeename || 'N/A'}</p>
                              {current.employeenumber && (
                                <p className="text-xs text-app-text-muted font-mono mt-0.5">ID: {current.employeenumber}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-app-text-muted font-semibold uppercase">Location</p>
                              <p className="text-base font-bold text-app-text mt-1 text-app-text">
                                {current.projectname || current.project || current.departmentLocation || current.campOfficeLocation || current.warehouseLocation || current.location || 'Unknown Location'}
                              </p>
                              {current.locationType && (
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-cyan-950/50 border border-cyan-800/40 text-app-accent text-[10px] uppercase font-bold rounded">
                                  {current.locationType.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div className="sm:col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-app-border/50">
                              <div>
                                <p className="text-xs text-app-text-muted font-semibold uppercase">Assigned Date</p>
                                <p className="text-sm font-semibold text-app-text-secondary mt-1">
                                  {current.custodyfrom ? new Date(current.custodyfrom).toLocaleDateString() : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-app-text-muted font-semibold uppercase">Document Number</p>
                                <p className="text-sm font-mono font-semibold text-app-text-secondary mt-1">{current.documentnumber || '—'}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-app-text-muted text-sm py-2">
                            No active custody assignment (Asset is currently in storage / unassigned).
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* History List */}
                  <div>
                    <h4 className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-3">Custody History ({custodyRecords.length})</h4>
                    <div className="border border-app-border rounded-xl overflow-hidden shadow-md">
                      <table className="table w-full text-left">
                        <thead>
                          <tr className="bg-app-bg/60 text-app-text-muted border-b border-app-border text-xs">
                            <th className="font-semibold px-4 py-3">Employee</th>
                            <th className="font-semibold px-4 py-3">Location</th>
                            <th className="font-semibold px-4 py-3">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-app-border bg-app-surface/20">
                          {custodyRecords.map((c, i) => (
                            <tr key={c._id || i} className="hover:bg-app-surface/40 text-app-text-secondary transition-colors">
                              <td className="px-4 py-3 text-sm">
                                <span className="font-medium text-app-text">{c.employeename || 'N/A'}</span>
                                {c.employeenumber && <div className="text-app-text-muted text-xs mt-0.5">ID: {c.employeenumber}</div>}
                              </td>
                              <td className="px-4 py-3 text-sm text-app-text">
                                {c.projectname || c.project || c.departmentLocation || c.campOfficeLocation || c.warehouseLocation || c.location || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="text-xs">
                                  <span className="text-app-text-muted font-medium">From:</span> {c.custodyfrom ? new Date(c.custodyfrom).toLocaleDateString() : '—'}
                                </div>
                                <div className="text-xs mt-0.5">
                                  <span className="text-app-text-muted font-medium">To:</span> {c.custodyto ? new Date(c.custodyto).toLocaleDateString() : <span className="text-emerald-400 font-bold">Present</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-app-border flex justify-end bg-app-bg/40">
              <button 
                onClick={() => setIsCustodyOpen(false)}
                className="btn btn-sm bg-app-surface hover:bg-app-surface-muted text-app-text border-0 px-6 font-semibold"
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
