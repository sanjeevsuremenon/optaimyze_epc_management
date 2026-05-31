import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import moment from "moment";
import { FiArrowUp, FiArrowDown, FiTrendingUp, FiList } from 'react-icons/fi';

function ProjectPurchaseTimelines() {
  const { data: session } = useSession();
  const router = useRouter();
  const { projectid, network } = router.query;
  
  const [poList, setPOList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'poval',
    direction: 'desc'
  });

  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    if (!projectid || projectid === 'unassigned') {
      setProjectData(null);
      return;
    }
    const fetchProjectData = async () => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectid)}`);
        if (res.ok) {
          const data = await res.json();
          setProjectData(data);
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
      }
    };
    fetchProjectData();
  }, [projectid]);

  useEffect(() => {
    if (!projectid) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let apiUrl;
        if (network) {
          // Fetch POs for this network only
          apiUrl = `/api/purchaseorders/project/consolidated/network/${encodeURIComponent(network)}`;
          console.log('Fetching network POs from:', apiUrl);
        } else {
          // Next.js automatically decodes URL parameters in router.query
          const apiProjectId = projectid && projectid.length > 12 ? projectid.substring(0, 12) : projectid;
          apiUrl = `/api/purchaseorders/project/consolidated/${encodeURIComponent(apiProjectId)}`;
          console.log('Fetching from:', apiUrl);
        }
        
        const poResponse = await fetch(apiUrl);
        
        if (!poResponse.ok) {
          console.error('PO API response not OK:', poResponse.status, poResponse.statusText);
          const errorText = await poResponse.text();
          console.error('Error response:', errorText);
          setError(`Failed to fetch POs: ${poResponse.status} ${poResponse.statusText}`);
          setPOList([]);
          setLoading(false);
          return;
        }
        
        const poData = await poResponse.json();
        console.log('Fetched PO data:', poData);
        console.log('Number of POs:', Array.isArray(poData) ? poData.length : 'Not an array');
        
        if (!Array.isArray(poData)) {
          console.error('PO data is not an array:', typeof poData, poData);
          setError('Invalid response format from API');
          setPOList([]);
          setLoading(false);
          return;
        }
        
        if (poData.length === 0) {
          console.log('No POs found for project:', projectid);
          setError(null); // Not an error, just no data
          setPOList([]);
          setLoading(false);
          return;
        }
        
        setError(null);
        
        // Fetch delivery history for each PO
        const poListWithDeliveries = await Promise.all(
          poData.map(async (po) => {
            try {
              const deliveryResponse = await fetch(`/api/materialdocumentsforpo/${po.ponum}`);
              const deliveryData = await deliveryResponse.json();
              
              // Get unique delivery dates
              const deliveryDates = deliveryData
                .map(d => d.documentdate ? moment(d.documentdate) : null)
                .filter(d => d !== null && d.isValid())
                .sort((a, b) => a.valueOf() - b.valueOf());
              
              const uniqueDeliveryDates = [...new Set(deliveryDates.map(d => d.format('YYYY-MM-DD')))].map(d => moment(d));
              
              return {
                ...po,
                deliveryDates: uniqueDeliveryDates,
                lastDeliveryDate: uniqueDeliveryDates.length > 0 
                  ? uniqueDeliveryDates[uniqueDeliveryDates.length - 1] 
                  : null
              };
            } catch (error) {
              console.error(`Error fetching delivery history for PO ${po.ponum}:`, error);
              return {
                ...po,
                deliveryDates: [],
                lastDeliveryDate: null
              };
            }
          })
        );
        
        console.log('PO list with deliveries:', poListWithDeliveries);
        setPOList(poListWithDeliveries);
      } catch (error) {
        console.error('Error fetching PO data:', error);
        setError(`Error: ${error.message}`);
        setPOList([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectid]);

  // Calculate common timeline range
  const timelineRange = useMemo(() => {
    if (poList.length === 0) return { start: null, end: null };

    // Find earliest PO date
    const poDates = poList
      .map(po => po.podate ? moment(po.podate) : null)
      .filter(d => d !== null && d.isValid());
    
    const earliestPODate = poDates.length > 0 
      ? moment.min(poDates).startOf('month')
      : moment().startOf('month');

    // Find most recent delivery date
    const allDeliveryDates = poList
      .flatMap(po => po.deliveryDates || [])
      .filter(d => d && d.isValid());
    
    const mostRecentDelivery = allDeliveryDates.length > 0
      ? moment.max(allDeliveryDates).endOf('month')
      : null;

    // Check if there are open POs (POs with no deliveries or pending deliveries)
    const hasOpenPOs = poList.some(po => {
      const hasDeliveries = po.deliveryDates && po.deliveryDates.length > 0;
      const isPending = po.balgrval > 0;
      return !hasDeliveries || isPending;
    });

    let endDate;
    if (hasOpenPOs) {
      const threeMonthsFuture = moment().add(3, 'months').endOf('month');
      if (mostRecentDelivery && mostRecentDelivery.isAfter(threeMonthsFuture)) {
        endDate = mostRecentDelivery;
      } else {
        endDate = threeMonthsFuture;
      }
    } else if (mostRecentDelivery) {
      endDate = mostRecentDelivery;
    } else {
      endDate = moment().add(3, 'months').endOf('month');
    }

    return {
      start: earliestPODate,
      end: endDate
    };
  }, [poList]);

  // Handle sort
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Sort PO list
  const sortedPOList = useMemo(() => {
    if (!sortConfig.key) return poList;
    
    let sortableItems = [...poList];
    
    sortableItems.sort((a, b) => {
      let aVal, bVal;
      
      if (sortConfig.key === 'poval') {
        aVal = a.poval || 0;
        bVal = b.poval || 0;
      } else if (sortConfig.key === 'balgrval') {
        aVal = a.balgrval || 0;
        bVal = b.balgrval || 0;
      } else if (sortConfig.key === 'podate') {
        aVal = a.podate ? moment(a.podate).valueOf() : 0;
        bVal = b.podate ? moment(b.podate).valueOf() : 0;
      } else if (sortConfig.key === 'delivery-date') {
        aVal = a["delivery-date"] ? moment(a["delivery-date"]).valueOf() : 0;
        bVal = b["delivery-date"] ? moment(b["delivery-date"]).valueOf() : 0;
      } else if (sortConfig.key === 'ponum') {
        aVal = a.ponum || '';
        bVal = b.ponum || '';
      } else {
        return 0;
      }
      
      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortableItems;
  }, [poList, sortConfig]);

  // Render timeline for a PO
  const renderTimeline = (po) => {
    if (!timelineRange.start || !timelineRange.end) return null;

    const start = timelineRange.start;
    const end = timelineRange.end;
    const totalMonths = end.diff(start, 'months') + 1;

    // Calculate positions
    const getPosition = (date) => {
      if (!date || !date.isValid()) return null;
      const monthsDiff = date.diff(start, 'months', true);
      return (monthsDiff / totalMonths) * 100;
    };

    const poDatePos = po.podate ? getPosition(moment(po.podate)) : null;
    const deliveryDatePos = po["delivery-date"] ? getPosition(moment(po["delivery-date"])) : null;
    const actualDeliveryPositions = (po.deliveryDates || []).map(d => getPosition(d)).filter(p => p !== null);

    return (
      <div className="relative" style={{ height: '60px', width: '100%' }}>
        {/* Timeline axis */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-300 rounded-full"></div>
        
        {/* PO Date marker */}
        {poDatePos !== null && (
          <div
            className="absolute top-4"
            style={{ left: `${poDatePos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-600 relative group">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                PO Date: {moment(po.podate).format('MM/DD/YYYY')}
              </div>
            </div>
          </div>
        )}

        {/* Planned Delivery Date marker */}
        {deliveryDatePos !== null && (
          <div
            className="absolute top-4"
            style={{ left: `${deliveryDatePos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600 relative group">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Planned Delivery: {moment(po["delivery-date"]).format('MM/DD/YYYY')}
              </div>
          </div>
          </div>
        )}

        {/* Actual Delivery Date markers */}
        {actualDeliveryPositions.map((pos, idx) => {
          const deliveryDate = po.deliveryDates[idx];
          return (
            <div
              key={idx}
              className="absolute top-4"
              style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-600 relative group">
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Delivery: {deliveryDate.format('MM/DD/YYYY')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Sort indicator
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('MM/DD/YYYY');
  };

  // Format currency helper
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Loading timeline data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">      
      <main className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-bl-full -mr-10 -mt-10 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                  Purchase Order Timelines
                </h1>
                <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-800">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></span>
                    {projectData ? `${projectData['project-name']} (${projectid})` : `Project: ${projectid}`}
                  </span>
                  {network && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-900/30 text-slate-400 border border-slate-800">
                      Network: {network}
                    </span>
                  )}
                  {timelineRange.start && timelineRange.end && (
                    <span className="text-slate-400 text-sm flex items-center font-medium">
                      {timelineRange.start.format('MMM YYYY')} — {timelineRange.end.format('MMM YYYY')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  disabled
                  className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold py-2 px-4 rounded-lg flex items-center cursor-default gap-1.5 shadow-sm"
                >
                  <FiTrendingUp className="w-4 h-4" />
                  View PO timelines
                </button>
                <button
                  onClick={() => {
                    const targetId = network ? network : projectid;
                    router.push(`/projects1?project=${encodeURIComponent(targetId)}`);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <FiList className="w-4 h-4" />
                  View PO list
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-900/30 border border-rose-800 rounded-xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-rose-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* PO List with Timelines */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <div className="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></div>
                    Purchase Orders
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {poList.length} total
                    </span>
                  </h2>
                  {projectData ? (
                    <p className="text-sm text-slate-400 mt-1 ml-4.5">
                      Tracking deliveries and timelines for {projectData['project-name']}
                    </p>
                  ) : projectid && (
                    <p className="text-sm text-slate-400 mt-1 ml-4.5">
                      Tracking deliveries and timelines
                    </p>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors group"
                        onClick={() => requestSort('ponum')}
                      >
                        <div className="flex items-center">PO Number <span className="text-slate-600 group-hover:text-cyan-500 ml-1"><SortIndicator columnKey="ponum" /></span></div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors group"
                        onClick={() => requestSort('poval')}
                      >
                        <div className="flex items-center">PO Value (SAR) <span className="text-slate-600 group-hover:text-cyan-500 ml-1"><SortIndicator columnKey="poval" /></span></div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors group"
                        onClick={() => requestSort('balgrval')}
                      >
                        <div className="flex items-center">Open Balance (SAR) <span className="text-slate-600 group-hover:text-cyan-500 ml-1"><SortIndicator columnKey="balgrval" /></span></div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors group"
                        onClick={() => requestSort('podate')}
                      >
                        <div className="flex items-center">PO Date <span className="text-slate-600 group-hover:text-cyan-500 ml-1"><SortIndicator columnKey="podate" /></span></div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors group"
                        onClick={() => requestSort('delivery-date')}
                      >
                        <div className="flex items-center">Planned Delivery <span className="text-slate-600 group-hover:text-cyan-500 ml-1"><SortIndicator columnKey="delivery-date" /></span></div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Actual Deliveries
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ minWidth: '400px' }}>
                        Timeline
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900/50 divide-y divide-slate-800">
                    {sortedPOList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <p className="text-sm">{error ? error : 'No purchase orders found for this project'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedPOList.map((po, index) => (
                        <tr key={po.ponum || index} className="hover:bg-slate-800/50 transition-colors duration-200 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-cyan-400 group-hover:text-cyan-300">
                              {po.ponum}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {formatCurrency(po.poval)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-rose-400">
                              {formatCurrency(po.balgrval)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300">
                              {formatDate(po.podate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300">
                              {formatDate(po["delivery-date"])}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {po.deliveryDates && po.deliveryDates.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {po.deliveryDates.map((date, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                                    {date.format('MM/DD/YY')}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
                                No deliveries
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4" style={{ minWidth: '400px' }}>
                            {renderTimeline(po)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mr-6">Timeline Legend</h3>
              <div className="flex flex-wrap gap-6 text-sm flex-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-800">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-blue-300 font-medium">PO Date</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-800">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-emerald-300 font-medium">Planned Delivery</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/30 border border-orange-800">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                  <span className="text-orange-300 font-medium">Actual Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>    
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

export default ProjectPurchaseTimelines;
