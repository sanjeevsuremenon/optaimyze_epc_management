import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { sampleVendors, samplePurchaseOrders } from "./purchaseOrdersData";
import { 
  FileSpreadsheet, 
  Users, 
  GitBranch, 
  List, 
  Grid, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Download, 
  Upload,
  ChevronRight,
  Eye
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

export default function PurchaseOrdersManager({ initialTab = "purchaseorders" }) {
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

  // Hierarchy Explorer states
  const [allVendors, setAllVendors] = useState([]);
  const [selectedVendorCode, setSelectedVendorCode] = useState("");
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [hierarchyPOList, setHierarchyPOList] = useState([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Tab definitions
  const tabs = [
    { id: "purchaseorders", label: "Purchase Orders", icon: FileSpreadsheet, type: "purchaseorders" },
    { id: "vendors", label: "Vendors List", icon: Users, type: "vendors" },
    { id: "explorer", label: "PO-Vendor Explorer", icon: GitBranch, type: "explorer" }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch list data
  const fetchData = useCallback(async () => {
    if (activeTab === "explorer") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/data-load/${activeTab}?search=${encodeURIComponent(searchTerm)}&limit=100`);
      const json = await res.json();
      setDataList(json.data || []);
      setTotalCount(json.total || 0);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  // Load all vendors for explorer selection
  const fetchAllVendors = async () => {
    try {
      const res = await fetch("/api/data-load/vendors?limit=500");
      const json = await res.json();
      setAllVendors(json.data || []);
      if (json.data && json.data.length > 0) {
        setSelectedVendorCode(json.data[0]["vendor-code"]);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  // Load hierarchy info
  const fetchHierarchy = useCallback(async () => {
    if (!selectedVendorCode) return;
    setLoadingHierarchy(true);
    try {
      // Find details from local list or API
      const vendor = allVendors.find(v => v["vendor-code"] === selectedVendorCode);
      setSelectedVendorDetails(vendor || null);

      // Fetch grouped POs
      const res = await fetch(`/api/purchaseorders/vendor/${selectedVendorCode}`);
      const json = await res.json();
      setHierarchyPOList(json || []);
    } catch (err) {
      console.error("Error loading hierarchy:", err);
    } finally {
      setLoadingHierarchy(false);
    }
  }, [selectedVendorCode, allVendors]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "explorer") {
      fetchAllVendors();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "explorer" && selectedVendorCode) {
      fetchHierarchy();
    }
  }, [activeTab, selectedVendorCode, fetchHierarchy]);

  // Delete handler
  const handleDelete = async (record) => {
    if (!confirm(`Are you sure you want to delete this record?`)) return;
    try {
      const res = await fetch(`/api/data-load/${activeTab}?id=${record._id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
      }
    } catch (err) {
      alert("Error deleting record.");
    }
  };

  // Save handler (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingRecord ? "PUT" : "POST";
    const bodyData = editingRecord ? { ...formData, _id: editingRecord._id } : formData;

    try {
      const res = await fetch(`/api/data-load/${activeTab}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Save failed: ${err.error}`);
      }
    } catch (err) {
      alert("Error saving record.");
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    const newForm = {};
    if (activeTab === "purchaseorders") {
      newForm["po-number"] = "";
      newForm["po-line-item"] = "10";
      newForm["po-date"] = "";
      newForm["vendorcode"] = "";
      newForm["vendorname"] = "";
      newForm["material.matcode"] = "";
      newForm["material.matdescription"] = "";
      newForm["material.matgroup"] = "";
      newForm["plant-code"] = "1100";
      newForm["po-quantity"] = "";
      newForm["po-unit-of-measure"] = "EA";
      newForm["po-unit-price"] = "";
      newForm["currency"] = "SAR";
      newForm["po-value-sar"] = "";
      newForm["pending-qty"] = "";
      newForm["pending-val-sar"] = "";
      newForm["pending-inv-qty"] = "";
      newForm["pending-inv-val"] = "";
      newForm["delivery-date"] = "";
      newForm["account.wbs"] = "";
      newForm["account.network"] = "";
      newForm["account.network-activity"] = "";
      newForm["account.costcenter"] = "";
      newForm["account.order"] = "";
      newForm["account.salesdoc"] = "";
      newForm["account.salesdoc-item"] = "";
    } else if (activeTab === "vendors") {
      newForm["vendor-code"] = "";
      newForm["vendor-name"] = "";
      newForm["address.countrycode"] = "SA";
      newForm["address.city"] = "";
      newForm["address.street"] = "";
      newForm["address.district"] = "";
      newForm["address.pobox"] = "";
      newForm["address.zipcode"] = "";
      newForm["created_by"] = "";
      newForm["contact.telelphone1"] = "";
      newForm["contact.telephone2"] = "";
      newForm["contact.fax"] = "";
      newForm["vat-number"] = "";
    }
    setFormData(newForm);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const flattened = flattenObject(record);
    // Parse Decimal128 values to flat strings for display
    Object.keys(flattened).forEach(key => {
      let val = flattened[key];
      if (val && typeof val === 'object' && val.$numberDecimal) {
        flattened[key] = val.$numberDecimal;
      } else if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        flattened[key] = val.substring(0, 10);
      }
    });
    setFormData(flattened);
    setIsModalOpen(true);
  };

  // CSV Export/Template Download
  const handleDownloadTemplate = () => {
    let headers = [];
    let rows = [];
    if (activeTab === "purchaseorders") {
      headers = [
        "po-number", "po-line-item", "po-date", "vendorcode", "vendorname", 
        "material.matcode", "material.matdescription", "material.matgroup", "plant-code", 
        "po-quantity", "po-unit-of-measure", "po-unit-price", "currency", 
        "po-value-sar", "pending-qty", "pending-val-sar", "pending-inv-qty", "pending-inv-val", 
        "delivery-date", "account.wbs", "account.network", "account.network-activity",
        "account.costcenter", "account.order", "account.salesdoc", "account.salesdoc-item"
      ];
      rows = samplePurchaseOrders;
    } else if (activeTab === "vendors") {
      headers = [
        "vendor-code", "vendor-name", "address.countrycode", "address.city", 
        "address.street", "address.district", "address.pobox", "address.zipcode", 
        "created_date", "created_by", "contact.telelphone1", "contact.telephone2", "contact.fax", "vat-number"
      ];
      rows = sampleVendors;
    }

    const csvLines = [headers.join(",")];
    rows.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === undefined || val === null) {
          val = "";
        }
        val = String(val);
        // Always wrap in quotes to handle commas, quotes, newlines in data
        val = '"' + val.replace(/"/g, '""') + '"';
        return val;
      });
      csvLines.push(values.join(","));
    });

    const csvString = csvLines.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getVal = (val) => val && val.$numberDecimal ? val.$numberDecimal : val;

  // CSV Import handler
  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedData = parseCSV(text);
      if (parsedData.length === 0) {
        alert("The CSV file is empty or invalid.");
        return;
      }

      try {
        const res = await fetch(`/api/data-load/${activeTab}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, data: parsedData })
        });
        const result = await res.json();
        if (res.ok) {
          alert(`Successfully uploaded ${result.matchedCount + result.upsertedCount} records.`);
          fetchData();
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      } catch (err) {
        alert("Upload error.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                active 
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400" 
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== "explorer" ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Card / Table Toggle */}
              <div className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "table" ? "bg-slate-800 text-cyan-400" : "text-slate-400"}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "card" ? "bg-slate-800 text-cyan-400" : "text-slate-400"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* CSV Upload/Download */}
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                Template
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleUploadCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button 
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </button>
              </div>

              {/* Add New */}
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
          </div>

          {/* List display based on viewMode */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 font-medium">Loading data...</div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/60">
                  {activeTab === "purchaseorders" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Line Item</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">PO Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Plant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Material Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Material Desc</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">PO Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">UOM</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total (SAR)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Val</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Network</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Doc</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  {activeTab === "vendors" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">City</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">District</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">PO Box</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vat Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tel 1</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tel 2</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Fax</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-transparent text-slate-200">
                  {dataList.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-800/20 transition-colors">
                      {activeTab === "purchaseorders" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-400">{row["po-number"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350">{row["po-line-item"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["po-date"] ? new Date(row["po-date"]).toLocaleDateString() : "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["delivery-date"] ? new Date(row["delivery-date"]).toLocaleDateString() : "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["vendorcode"]}</td>
                          <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">{row["vendorname"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["plant-code"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["material"]?.matcode || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{row["material"]?.matdescription || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getVal(row["po-quantity"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["po-unit-of-measure"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getVal(row["po-unit-price"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["currency"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-bold">{getVal(row["po-value-sar"]) ? Number(getVal(row["po-value-sar"])).toLocaleString() : "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getVal(row["pending-qty"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getVal(row["pending-val-sar"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["account"]?.network || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["account"]?.salesdoc || "N/A"}</td>
                        </>
                      )}
                      {activeTab === "vendors" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-400">{row["vendor-code"]}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-300 max-w-md truncate">{row["vendor-name"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["address"]?.countrycode || "SA"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["address"]?.city || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["address"]?.district || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["address"]?.pobox || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-450">{row["vat-number"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-450">{row["contact"]?.telelphone1 || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-450">{row["contact"]?.telelphone2 || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-450">{row["contact"]?.fax || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-450">{row["created_by"] || "N/A"}</td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(row)}
                          className="text-slate-400 hover:text-amber-400 transition p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-slate-400 hover:text-rose-500 transition p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dataList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500 text-sm">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card view */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dataList.map((row) => (
                <div key={row._id} className="app-card rounded-[1.5rem] p-6 shadow-md border border-slate-800/80 hover:border-slate-700/80 flex flex-col justify-between space-y-4">
                  <div>
                    {activeTab === "purchaseorders" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-0.5 rounded-full">
                          PO: {row["po-number"]} (Item {row["po-line-item"]})
                        </span>
                        <h4 className="text-base font-bold text-slate-100 mt-3 line-clamp-2">{row["material"]?.matdescription || "Purchase Order Item"}</h4>
                        <p className="text-xs text-slate-500 mt-2">Vendor: <span className="font-semibold text-slate-355">{row["vendorname"]}</span></p>
                      </>
                    )}
                    {activeTab === "vendors" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-400 bg-purple-950/40 border border-purple-800/30 px-2.5 py-0.5 rounded-full">
                          Vendor: {row["vendor-code"]}
                        </span>
                        <h4 className="text-base font-bold text-slate-100 mt-3 line-clamp-2">{row["vendor-name"]}</h4>
                        <p className="text-xs text-slate-500 mt-2">City: <span className="font-semibold text-slate-300">{row["address"]?.city || "N/A"}</span></p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
                    <span className="text-xs font-bold text-cyan-300">
                      {activeTab === "purchaseorders" ? `SAR ${Number(getVal(row["po-value-sar"]) || 0).toLocaleString()}` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-500 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {dataList.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">No records found.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Hierarchy explorer nodes mapping view */
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">PO-Vendor Explorer Linkage</h3>
              <p className="text-xs text-slate-400 mt-1">Select a Vendor to view their details, primary address, and list of purchase orders.</p>
            </div>
            <div>
              <select
                value={selectedVendorCode}
                onChange={(e) => setSelectedVendorCode(e.target.value)}
                className="w-full md:w-80 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
              >
                {allVendors.map((v) => (
                  <option key={v._id} value={v["vendor-code"]}>
                    {v["vendor-code"]} - {v["vendor-name"]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingHierarchy ? (
            <div className="text-center py-16 text-slate-400 font-medium">Loading mapped orders...</div>
          ) : selectedVendorDetails ? (
            <div className="bg-slate-950/40 border border-slate-900/60 p-8 rounded-[2rem] flex flex-col items-center">
              
              {/* Visual Node Hierarchy */}
              <div className="w-full max-w-4xl flex flex-col items-center gap-10">
                {/* 1. Vendor Node */}
                <div className="relative flex flex-col items-center w-full">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-xl text-center border border-purple-400/20 max-w-md w-full">
                    <span className="text-[10px] uppercase font-black tracking-widest text-purple-200 font-mono">Vendor Master Node</span>
                    <h2 className="text-lg font-black text-white mt-1">{selectedVendorDetails["vendor-name"]}</h2>
                    <p className="text-xs text-purple-100 mt-2 font-medium">Code: {selectedVendorDetails["vendor-code"]}</p>
                    {selectedVendorDetails.address && (
                      <p className="text-[11px] text-purple-200 mt-2">
                        {selectedVendorDetails.address.city}, {selectedVendorDetails.address.countrycode}
                      </p>
                    )}
                    <div className="mt-3 text-[10px] text-indigo-200 border-t border-indigo-500/30 pt-2 flex justify-around">
                      <span>VAT: {selectedVendorDetails["vat-number"] || "N/A"}</span>
                      <span>Tel: {selectedVendorDetails.contact?.telelphone1 || "N/A"}</span>
                    </div>
                  </div>
                  {/* Stem Down */}
                  <div className="w-0.5 h-10 bg-slate-800"></div>
                </div>

                {/* 2. Grouped Purchase Orders List */}
                <div className="flex flex-col items-center bg-slate-900/30 border border-slate-800/40 p-6 rounded-2xl w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-slate-200">Grouped Purchase Orders</h3>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 w-full">
                    {hierarchyPOList.map((po) => (
                      <div key={po.ponum} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col gap-1 justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-cyan-400">PO: {po.ponum}</span>
                            <span className="text-[10px] text-slate-500">{po.podate ? new Date(po.podate).toLocaleDateString() : ""}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">Delivery: {po["delivery-date"] ? new Date(po["delivery-date"]).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-850 pt-2 mt-3 text-xs">
                          <span className="font-bold text-emerald-450">SAR {getVal(po.poval) ? Number(getVal(po.poval)).toLocaleString() : "0"}</span>
                          <span className="text-slate-500">Bal: SAR {getVal(po.balgrval) ? Number(getVal(po.balgrval)).toLocaleString() : "0"}</span>
                        </div>
                      </div>
                    ))}
                    {hierarchyPOList.length === 0 && (
                      <p className="col-span-full text-xs text-slate-505 text-center py-8">No purchase orders found for this vendor.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>
      )}

      {/* CRUD Add/Edit Modal */}
      {mounted && isModalOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              backgroundColor: '#0f172a', // slate-900
              border: '1px solid #334155', // slate-700/80
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '32rem', // slightly wider for PO details
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
              <h3 className="text-lg font-bold text-slate-100">{editingRecord ? "Edit Record" : "Add New Record"}</h3>
              <p className="text-xs text-slate-400 mt-1">Fill in the fields to save to database.</p>
            </div>
            
            <form 
              onSubmit={handleSave} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden'
              }}
            >
              <div 
                style={{
                  padding: '1.5rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {activeTab === "purchaseorders" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">PO Number (Required)</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingRecord}
                          value={formData["po-number"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "po-number": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Line Item (Required)</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingRecord}
                          value={formData["po-line-item"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "po-line-item": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">PO Date</label>
                        <input
                          type="date"
                          value={formData["po-date"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "po-date": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Delivery Date</label>
                        <input
                          type="date"
                          value={formData["delivery-date"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "delivery-date": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Plant Code</label>
                        <input
                          type="text"
                          value={formData["plant-code"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "plant-code": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Vendor Code</label>
                        <input
                          type="text"
                          value={formData["vendorcode"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vendorcode": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Vendor Name</label>
                        <input
                          type="text"
                          value={formData["vendorname"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vendorname": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-3 mt-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-3">Material Info</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Material Code</label>
                          <input
                            type="text"
                            value={formData["material.matcode"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "material.matcode": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Material Group</label>
                          <input
                            type="text"
                            value={formData["material.matgroup"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "material.matgroup": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Material Description</label>
                        <input
                          type="text"
                          value={formData["material.matdescription"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "material.matdescription": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-3 mt-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-3">Pricing & Quantities</span>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">PO Quantity</label>
                          <input
                            type="text"
                            value={formData["po-quantity"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-quantity": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">UOM</label>
                          <input
                            type="text"
                            value={formData["po-unit-of-measure"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-unit-of-measure": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Unit Price</label>
                          <input
                            type="text"
                            value={formData["po-unit-price"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-unit-price": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Currency</label>
                          <input
                            type="text"
                            value={formData["currency"] ?? "SAR"}
                            onChange={(e) => setFormData({ ...formData, "currency": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Value (SAR)</label>
                          <input
                            type="text"
                            value={formData["po-value-sar"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-value-sar": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Pending Qty</label>
                          <input
                            type="text"
                            value={formData["pending-qty"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-qty": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Pending Val (SAR)</label>
                          <input
                            type="text"
                            value={formData["pending-val-sar"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-val-sar": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Pending Inv Qty</label>
                          <input
                            type="text"
                            value={formData["pending-inv-qty"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-inv-qty": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Pending Inv Val</label>
                          <input
                            type="text"
                            value={formData["pending-inv-val"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-inv-val": e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-3 mt-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-3">Accounting Mapping</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">WBS Element Link</label>
                          <input
                            type="text"
                            value={formData["account.wbs"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.wbs": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Network Number</label>
                          <input
                            type="text"
                            value={formData["account.network"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.network": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Network Activity</label>
                          <input
                            type="text"
                            value={formData["account.network-activity"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.network-activity": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Cost Center</label>
                          <input
                            type="text"
                            value={formData["account.costcenter"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.costcenter": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Order</label>
                          <input
                            type="text"
                            value={formData["account.order"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.order": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Sales Doc</label>
                          <input
                            type="text"
                            value={formData["account.salesdoc"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.salesdoc": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Sales Doc Item</label>
                          <input
                            type="text"
                            value={formData["account.salesdoc-item"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.salesdoc-item": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "vendors" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Vendor Code (Required)</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingRecord}
                          value={formData["vendor-code"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vendor-code": e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">VAT Number</label>
                        <input
                          type="text"
                          value={formData["vat-number"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vat-number": e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Vendor Name (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["vendor-name"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "vendor-name": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>

                    <div className="border-t border-slate-850 pt-3 mt-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-3">Address Details</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">City</label>
                          <input
                            type="text"
                            value={formData["address.city"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.city": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Country Code</label>
                          <input
                            type="text"
                            value={formData["address.countrycode"] ?? "SA"}
                            onChange={(e) => setFormData({ ...formData, "address.countrycode": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Street Address</label>
                          <input
                            type="text"
                            value={formData["address.street"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.street": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">District</label>
                          <input
                            type="text"
                            value={formData["address.district"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.district": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">PO Box</label>
                          <input
                            type="text"
                            value={formData["address.pobox"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.pobox": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Zip Code</label>
                          <input
                            type="text"
                            value={formData["address.zipcode"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.zipcode": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-3 mt-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-3">Contact Information</span>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Telephone 1</label>
                          <input
                            type="text"
                            value={formData["contact.telelphone1"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "contact.telelphone1": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Telephone 2</label>
                          <input
                            type="text"
                            value={formData["contact.telephone2"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "contact.telephone2": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Fax</label>
                          <input
                            type="text"
                            value={formData["contact.fax"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "contact.fax": e.target.value })}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Created By</label>
                        <input
                          type="text"
                          value={formData["created_by"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "created_by": e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div 
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #1e293b',
                  backgroundColor: 'rgba(15, 23, 42, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
