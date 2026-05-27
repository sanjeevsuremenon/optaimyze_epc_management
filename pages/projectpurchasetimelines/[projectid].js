import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import moment from "moment";
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

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
      <div className="min-h-screen bg-gray-50">        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </main>      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-slate-700 to-gray-800 rounded-lg shadow-xl p-6 text-white mb-6">
            <h1 className="text-3xl font-bold mb-2">Project Purchase Order Timelines</h1>
            <p className="text-gray-300 text-lg">
              {network ? `Network: ${network}` : `Project: ${projectid}`}
            </p>
            {timelineRange.start && timelineRange.end && (
              <p className="text-gray-300 text-sm mt-2">
                Timeline Range: {timelineRange.start.format('MMM YYYY')} to {timelineRange.end.format('MMM YYYY')}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* PO List with Timelines */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-semibold text-gray-800">Purchase Orders ({poList.length})</h2>
              {projectid && (
                <p className="text-sm text-gray-600 mt-1">
                  Project ID: {projectid} 
                  {projectid && projectid.length > 12 && ` (API using first 12 chars: ${projectid.substring(0, 12)})`}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('ponum')}
                    >
                      PO Number <SortIndicator columnKey="ponum" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('poval')}
                    >
                      PO Value (SAR) <SortIndicator columnKey="poval" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('podate')}
                    >
                      PO Date <SortIndicator columnKey="podate" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => requestSort('delivery-date')}
                    >
                      Planned Delivery <SortIndicator columnKey="delivery-date" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actual Deliveries
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ minWidth: '400px' }}>
                      Timeline
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPOList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        {error ? error : 'No purchase orders found for this project'}
                      </td>
                    </tr>
                  ) : (
                    sortedPOList.map((po, index) => (
                      <tr key={po.ponum || index} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                          {po.ponum}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(po.poval)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(po.podate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(po["delivery-date"])}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {po.deliveryDates && po.deliveryDates.length > 0 ? (
                            <div className="space-y-1">
                              {po.deliveryDates.map((date, idx) => (
                                <div key={idx} className="text-xs">
                                  {date.format('MM/DD/YYYY')}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No deliveries</span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ minWidth: '400px' }}>
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
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-600"></div>
                <span className="text-gray-700">PO Date</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600"></div>
                <span className="text-gray-700">Planned Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-600"></div>
                <span className="text-gray-700">Actual Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </main>    </div>
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
