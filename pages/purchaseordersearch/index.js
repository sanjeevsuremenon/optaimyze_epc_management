import React, { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import { FiSearch } from 'react-icons/fi';

function PurchaseOrderSearch() {
  const { data: session } = useSession();
  const [vendorSearch, setVendorSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [ponumberSearch, setPonumberSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Handle PO click - open in new tab
  const handlePOClick = (ponum) => {
    window.open(`/purchaseorders/${ponum}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Purchase Order Search</h1>
            <p className="text-gray-600">Search by vendor, project, material, or PO number. Use * to separate up to 4 search terms.</p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., vendor*name*term"
                    className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Project Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name/WBS
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., project*name*term"
                    className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Material Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., material*description*term"
                    className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* PO Number Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., 4500*1289"
                    className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md"
                    value={ponumberSearch}
                    onChange={(e) => setPonumberSearch(e.target.value)}
                  />
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-semibold text-gray-800">
                Results {results.length > 0 && `(${results.length})`}
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FiSearch className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Results</h3>
                <p className="text-gray-500">Enter search criteria above to find purchase orders.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        PO Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Delivery Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Vendor Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Vendor Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((po, index) => (
                      <tr 
                        key={index} 
                        onClick={() => handlePOClick(po.ponum)}
                        className="cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                          {po.ponum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {po.podate ? moment(po.podate).format('MM/DD/YYYY') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YYYY') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {po.vendorcode || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {po.vendorname || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

export default PurchaseOrderSearch;
