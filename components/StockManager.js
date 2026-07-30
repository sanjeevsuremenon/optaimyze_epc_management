import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { sampleSpecialStock, sampleCompleteStock } from "./stockData";
import { 
  Boxes, 
  List, 
  Grid, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Download, 
  Upload
} from "lucide-react";

const flattenObject = (ob) => {
  var toReturn = {};
  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if ((typeof ob[i]) == 'object' && ob[i] !== null && !(ob[i] instanceof Date) && !Array.isArray(ob[i])) {
      if (ob[i].$numberDecimal !== undefined) {
        toReturn[i] = ob[i].$numberDecimal;
      } else {
        var flatObject = flattenObject(ob[i]);
        for (var x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[i + '.' + x] = flatObject[x];
        }
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
};

const parseCSV = (text) => {
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const row = [];
    let inQuotes = false;
    let currentToken = '';
    for (let charIndex = 0; charIndex < lines[i].length; charIndex++) {
      const char = lines[i][charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentToken.trim().replace(/^["']|["']$/g, ''));
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    row.push(currentToken.trim().replace(/^["']|["']$/g, ''));
    
    if (row.length === headers.length) {
      const obj = {};
      headers.forEach((h, index) => {
        obj[h] = row[index];
      });
      result.push(obj);
    }
  }
  return result;
};

export default function StockManager({ initialTab = "specialstock" }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [searchTerm, setSearchTerm] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Edit/Add modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); 
  const [formData, setFormData] = useState({});

  // Tab definitions
  const tabs = [
    { id: "specialstock", label: "Special Stock", icon: Boxes, type: "specialstock" },
    { id: "completestock", label: "Complete Stock", icon: Boxes, type: "completestock" }
  ];

  const currentTabDef = tabs.find(t => t.id === activeTab) || tabs[0];

  useEffect(() => {
    setMounted(true);
    if (activeTab === "specialstock" || activeTab === "completestock") {
      fetchData();
    }
  }, [activeTab, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data-load/${currentTabDef.type}?limit=100&skip=0&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const json = await res.json();
        const formattedData = json.data.map(d => flattenObject(d));
        setDataList(formattedData || []);
        setTotalCount(json.total || 0);
      } else {
        console.error("Failed to fetch data:", await res.text());
        setDataList([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setDataList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Data Export/Import ---

  const handleDownloadTemplate = () => {
    let headers = [];
    let sampleData = [];
    let fileName = "";
    
    if (activeTab === "specialstock") {
      headers = [
        "material-code", "plant-code", "unit-of-measure", "stk-indicator", 
        "sales-doc", "sales-doc-no", "wbs-element", "stock-qty", "stock-val", "stock-date"
      ];
      sampleData = sampleSpecialStock;
      fileName = "SpecialStock_Template.csv";
    } else if (activeTab === "completestock") {
      headers = [
        "material-code", "plant-code", "unit-of-measure", "receipt-qty", 
        "issue-qty", "current-stkqty", "receipt-val", "issue-val", "current-stkval", "stock-date"
      ];
      sampleData = sampleCompleteStock;
      fileName = "CompleteStock_Template.csv";
    }

    let csvContent = headers.join(",") + "\n";
    
    sampleData.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === undefined || val === null) val = "";
        
        val = String(val);
        if (val.includes(',') || val.includes('\n') || val.includes('\r')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvContent += values.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedData = parseCSV(text);
      if (parsedData.length > 0) {
        try {
          const res = await fetch(`/api/data-load/${currentTabDef.type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bulk: true, data: parsedData })
          });
          if (res.ok) {
            alert(`Successfully imported ${parsedData.length} records.`);
            fetchData();
          } else {
            alert("Upload failed. See console.");
            console.error(await res.text());
          }
        } catch (error) {
          alert("Upload error.");
          console.error(error);
        }
      }
      e.target.value = null; // reset input
    };
    reader.readAsText(file);
  };

  // --- CRUD Modal Handlers ---

  const openAddModal = () => {
    setEditingRecord(null);
    let initialData = {};
    if (activeTab === "specialstock") {
      initialData = {
        "material-code": "", "plant-code": "", "unit-of-measure": "EA",
        "stk-indicator": "Q", "sales-doc": "", "sales-doc-no": "0",
        "wbs-element": "", "stock-qty": "0", "stock-val": "0", "stock-date": new Date().toISOString().split('T')[0]
      };
    } else if (activeTab === "completestock") {
      initialData = {
        "material-code": "", "plant-code": "", "unit-of-measure": "EA",
        "receipt-qty": "0", "issue-qty": "0", "current-stkqty": "0",
        "receipt-val": "0", "issue-val": "0", "current-stkval": "0", "stock-date": new Date().toISOString().split('T')[0]
      };
    }
    setFormData(initialData);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const flattened = flattenObject(record);
    
    // Convert any Decimal128 or date objects for inputs
    const parsedData = {};
    Object.keys(flattened).forEach(k => {
      let val = flattened[k];
      if (val && typeof val === 'object' && val.$numberDecimal) {
        val = val.$numberDecimal;
      } else if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        val = val.substring(0, 10); // get YYYY-MM-DD
      }
      parsedData[k] = val;
    });

    setFormData(parsedData);
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    try {
      let payload = { ...formData };
      
      const isEdit = !!editingRecord;
      const method = isEdit ? 'PUT' : 'POST';
      if (isEdit) {
        payload._id = editingRecord._id;
      }

      const res = await fetch(`/api/data-load/${currentTabDef.type}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save record");
        console.error(await res.text());
      }
    } catch (err) {
      alert("Error saving record");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/data-load/${currentTabDef.type}?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete record");
      }
    } catch (err) {
      alert("Error deleting");
      console.error(err);
    }
  };

  // --- Render Helpers ---

  const renderDataGrid = () => {
    if (loading) return <div className="p-4 text-gray-500">Loading...</div>;
    if (dataList.length === 0) return <div className="p-4 text-gray-500">No records found.</div>;

    let columns = [];
    if (activeTab === "specialstock") {
      columns = [
        { label: "Material Code", key: "material-code" },
        { label: "Plant", key: "plant-code" },
        { label: "UOM", key: "unit-of-measure" },
        { label: "Indicator", key: "stk-indicator" },
        { label: "Sales Doc", key: "sales-doc" },
        { label: "Sales Doc No", key: "sales-doc-no" },
        { label: "WBS Element", key: "wbs-element" },
        { label: "Qty", key: "stock-qty", isDecimal: true },
        { label: "Value", key: "stock-val", isDecimal: true },
        { label: "Stock Date", key: "stock-date", isDate: true }
      ];
    } else if (activeTab === "completestock") {
      columns = [
        { label: "Material Code", key: "material-code" },
        { label: "Plant", key: "plant-code" },
        { label: "UOM", key: "unit-of-measure" },
        { label: "Receipt Qty", key: "receipt-qty", isDecimal: true },
        { label: "Issue Qty", key: "issue-qty", isDecimal: true },
        { label: "Current Qty", key: "current-stkqty", isDecimal: true },
        { label: "Receipt Val", key: "receipt-val", isDecimal: true },
        { label: "Issue Val", key: "issue-val", isDecimal: true },
        { label: "Current Val", key: "current-stkval", isDecimal: true },
        { label: "Stock Date", key: "stock-date", isDate: true }
      ];
    }

    return (
      <div className="overflow-x-auto w-full border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {dataList.map((row, i) => (
              <tr key={row._id || i} className="hover:bg-gray-50/50 transition-colors">
                {columns.map(col => {
                  let val = row[col.key] || "";
                  if (col.isDecimal && val && val.$numberDecimal) val = val.$numberDecimal;
                  if (col.isDate && val && typeof val === 'string' && val.length > 10) val = val.substring(0, 10);
                  
                  return (
                    <td key={col.key} className="px-4 py-2 text-gray-800 whitespace-nowrap">
                      {val}
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                  <button onClick={() => openEditModal(row)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded" title="Edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModalForm = () => {
    let formFields = [];
    if (activeTab === "specialstock") {
      formFields = [
        { key: "material-code", label: "Material Code" },
        { key: "plant-code", label: "Plant Code" },
        { key: "unit-of-measure", label: "Unit of Measure" },
        { key: "stk-indicator", label: "Stock Indicator" },
        { key: "sales-doc", label: "Sales Doc" },
        { key: "sales-doc-no", label: "Sales Doc No" },
        { key: "wbs-element", label: "WBS Element" },
        { key: "stock-qty", label: "Stock Qty", type: "number" },
        { key: "stock-val", label: "Stock Value", type: "number", step: "0.01" },
        { key: "stock-date", label: "Stock Date", type: "date" }
      ];
    } else if (activeTab === "completestock") {
      formFields = [
        { key: "material-code", label: "Material Code" },
        { key: "plant-code", label: "Plant Code" },
        { key: "unit-of-measure", label: "Unit of Measure" },
        { key: "receipt-qty", label: "Receipt Qty", type: "number" },
        { key: "issue-qty", label: "Issue Qty", type: "number" },
        { key: "current-stkqty", label: "Current Stock Qty", type: "number" },
        { key: "receipt-val", label: "Receipt Value", type: "number", step: "0.01" },
        { key: "issue-val", label: "Issue Value", type: "number", step: "0.01" },
        { key: "current-stkval", label: "Current Stock Value", type: "number", step: "0.01" },
        { key: "stock-date", label: "Stock Date", type: "date" }
      ];
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formFields.map(f => (
          <div key={f.key} className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">{f.label}</label>
            <input
              type={f.type || "text"}
              step={f.step || undefined}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData[f.key] ?? ""}
              onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    );
  };

  const modalContent = isModalOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {editingRecord ? `Edit ${currentTabDef.label}` : `Add New ${currentTabDef.label}`}
          </h2>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {renderModalForm()}
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleModalSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
            Save Record
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!mounted) return null;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stock Management</h1>
            <p className="text-gray-500 mt-1">Manage special stock and complete stock data</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-gray-700 font-medium"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download Template</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-gray-700 font-medium cursor-pointer">
              <Upload size={18} />
              <span className="hidden sm:inline">Upload CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleUploadCSV} />
            </label>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium"
            >
              <Plus size={18} />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchTerm("");
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${isActive 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-full">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                placeholder={`Search ${currentTabDef.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                  title="Table View"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "card" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                  title="Card View"
                >
                  <Grid size={18} />
                </button>
              </div>
              <div className="text-sm text-gray-500 font-medium px-2">
                Total: {totalCount}
              </div>
            </div>
          </div>

          {/* Grid Render */}
          {renderDataGrid()}
        </div>
      </div>
      
      {/* Modals using Portal to body to avoid CSS transforms breaking fixed positioning */}
      {mounted && createPortal(modalContent, document.body)}
    </div>
  );
}
