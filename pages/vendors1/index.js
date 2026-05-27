import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import { FiSearch, FiArrowUp, FiArrowDown, FiFileText, FiDollarSign, FiMapPin, FiUsers, FiShoppingCart, FiClipboard, FiPackage, FiX, FiGrid, FiList } from 'react-icons/fi';

function Vendors1() {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPODetails] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [selectedPOCardRef, setSelectedPOCardRef] = useState(null);
  const [poLayoutMode, setPOLayoutMode] = useState('card'); // 'card' or 'table'
  const [sortConfig, setSortConfig] = useState({
    key: 'vendor-name',
    direction: 'asc'
  });
  const [poSortConfig, setPOSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const { data: session } = useSession();

  // Create refs for PO cards
  const poCardRefs = useRef({});

  // Sort vendors based on current sort configuration
  const sortedVendors = React.useMemo(() => {
    let sortableItems = [...vendors];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [vendors, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle PO sort request
  const requestPOSort = (key) => {
    let direction = 'asc';
    if (poSortConfig.key === key && poSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setPOSortConfig({ key, direction });
  };

  // Sort purchase orders based on current sort configuration
  const sortedPurchaseOrders = useMemo(() => {
    if (!poSortConfig.key) return purchaseOrders;
    
    let sortableItems = [...purchaseOrders];
    
    sortableItems.sort((a, b) => {
      // Special handling for status sorting
      if (poSortConfig.key === 'status') {
        const aStatus = a.balgrval === 0 ? 'complete' : 'pending';
        const bStatus = b.balgrval === 0 ? 'complete' : 'pending';
        
        // Pending should always be on top, complete at bottom
        // When descending, we still keep pending on top but can sort within groups
        if (aStatus === 'pending' && bStatus === 'complete') {
          return -1; // Pending always comes first
        }
        if (aStatus === 'complete' && bStatus === 'pending') {
          return 1; // Complete always comes after pending
        }
        // If same status, sort by date as secondary sort
        const aDate = new Date(a.podate);
        const bDate = new Date(b.podate);
        if (aDate < bDate) {
          return poSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aDate > bDate) {
          return poSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle podate sorting
      if (poSortConfig.key === 'podate') {
        const aDate = new Date(a.podate);
        const bDate = new Date(b.podate);
        if (aDate < bDate) {
          return poSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aDate > bDate) {
          return poSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle delivery-date sorting
      if (poSortConfig.key === 'delivery-date') {
        const aDate = a["delivery-date"] ? new Date(a["delivery-date"]) : null;
        const bDate = b["delivery-date"] ? new Date(b["delivery-date"]) : null;
        // Handle null dates
        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return 1;
        if (bDate === null) return -1;
        if (aDate < bDate) {
          return poSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aDate > bDate) {
          return poSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      // Handle poval sorting
      if (poSortConfig.key === 'poval') {
        const aVal = a.poval || 0;
        const bVal = b.poval || 0;
        if (aVal < bVal) {
          return poSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return poSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
      return 0;
    });
    
    return sortableItems;
  }, [purchaseOrders, poSortConfig]);

  // Handle PO click - open in new tab
  const handlePOClick = (ponum, e) => {
    e.stopPropagation(); // Prevent event bubbling
    window.open(`/purchaseorders/${ponum}`, '_blank');
  };

  // Fetch vendors based on search term
  useEffect(() => {
    const fetchVendors = async () => {
      if (!searchTerm || !searchTerm.trim()) {
        setVendors([]);
        return;
      }
      setLoading(true);
      try {
        const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
        const response = await fetch(`/api/vendors?str=${encodedSearchTerm}`);
        const data = await response.json();
        
        // Fetch PO counts for each vendor
        const vendorsWithPOs = await Promise.all(
          data.map(async (vendor) => {
            const poResponse = await fetch(`/api/purchaseorders/vendor/${vendor["vendor-code"]}`);
            const poData = await poResponse.json();
            return {
              ...vendor,
              poCount: poData.length
            };
          })
        );
        
        setVendors(vendorsWithPOs);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      }
      setLoading(false);
    };

    // Increased debounce delay to avoid multiple fetches when user types/deletes
    const debounceTimer = setTimeout(fetchVendors, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fetch purchase orders when vendor is selected
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      if (!selectedVendor) return;
      try {
        console.log('Fetching POs for vendor:', selectedVendor);
        const response = await fetch(`/api/purchaseorders/vendor/${selectedVendor}`);
        const data = await response.json();
        console.log('Received PO data:', data);
        setPurchaseOrders(data);
        // Reset selected PO when vendor changes
        setSelectedPO(null);
        setPODetails(null);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
      }
    };

    fetchPurchaseOrders();
  }, [selectedVendor]);

  // Fetch PO details when PO is selected
  useEffect(() => {
    const fetchPODetails = async () => {
      if (!selectedPO) {
        setPODetails(null);
        setDeliveryHistory([]);
        return;
      }
      try {
        console.log('Fetching details for PO:', selectedPO);
        const response = await fetch(`/api/purchaseorders/porder/${selectedPO}`);
        const data = await response.json();
        console.log('Received PO details:', data);
        setPODetails(data);
      } catch (error) {
        console.error('Error fetching PO details:', error);
      }
    };

    fetchPODetails();
  }, [selectedPO]);

  // Fetch delivery history when PO is selected
  useEffect(() => {
    const fetchDeliveryHistory = async () => {
      if (!selectedPO) {
        setDeliveryHistory([]);
        return;
      }
      try {
        console.log('Fetching delivery history for PO:', selectedPO);
        const response = await fetch(`/api/materialdocumentsforpo/${selectedPO}`);
        const data = await response.json();
        console.log('Received delivery history:', data);
        setDeliveryHistory(data);
      } catch (error) {
        console.error('Error fetching delivery history:', error);
        setDeliveryHistory([]);
      }
    };

    fetchDeliveryHistory();
  }, [selectedPO]);

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  // PO Sort indicator component
  const POSortIndicator = ({ columnKey }) => {
    if (poSortConfig.key !== columnKey) return null;
    return poSortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  // Calculate top position for PO details based on selected card
  const getPODetailsTopPosition = () => {
    if (!selectedPOCardRef) return 0;
    const cardRect = selectedPOCardRef.getBoundingClientRect();
    const containerRect = selectedPOCardRef.closest('.po-container')?.getBoundingClientRect();
    if (!containerRect) return 0;
    return cardRect.top - containerRect.top;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendors (e.g., vendor*name*term or single term)..."
              className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Use * to separate up to 4 search terms. All terms must appear in the vendor name.
          </p>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vendors Table */}
            <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-xl font-semibold text-gray-800">Vendors</h2>
              </div>
              <div className="overflow-x-auto">
                {sortedVendors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FiUsers className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Search for Vendors</h3>
                    <p className="text-gray-500">Enter a vendor name in the search box above to view the list of vendors.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => requestSort('vendor-code')}
                        >
                          Code <SortIndicator columnKey="vendor-code" />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => requestSort('vendor-name')}
                        >
                          Name <SortIndicator columnKey="vendor-name" />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                        >
                          PO Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedVendors.map((vendor, index) => (
                        <tr 
                          key={index}
                          onClick={() => setSelectedVendor(vendor["vendor-code"])}
                          className={`cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${
                            selectedVendor === vendor["vendor-code"] ? 'bg-blue-100' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vendor["vendor-code"]}
                          </td>
                          <td className="px-6 py-4 text-[12px] font-semibold text-gray-600">
                            {vendor["vendor-name"]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {vendor.poCount || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Purchase Orders and Details Section */}
            {selectedVendor && (
              <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Purchase Orders</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Vendor: {selectedVendor}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Layout:</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setPOLayoutMode('card')}
                          className={`p-2 rounded-md transition-colors duration-200 ${
                            poLayoutMode === 'card' 
                              ? 'bg-white shadow-sm text-blue-600' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="Card Layout"
                        >
                          <FiGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPOLayoutMode('table')}
                          className={`p-2 rounded-md transition-colors duration-200 ${
                            poLayoutMode === 'table' 
                              ? 'bg-white shadow-sm text-blue-600' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="Table Layout"
                        >
                          <FiList className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative po-container">
                  {/* Left Side - PO Lists */}
                  <div className="p-4">
                    {purchaseOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <FiShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Purchase Orders</h3>
                        <p className="text-gray-500">This vendor has no purchase orders in the system.</p>
                      </div>
                    ) : poLayoutMode === 'card' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {purchaseOrders.map((po, index) => (
                          <div 
                            ref={el => poCardRefs.current[po.ponum] = el}
                            key={po.ponum || index}
                            className="p-4 border rounded-lg transition-all duration-200 hover:shadow-md border-gray-200 hover:border-blue-300"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 
                                onClick={(e) => handlePOClick(po.ponum, e)}
                                className="font-semibold text-sky-600 text-sm cursor-pointer hover:text-blue-800 hover:underline"
                              >
                                {po.ponum}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                po.balgrval === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {po.balgrval === 0 ? 'Complete' : 'Pending'}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><span className="font-medium">Date:</span> {moment(po.podate).format('MM/DD/YYYY')}</p>
                              <p><span className="font-medium">Delivery Date:</span> {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YYYY') : 'N/A'}</p>
                              <p><span className="font-medium">Value:</span> {po.poval ? po.poval.toLocaleString() : '0'} SAR</p>
                              <p><span className="font-medium">Balance:</span> {po.balgrval ? po.balgrval.toLocaleString() : '0'} SAR</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PO Number</th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                                onClick={() => requestPOSort('podate')}
                              >
                                Date <POSortIndicator columnKey="podate" />
                              </th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                                onClick={() => requestPOSort('delivery-date')}
                              >
                                Delivery Date <POSortIndicator columnKey="delivery-date" />
                              </th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                                onClick={() => requestPOSort('poval')}
                              >
                                Value (SAR) <POSortIndicator columnKey="poval" />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Balance (SAR)</th>
                              <th 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                                onClick={() => requestPOSort('status')}
                              >
                                Status <POSortIndicator columnKey="status" />
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedPurchaseOrders.map((po, index) => (
                              <tr 
                                key={po.ponum || index}
                                className="hover:bg-blue-50 transition-colors duration-200"
                              >
                                <td 
                                  onClick={(e) => handlePOClick(po.ponum, e)}
                                  className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sky-600 cursor-pointer hover:text-blue-800 hover:underline"
                                >
                                  {po.ponum}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {moment(po.podate).format('MM/DD/YYYY')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YYYY') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {po.poval ? po.poval.toLocaleString() : '0'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {po.balgrval ? po.balgrval.toLocaleString() : '0'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    po.balgrval === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {po.balgrval === 0 ? 'Complete' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Vendor Selected State */}
            {!selectedVendor && (
              <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FiShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Vendor</h3>
                  <p className="text-gray-500">Choose a vendor from the list above to view their purchase orders.</p>
                </div>
              </div>
            )}
          </div>
        )}
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

export default Vendors1; 