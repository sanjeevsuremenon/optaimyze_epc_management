import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FiSearch, FiArrowUp, FiArrowDown, FiFolder, FiShoppingCart, FiBarChart2, FiGrid, FiList, FiDownload, FiEye, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import { useRouter } from "next/router";
import POCommentModal from "../../components/PO/POCommentModal";

export default function Projects1() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'project-name', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [networkPOs, setNetworkPOs] = useState([]);
  const [network, setNetwork] = useState(null);
  const [poLayoutMode, setPOLayoutMode] = useState('card');

  const poCardRefs = useRef({});
  const [poSortConfig, setPOSortConfig] = useState({ key: 'ponum', direction: 'asc' });

  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedCommentPO, setSelectedCommentPO] = useState(null);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d)) return 'N/A';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }, []);

  const formatTimestamp = useCallback(() => {
    const d = new Date();
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}_${hh}-${mm}-${ss}`;
  }, []);

  // Handle pre-selected project from query param
  useEffect(() => {
    console.log('router.isReady:', router.isReady, 'router.query:', router.query);
    if (router.isReady && router.query.project) {
      const proj = router.query.project;
      console.log('Setting selectedProject to:', proj.replace(/\//g, '%2F'));
      setSelectedProject(proj.replace(/\//g, '%2F'));
    }
  }, [router.isReady, router.query.project]);

  // Debounced search with abort
  useEffect(() => {
    console.log('searchTerm useEffect triggered with searchTerm:', searchTerm);
    if (!searchTerm || !searchTerm.trim()) {
      console.log('Clearing projects in searchTerm useEffect');
      setProjects([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        console.log('Searching projects with query:', searchTerm.trim());
        const res = await fetch(`/api/projects?str=${encodeURIComponent(searchTerm.trim())}`, { signal: controller.signal });
        const data = await res.json();
        setProjects(data || []);
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [searchTerm]);

  // Sorting helpers
  const requestSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const requestPOSort = (key) => {
    setPOSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortIndicator = ({ config, columnKey }) => {
    if (config.key !== columnKey) return null;
    return config.direction === 'asc' ? <FiArrowUp className="inline ml-1 text-app-text-secondary" /> : <FiArrowDown className="inline ml-1 text-app-text-secondary" />;
  };

  const sortedProjects = useMemo(() => {
    console.log('Recalculating sortedProjects. projects count:', projects?.length);
    let list = projects || [];
    if (list.length === 0 && projectData) {
      list = [projectData];
    }
    const items = [...list];
    const key = sortConfig.key;
    items.sort((a, b) => {
      const va = (a[key] || '').toString().toLowerCase();
      const vb = (b[key] || '').toString().toLowerCase();
      if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
      if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [projects, projectData, sortConfig]);

  const sortedPurchaseOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    const items = [...purchaseOrders];
    const key = poSortConfig.key;
    items.sort((a, b) => {
      // status first: pending before complete when sorting by status
      if (key === 'status') {
        const sa = a.balgrval === 0 ? 'complete' : 'pending';
        const sb = b.balgrval === 0 ? 'complete' : 'pending';
        if (sa < sb) return poSortConfig.direction === 'asc' ? -1 : 1;
        if (sa > sb) return poSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      // numeric compare for value fields
      if (key === 'poval' || key === 'balgrval') {
        const na = parseFloat(a[key] || 0) || 0;
        const nb = parseFloat(b[key] || 0) || 0;
        return poSortConfig.direction === 'asc' ? na - nb : nb - na;
      }
      // date compare
      if (key === 'podate' || key === 'delivery-date') {
        const da = a[key] ? new Date(a[key]).getTime() : 0;
        const db = b[key] ? new Date(b[key]).getTime() : 0;
        return poSortConfig.direction === 'asc' ? da - db : db - da;
      }
      // default string
      const va = (a[key] || '').toString().toLowerCase();
      const vb = (b[key] || '').toString().toLowerCase();
      if (va < vb) return poSortConfig.direction === 'asc' ? -1 : 1;
      if (va > vb) return poSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [purchaseOrders, poSortConfig]);

  // Fetch POs + network when project selected
  useEffect(() => {
    console.log('Fetch POs useEffect triggered. selectedProject:', selectedProject);
    if (!selectedProject) {
      setProjectData(null);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        console.log('Loading project data for:', selectedProject);
        const [pRes, nRes, poRes] = await Promise.all([
          fetch(`/api/projects/${selectedProject}`, { signal: controller.signal }),
          fetch(`/api/networks/${selectedProject}`, { signal: controller.signal }),
          fetch(`/api/purchaseorders/project/consolidated/${selectedProject}`, { signal: controller.signal })
        ]);
        console.log('Fetch responses:', { pResOk: pRes.ok, nResOk: nRes.ok, poResOk: poRes.ok });
        
        const pJson = pRes.ok ? await pRes.json() : null;
        const nJson = nRes.ok ? await nRes.json() : null;
        const poJson = poRes.ok ? await poRes.json() : [];
        console.log('Parsed JSON results:', { pJson, nJson, poJsonCount: poJson?.length });
        
        setNetwork(nJson);
        
        if (pJson) {
          setProjectData(pJson);
          setProjects(prev => {
            const exists = prev.some(p => p['project-wbs'] === pJson['project-wbs']);
            const next = exists ? prev : [pJson];
            console.log('Setting projects state to:', next);
            return next;
          });
        }
        
        if (nJson?.['network-num']) {
          console.log('Fetching network POs for:', nJson['network-num']);
          const netRes = await fetch(`/api/purchaseorders/project/consolidated/network/${nJson['network-num']}`, { signal: controller.signal });
          const netJson = netRes.ok ? await netRes.json() : [];
          setNetworkPOs(netJson || []);
          
          // Combine project POs and network POs, avoiding duplicates
          const combined = [...(poJson || [])];
          const existing = new Set(combined.map(po => po.ponum));
          (netJson || []).forEach(po => {
            if (!existing.has(po.ponum)) {
              combined.push(po);
            }
          });
          setPurchaseOrders(combined);
        } else {
          setNetworkPOs([]);
          setPurchaseOrders(poJson || []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error loading project data', err);
      }
    };
    load();
    return () => controller.abort();
  }, [selectedProject]);

  const handleDownloadExcel = async () => {
    if (!selectedProject) return alert('Select a project');
    try {
      const res = await fetch(`/api/purchaseorders/project/excel/${selectedProject}`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PO_Schedule_${selectedProject}_${formatTimestamp()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Download failed');
    }
  };

  return (
    <div className="app-page min-h-screen">
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects by name or WBS"
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-app-surface-muted border border-app-border text-app-text placeholder-app-text-disabled focus:outline-none focus:border-app-accent"
            />
            <FiSearch className="absolute left-4 top-3 text-app-text-muted" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin h-10 w-10 border-b-2 border-app-accent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-app-surface/80 border border-app-border p-4 shadow-lg">
              <h2 className="text-lg font-semibold text-app-text mb-3">Projects</h2>
              {sortedProjects.length === 0 ? (
                <div className="text-center py-8 text-app-text-muted">
                  <FiFolder className="mx-auto w-12 h-12 mb-3" />
                  <div>No projects - try searching</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-app-text-secondary text-xs">
                      <tr>
                        <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('project-wbs')}>WBS <SortIndicator config={sortConfig} columnKey="project-wbs" /></th>
                        <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('project-name')}>Name <SortIndicator config={sortConfig} columnKey="project-name" /></th>
                        <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort('project-incharge')}>Manager <SortIndicator config={sortConfig} columnKey="project-incharge" /></th>
                      </tr>
                    </thead>
                    <tbody className="text-app-text">
                      {sortedProjects.map((p, i) => {
                        const isSelected = selectedProject && p['project-wbs'].replace('/', '%2F') === selectedProject;
                        return (
                          <tr 
                            key={i} 
                            onClick={() => setSelectedProject(p['project-wbs'].replace('/', '%2F'))} 
                            className={`cursor-pointer transition-all duration-150 border-l-2 hover:shadow-md transform hover:-translate-y-0.5 ${
                              isSelected 
                                ? 'bg-cyan-950/40 border-l-cyan-500 font-bold text-app-text' 
                                : 'odd:bg-app-surface even:bg-app-surface hover:bg-slate-850/50 border-l-transparent'
                            }`}
                          >
                            <td className="px-4 py-2 font-mono">{p['project-wbs']}</td>
                            <td className="px-4 py-2 font-semibold tracking-tight">{p['project-name']}</td>
                            <td className="px-4 py-2 text-app-text-secondary">{p['project-incharge']}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedProject && (
              <div className="rounded-2xl bg-app-surface/80 border border-app-border p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-app-text flex items-center gap-2 flex-wrap">
                      Purchase Orders
                      {projectData && (
                        <span className="text-xs font-semibold bg-cyan-900/30 text-app-accent border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                          {projectData['project-name']}
                        </span>
                      )}
                    </h3>
                    {network && <div className="text-sm text-app-text-muted mt-1">Network: {network['network-num']}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.open(`/projectpurchasetimelines/${selectedProject}`, '_blank')} 
                      className="px-3 py-1.5 bg-app-accent hover:bg-app-accent rounded-md text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/10"
                    >
                      <FiBarChart2 size={14} /> View Timelines
                    </button>
                    <button onClick={handleDownloadExcel} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-white text-xs font-semibold transition-colors">Download Excel</button>
                    <div className="flex items-center bg-app-surface-muted rounded-md p-1">
                      <button onClick={() => setPOLayoutMode('card')} className={`p-2 rounded ${poLayoutMode==='card'? 'bg-slate-700 text-app-accent' : 'text-app-text-secondary'}`}><FiGrid /></button>
                      <button onClick={() => setPOLayoutMode('table')} className={`p-2 rounded ${poLayoutMode==='table'? 'bg-slate-700 text-app-accent' : 'text-app-text-secondary'}`}><FiList /></button>
                    </div>
                  </div>
                </div>

                {sortedPurchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-app-text-muted">
                    <FiShoppingCart className="mx-auto w-12 h-12 mb-3" />
                    No purchase orders for this project.
                  </div>
                ) : poLayoutMode === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {purchaseOrders.map((po) => (
                      <div key={po.ponum} className="p-4 bg-app-surface-muted border border-app-border rounded-lg shadow-2xl hover:shadow-2xl transition-transform transform hover:-translate-y-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-app-accent font-semibold cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`/purchaseorders/${po.ponum}`, '_blank'); }}>{po.ponum}</div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${po.balgrval===0 ? 'bg-gradient-to-r from-emerald-400 to-green-300 text-slate-900' : 'bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-900'}`}>{po.balgrval===0?'Complete':'Pending'}</div>
                          </div>
                          <div className="text-app-text-secondary text-xs space-y-1 mb-4">
                            <div><strong>Date:</strong> {formatDate(po.podate)}</div>
                            <div><strong>Delivery:</strong> {po['delivery-date'] ? formatDate(po['delivery-date']) : 'N/A'}</div>
                            <div><strong>Vendor:</strong> {po.vendorname || po.vendorcode}</div>
                            <div><strong>Value:</strong> {po.poval ? po.poval.toLocaleString() : '0'} SAR</div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-app-border/50 flex justify-end gap-1.5 mt-auto">
                          <button
                            title="View PO Details"
                            onClick={(e) => { e.stopPropagation(); window.open(`/purchaseorders/${po.ponum}`, '_blank'); }}
                            className="inline-flex items-center px-2 py-1 border border-app-border text-[10px] font-semibold rounded text-app-text-secondary bg-app-surface hover:bg-slate-300 hover:text-slate-900 transition-all gap-1"
                          >
                            <FiEye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            title="Update Schedule"
                            onClick={(e) => { e.stopPropagation(); window.open(`/openpurchaseorders1/schedule/${po.ponum}`, '_blank'); }}
                            className="inline-flex items-center px-2 py-1 border border-app-border text-[10px] font-semibold rounded text-app-accent bg-app-surface hover:bg-app-accent hover:text-slate-900 transition-all gap-1"
                          >
                            <FiCalendar className="w-3 h-3" />
                            <span>Schedule</span>
                          </button>
                          <button
                            title="Comments"
                            onClick={(e) => { e.stopPropagation(); setSelectedCommentPO(po.ponum); setIsCommentModalOpen(true); }}
                            className="inline-flex items-center px-2 py-1 border border-app-border text-[10px] font-semibold rounded text-blue-400 bg-app-surface hover:bg-blue-500 hover:text-slate-900 transition-all gap-1"
                          >
                            <FiMessageSquare className="w-3 h-3" />
                            <span>Comment</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="text-app-text-secondary text-xs">
                        <tr>
                          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestPOSort('ponum')}>PO <SortIndicator config={poSortConfig} columnKey="ponum" /></th>
                          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestPOSort('podate')}>Date <SortIndicator config={poSortConfig} columnKey="podate" /></th>
                          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestPOSort('delivery-date')}>Delivery <SortIndicator config={poSortConfig} columnKey="delivery-date" /></th>
                          <th className="px-4 py-2 text-left">Vendor</th>
                          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestPOSort('poval')}>Value <SortIndicator config={poSortConfig} columnKey="poval" /></th>
                          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestPOSort('status')}>Status <SortIndicator config={poSortConfig} columnKey="status" /></th>
                          <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-app-text">
                        {sortedPurchaseOrders.map((po) => (
                          <tr key={po.ponum} className="odd:bg-app-surface even:bg-app-surface hover:shadow-md transform hover:-translate-y-0.5 transition-shadow duration-150 cursor-pointer">
                            <td className="px-4 py-2 text-app-accent font-mono" onClick={(e) => { e.stopPropagation(); window.open(`/purchaseorders/${po.ponum}`, '_blank'); }}>{po.ponum}</td>
                            <td className="px-4 py-2">{formatDate(po.podate)}</td>
                            <td className="px-4 py-2">{po['delivery-date'] ? formatDate(po['delivery-date']) : 'N/A'}</td>
                            <td className="px-4 py-2">{po.vendorname}</td>
                            <td className="px-4 py-2">{po.poval ? po.poval.toLocaleString() : '0'}</td>
                            <td className="px-4 py-2"><span className={`px-3 py-1 rounded-full text-sm font-semibold ${po.balgrval===0 ? 'bg-gradient-to-r from-emerald-400 to-green-300 text-slate-900 shadow-sm' : 'bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-900 shadow-sm'}`}>{po.balgrval===0?'Complete':'Pending'}</span></td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  title="View PO Details"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/purchaseorders/${po.ponum}`, '_blank'); }}
                                  className="inline-flex items-center px-2 py-1 border border-app-border text-[10px] font-semibold rounded text-app-text-secondary bg-app-surface hover:bg-slate-300 hover:text-slate-900 transition-all gap-1"
                                >
                                  <FiEye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                                <button
                                  title="Update Schedule"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/openpurchaseorders1/schedule/${po.ponum}`, '_blank'); }}
                                  className="inline-flex items-center px-2 py-1 border border-app-border text-[10px] font-semibold rounded text-app-accent bg-app-surface hover:bg-app-accent hover:text-slate-900 transition-all gap-1"
                                >
                                  <FiCalendar className="w-3 h-3" />
                                  <span>Schedule</span>
                                </button>
                                <button
                                  title="Comments"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCommentPO(po.ponum); setIsCommentModalOpen(true); }}
                                  className="inline-flex items-center px-2 py-1 border border-app-border text-[10px] font-semibold rounded text-blue-400 bg-app-surface hover:bg-blue-500 hover:text-slate-900 transition-all gap-1"
                                >
                                  <FiMessageSquare className="w-3 h-3" />
                                  <span>Comment</span>
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
        )}

        <POCommentModal 
          isOpen={isCommentModalOpen} 
          onClose={() => {
            setIsCommentModalOpen(false);
            setSelectedCommentPO(null);
          }} 
          poNumber={selectedCommentPO} 
        />
      </main>
    </div>
  );
}
   
