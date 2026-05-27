import React, { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import { Bar, Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { FiSearch, FiPackage, FiTruck, FiFileText, FiDollarSign, FiArrowUp, FiArrowDown, FiDatabase, FiBarChart2, FiShoppingCart, FiUsers } from 'react-icons/fi';

function Materials1() {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState({});
  const [purchases, setPurchases] = useState([]);
  const [specialStock, setSpecialStock] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [matdocs, setMatdocs] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'material-code',
    direction: 'asc'
  });

  const { data: session } = useSession();

  // Sort materials based on current sort configuration
  const sortedMaterials = React.useMemo(() => {
    let sortableItems = [...materials];
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
  }, [materials, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Fetch materials based on search term
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!searchTerm || !searchTerm.trim()) {
        setMaterials([]);
        return;
      }
      setLoading(true);
      try {
        const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
        const response = await fetch(`/api/materials?str=${encodedSearchTerm}`);
        const data = await response.json();
        setMaterials(data);
      } catch (error) {
        console.error('Error fetching materials:', error);
        setMaterials([]);
      }
      setLoading(false);
    };

    // Increased debounce delay to avoid multiple fetches when user types/deletes
    const debounceTimer = setTimeout(fetchMaterials, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fetch material details when selected
  useEffect(() => {
    const fetchMaterialDetails = async () => {
      if (!selectedMaterial) return;
      
      try {
        const [materialRes, stockRes, purchasesRes, specialStockRes, requisitionsRes, matdocsRes] = await Promise.all([
          fetch(`/api/materials/${selectedMaterial}`),
          fetch(`/api/completestock/${selectedMaterial}`),
          fetch(`/api/purchaseorders/${selectedMaterial}`),
          fetch(`/api/specialstock/${selectedMaterial}`),
          fetch(`/api/openrequisitions/${selectedMaterial}`),
          fetch(`/api/materialdocuments/${selectedMaterial}`)
        ]);

        const [material, stock, purchases, specialStock, requisitions, matdocs] = await Promise.all([
          materialRes.json(),
          stockRes.json(),
          purchasesRes.json(),
          specialStockRes.json(),
          requisitionsRes.json(),
          matdocsRes.json()
        ]);

        setStockData({ material, stock });
        setPurchases(purchases);
        setSpecialStock(specialStock);
        setRequisitions(requisitions);
        setMatdocs(matdocs);
      } catch (error) {
        console.error('Error fetching material details:', error);
      }
    };

    fetchMaterialDetails();
  }, [selectedMaterial]);

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search materials (e.g., cable*240*arm*1000V or single term)..."
              className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Use * to separate up to 4 search terms. All terms must appear in the description.
          </p>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
            {/* Materials Table */}
            <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-xl font-semibold text-gray-800">Materials</h2>
              </div>
              <div className="overflow-x-auto flex-1">
                {sortedMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <FiDatabase className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Search for Materials</h3>
                    <p className="text-gray-500">Enter a material description in the search box above to view the list of materials.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => requestSort('material-code')}
                        >
                          Code <SortIndicator columnKey="material-code" />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => requestSort('material-description')}
                        >
                          Description <SortIndicator columnKey="material-description" />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => requestSort('unit-measure')}
                        >
                          Unit <SortIndicator columnKey="unit-measure" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedMaterials.map((material, index) => (
                        <tr 
                          key={index}
                          onClick={() => setSelectedMaterial(material["material-code"])}
                          className={`cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${
                            selectedMaterial === material["material-code"] ? 'bg-blue-100' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {material["material-code"]}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {material["material-description"]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {material["unit-measure"]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Material Details */}
            {selectedMaterial && stockData.material ? (
              <div className="space-y-6 overflow-y-auto h-full pr-2">
                {/* Material Info Card */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {stockData.material["material-description"]}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Material Code</p>
                      <p className="font-medium text-gray-800">{stockData.material["material-code"]}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Unit Measure</p>
                      <p className="font-medium text-gray-800">{stockData.material["unit-measure"]}</p>
                    </div>
                  </div>
                </div>

                {/* Stock Overview */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Overview</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: ["Current Stock", "Total Receipts", "Total Issues"],
                        datasets: [{
                          label: stockData.material["material-code"],
                          backgroundColor: "rgb(59, 130, 246)",
                          data: [
                            stockData.stock["current-stkval"],
                            stockData.stock["receipt-val"],
                            stockData.stock["issue-val"]
                          ]
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>

                {/* Purchase Orders */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Purchase Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">PO Number</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Vendor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">PO Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {purchases.slice(0, 5).map((po, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{po["po-number"]}</td>
                            <td className="px-4 py-2 text-sm">{po.vendorname}</td>
                            <td className="px-4 py-2 text-sm">{po["po-quantity"].$numberDecimal}</td>
                            <td className="px-4 py-2 text-sm">{po["po-unit-price"]} {po.currency}</td>
                            <td className="px-4 py-2 text-sm">{po["po-date"] ? moment(po["po-date"]).format('MM/DD/YYYY') : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vendors */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Vendors</h3>
                  <div className="space-y-4">
                    {Object.entries(
                      purchases.reduce((acc, po) => {
                        acc[po.vendorname] = (acc[po.vendorname] || 0) + 1;
                        return acc;
                      }, {})
                    )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([vendor, count], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{vendor}</span>
                        <span className="text-sm text-gray-600">{count} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto h-full pr-2">
                {/* Material Info Placeholder */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <FiPackage className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Material Details</h3>
                    <p className="text-gray-500">Select a material from the list to view its details, stock information, and related data.</p>
                  </div>
                </div>

                {/* Stock Overview Placeholder */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FiBarChart2 className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Stock Overview</h3>
                    <p className="text-gray-500">View current stock levels, receipts, and issues for the selected material.</p>
                  </div>
                </div>

                {/* Purchase Orders Placeholder */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <FiShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Purchase Orders</h3>
                    <p className="text-gray-500">View recent purchase orders and vendor information for the selected material.</p>
                  </div>
                </div>

                {/* Vendors Placeholder */}
                <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-all duration-300 p-6">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <FiUsers className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Top Vendors</h3>
                    <p className="text-gray-500">View the most active vendors for the selected material.</p>
                  </div>
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

export default Materials1; 