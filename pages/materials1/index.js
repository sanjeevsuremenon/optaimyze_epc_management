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
    <div className="app-page min-h-screen">
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search materials (e.g., cable*240*arm*1000V or single term)..."
              className="w-full px-4 py-3 pl-12 text-app-text bg-app-surface/80 border border-app-border rounded-xl focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent shadow-lg transition-all duration-300 placeholder-app-text-disabled"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
          </div>
          <p className="text-sm text-app-text-muted mt-2 text-center">
            Use * to separate up to 4 search terms. All terms must appear in the description.
          </p>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Materials Table */}
            <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-app-border bg-app-surface-muted">
                <h2 className="text-xl font-bold text-app-text flex items-center">
                  <div className="w-1.5 h-6 bg-app-accent rounded-full mr-3"></div>
                  Materials
                </h2>
              </div>
              <div className="overflow-x-auto flex-1">
                {sortedMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <FiDatabase className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-app-text-secondary mb-2">Search for Materials</h3>
                    <p className="text-app-text-muted">Enter a material description in the search box above to view the list of materials.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-app-surface-muted sticky top-0 border-b border-app-border">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider cursor-pointer hover:text-app-accent transition-colors duration-200 group"
                          onClick={() => requestSort('material-code')}
                        >
                          Code <span className="text-slate-600 group-hover:text-cyan-500"><SortIndicator columnKey="material-code" /></span>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider cursor-pointer hover:text-app-accent transition-colors duration-200 group"
                          onClick={() => requestSort('material-description')}
                        >
                          Description <span className="text-slate-600 group-hover:text-cyan-500"><SortIndicator columnKey="material-description" /></span>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider cursor-pointer hover:text-app-accent transition-colors duration-200 group"
                          onClick={() => requestSort('unit-measure')}
                        >
                          Unit <span className="text-slate-600 group-hover:text-cyan-500"><SortIndicator columnKey="unit-measure" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-app-surface-muted divide-y divide-app-border">
                      {sortedMaterials.map((material, index) => (
                        <tr 
                          key={index}
                          onClick={() => setSelectedMaterial(material["material-code"])}
                          className={`cursor-pointer transition-colors duration-200 group ${
                            selectedMaterial === material["material-code"] 
                              ? 'bg-cyan-900/20 border-l-4 border-app-accent' 
                              : 'hover:bg-app-surface-muted border-l-4 border-transparent'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-app-accent group-hover:text-app-accent">
                            {material["material-code"]}
                          </td>
                          <td className="px-6 py-4 text-sm text-app-text-secondary group-hover:text-app-text">
                            {material["material-description"]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted group-hover:text-app-text-secondary">
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
              <div className="space-y-6">
                {/* Material Info Card */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-app-accent/5 rounded-bl-full -mr-10 -mt-10 blur-xl"></div>
                  <h3 className="text-xl font-bold text-app-text mb-4 relative z-10 flex items-center">
                    <FiPackage className="mr-3 text-app-accent" />
                    {stockData.material["material-description"]}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-app-surface-muted border border-app-border/50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-app-text-muted mb-1">Material Code</p>
                      <p className="font-bold text-app-accent text-lg">{stockData.material["material-code"]}</p>
                    </div>
                    <div className="bg-app-surface-muted border border-app-border/50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-app-text-muted mb-1">Unit Measure</p>
                      <p className="font-bold text-app-text text-lg">{stockData.material["unit-measure"]}</p>
                    </div>
                  </div>
                </div>

                {/* Stock Overview */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-app-text mb-4 flex items-center">
                    <FiBarChart2 className="mr-2 text-cyan-500" />
                    Stock Overview
                  </h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: ["Current Stock", "Total Receipts", "Total Issues"],
                        datasets: [{
                          label: stockData.material["material-code"],
                          backgroundColor: ["#06b6d4", "#10b981", "#f43f5e"],
                          data: [
                            stockData.stock["current-stkval"],
                            stockData.stock["receipt-val"],
                            stockData.stock["issue-val"]
                          ],
                          borderRadius: 4
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: '#cbd5e1' } }
                        },
                        scales: {
                          y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                          x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Purchase Orders */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-app-text mb-4 flex items-center">
                    <FiShoppingCart className="mr-2 text-cyan-500" />
                    Recent Purchase Orders
                  </h3>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                      <thead className="bg-app-surface-muted border-b border-app-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-app-border/50">
                        {purchases.slice(0, 5).map((po, index) => (
                          <tr key={index} className="hover:bg-app-surface/30 transition-colors duration-150">
                            <td className="px-4 py-3 text-sm font-medium text-app-accent">{po["po-number"]}</td>
                            <td className="px-4 py-3 text-sm text-app-text-secondary">{po.vendorname}</td>
                            <td className="px-4 py-3 text-sm font-medium text-app-text">{po["po-quantity"].$numberDecimal}</td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-400">{po["po-unit-price"]} {po.currency}</td>
                            <td className="px-4 py-3 text-sm text-app-text-muted">{po["po-date"] ? moment(po["po-date"]).format('MM/DD/YYYY') : 'N/A'}</td>
                          </tr>
                        ))}
                        {purchases.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-app-text-muted text-sm">No recent purchase orders found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vendors */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-app-text mb-4 flex items-center">
                    <FiUsers className="mr-2 text-cyan-500" />
                    Top Vendors
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      purchases.reduce((acc, po) => {
                        acc[po.vendorname] = (acc[po.vendorname] || 0) + 1;
                        return acc;
                      }, {})
                    )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([vendor, count], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-app-surface/30 rounded-xl border border-app-border/30 hover:border-slate-600 transition-colors">
                        <span className="text-sm font-medium text-app-text">{vendor || "Unknown Vendor"}</span>
                        <span className="text-xs font-bold px-2.5 py-1 bg-cyan-900/30 text-app-accent rounded-lg">{count} orders</span>
                      </div>
                    ))}
                    {purchases.length === 0 && (
                      <div className="text-center text-app-text-muted text-sm py-4">No vendor data available</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Material Info Placeholder */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <FiPackage className="w-16 h-16 text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-app-text-secondary mb-2">Material Details</h3>
                    <p className="text-sm text-app-text-muted max-w-sm">Select a material from the list to view its details, stock information, and related data.</p>
                  </div>
                </div>

                {/* Stock Overview Placeholder */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FiBarChart2 className="w-16 h-16 text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-app-text-secondary mb-2">Stock Overview</h3>
                    <p className="text-sm text-app-text-muted max-w-sm">View current stock levels, receipts, and issues for the selected material.</p>
                  </div>
                </div>

                {/* Purchase Orders Placeholder */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <FiShoppingCart className="w-16 h-16 text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-app-text-secondary mb-2">Purchase Orders</h3>
                    <p className="text-sm text-app-text-muted max-w-sm">View recent purchase orders and vendor information for the selected material.</p>
                  </div>
                </div>

                {/* Vendors Placeholder */}
                <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <FiUsers className="w-16 h-16 text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-app-text-secondary mb-2">Top Vendors</h3>
                    <p className="text-sm text-app-text-muted max-w-sm">View the most active vendors for the selected material.</p>
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