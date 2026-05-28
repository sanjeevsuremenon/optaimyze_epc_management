import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import moment from "moment";
import { FiSearch, FiArrowUp, FiArrowDown, FiMessageSquare, FiCalendar, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/router';
import POCommentModal from '../../components/PO/POCommentModal';

export default function Openpurchaseorders1() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [openpolist, setOpenpolist] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'po-date',
    direction: 'desc'
  });

  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedCommentPO, setSelectedCommentPO] = useState(null);

  // Fetch open POs
  useEffect(() => {
    const fetchOpenPOs = async () => {
      setLoading(true);
      try {
        const result = await fetch(`/api/purchaseorders/openpo`);
        const json = await result.json();
        setOpenpolist(
          json.filter(
            (row) =>
              row.openvalue > 10 &&
              row._id["po-number"].substring(0, 2) !== "47" &&
              row._id["po-number"].substring(0, 2) !== "71" &&
              row._id["po-number"].substring(0, 2) !== "91"
          )
        );
      } catch (error) {
        console.error('Error fetching open POs:', error);
      }
      setLoading(false);
    };

    fetchOpenPOs();
  }, []);

  // Sort and filter data
  const sortedAndFilteredData = React.useMemo(() => {
    let filteredData = [...openpolist];
    
    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(item => 
        item._id["po-number"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id.vendorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id.vendorcode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a._id[sortConfig.key];
        let bValue = b._id[sortConfig.key];
        
        if (sortConfig.key === 'openvalue') {
          aValue = a.openvalue;
          bValue = b.openvalue;
        } else if (sortConfig.key === 'povalue') {
          aValue = a.povalue || 0;
          bValue = b.povalue || 0;
        } else if (sortConfig.key === 'po-date') {
          aValue = a['po-date'] ? new Date(a['po-date']) : null;
          bValue = b['po-date'] ? new Date(b['po-date']) : null;
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;
        } else if (sortConfig.key === 'delivery-date') {
          aValue = a['delivery-date'] ? new Date(a['delivery-date']) : null;
          bValue = b['delivery-date'] ? new Date(b['delivery-date']) : null;
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [openpolist, searchTerm, sortConfig]);

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

  // Action Handlers
  const handleScheduleClick = (po) => {
    router.push(`/openpurchaseorders1/schedule/${po._id["po-number"]}`);
  };

  const handleCommentClick = (ponumber) => {
    setSelectedCommentPO(ponumber);
    setIsCommentModalOpen(true);
  };

  const handleViewPO = (ponumber) => {
    router.push(`/openpurchaseorders1/view/${ponumber}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <main className="w-full px-4 py-8 flex-1 flex flex-col">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-8 w-full">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search by PO number, vendor name, or vendor code..."
                className="w-full px-4 py-3 pl-12 text-slate-200 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </div>
            <div className="bg-slate-900 px-6 py-3 rounded-lg shadow-sm border border-slate-800 shrink-0">
              <span className="text-cyan-400 font-semibold tracking-wide">
                {sortedAndFilteredData.length} <span className="text-slate-400 font-normal">Open PO{sortedAndFilteredData.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">Open Purchase Orders</h2>
            </div>
            
            {/* Table wrapper with custom scrollbar */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              {/* table-fixed allows wrapping of long vendor names */}
              <table className="w-full text-left table-fixed text-[11px]">
                <colgroup>
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                  <col className="w-[8%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[21%]" />
                </colgroup>
                <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm border-b border-slate-800">
                  <tr>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate"
                      onClick={() => requestSort('po-number')}
                    >
                      PO Number <SortIndicator columnKey="po-number" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate"
                      onClick={() => requestSort('po-date')}
                    >
                      PO Date <SortIndicator columnKey="po-date" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate"
                      onClick={() => requestSort('delivery-date')}
                    >
                      Dely Date <SortIndicator columnKey="delivery-date" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate"
                      onClick={() => requestSort('plant')}
                    >
                      Plant <SortIndicator columnKey="plant" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate"
                      onClick={() => requestSort('vendorcode')}
                    >
                      Vendor Code <SortIndicator columnKey="vendorcode" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate"
                      onClick={() => requestSort('vendorname')}
                    >
                      Vendor Name <SortIndicator columnKey="vendorname" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate text-right"
                      onClick={() => requestSort('povalue')}
                    >
                      PO Value <SortIndicator columnKey="povalue" />
                    </th>
                    <th 
                      className="px-2 py-2 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors truncate text-right"
                      onClick={() => requestSort('openvalue')}
                    >
                      Open Value <SortIndicator columnKey="openvalue" />
                    </th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-400 uppercase tracking-wider truncate">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-800/60">
                  {sortedAndFilteredData.map((po, index) => (
                    <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap font-bold text-slate-200">
                        {po._id["po-number"]}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-slate-400">
                        {po["po-date"] ? moment(po["po-date"]).format('MM/DD/YY') : 'N/A'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-slate-400">
                        {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YY') : 'N/A'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-slate-400">
                        {po._id.plant}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap font-mono text-slate-500">
                        {po._id.vendorcode}
                      </td>
                      <td className="px-2 py-2 font-medium text-slate-300 break-words leading-tight">
                        {po._id.vendorname.replace(
                          /\w\S*/g,
                          function(txt) {
                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                          }
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-slate-400 font-medium text-right">
                        {po.povalue ? po.povalue.toLocaleString() : '0'} SAR
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-emerald-400 font-bold text-right">
                        {po.openvalue.toLocaleString()} SAR
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-slate-500">
                        <div className="flex justify-center space-x-1">
                          <button
                            title="Update Schedule"
                            onClick={() => handleScheduleClick(po)}
                            className="inline-flex items-center px-1.5 py-1 border border-slate-700 text-[10px] font-semibold rounded text-cyan-400 bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 transition-all"
                          >
                            <FiCalendar className="mr-1" />
                            <span className="hidden sm:inline">Schedule</span>
                          </button>
                          <button
                            title="Comments"
                            onClick={() => handleCommentClick(po._id["po-number"])}
                            className="inline-flex items-center px-1.5 py-1 border border-slate-700 text-[10px] font-semibold rounded text-blue-400 bg-slate-800 hover:bg-blue-500 hover:text-slate-900 transition-all"
                          >
                            <FiMessageSquare className="mr-1" />
                            <span className="hidden sm:inline">Comments</span>
                          </button>
                          <button
                            title="View PO Dashboard"
                            onClick={() => handleViewPO(po._id["po-number"])}
                            className="inline-flex items-center px-1.5 py-1 border border-slate-700 text-[10px] font-semibold rounded text-slate-300 bg-slate-800 hover:bg-slate-300 hover:text-slate-900 transition-all"
                          >
                            <FiEye className="mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedAndFilteredData.length === 0 && !loading && (
                    <tr>
                      <td colSpan="9" className="px-2 py-8 text-center text-slate-500 italic">
                        No purchase orders found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Render modularized comment modal */}
      <POCommentModal 
        isOpen={isCommentModalOpen} 
        onClose={() => {
          setIsCommentModalOpen(false);
          setSelectedCommentPO(null);
        }} 
        poNumber={selectedCommentPO} 
      />
    </div>
  );
}