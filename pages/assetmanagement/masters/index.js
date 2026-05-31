import React, { useState, useEffect } from "react";
import Head from "next/head";
import { 
  MapPin, 
  Map, 
  Building2, 
  BadgeCheck,
  Tags,
  FolderTree,
  Factory,
  Settings,
  Settings2,
  Wrench,
  Upload,
  Download
} from "lucide-react";
import MasterTable from "../../../components/AssetManagement/MasterTable";
import MasterFormModal from "../../../components/AssetManagement/MasterFormModal";
import BulkImportModal from "../../../components/AssetManagement/BulkImportModal";

const masterTabs = [
  {
    id: "fixed-asset-categories",
    label: "FA Categories",
    apiType: "fixed-asset-categories",
    icon: Tags,
    fields: [
      { key: "name", label: "Category Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "fixed-asset-subcategories",
    label: "FA Subcategories",
    apiType: "fixed-asset-subcategories",
    icon: FolderTree,
    fields: [
      { key: "category", label: "Category", type: "dynamic-select", dependsOn: "fixed-asset-categories", required: true, isKey: true },
      { key: "name", label: "Subcategory Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "fixed-asset-manufacturers",
    label: "FA Manufacturers",
    apiType: "fixed-asset-manufacturers",
    icon: Factory,
    fields: [
      { key: "name", label: "Manufacturer Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "mme-categories",
    label: "MME Categories",
    apiType: "mme-categories",
    icon: Settings,
    fields: [
      { key: "name", label: "Category Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "mme-subcategories",
    label: "MME Subcategories",
    apiType: "mme-subcategories",
    icon: Settings2,
    fields: [
      { key: "category", label: "Category", type: "dynamic-select", dependsOn: "mme-categories", required: true, isKey: true },
      { key: "name", label: "Subcategory Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "mme-manufacturers",
    label: "MME Manufacturers",
    apiType: "mme-manufacturers",
    icon: Wrench,
    fields: [
      { key: "name", label: "Manufacturer Name", type: "text", required: true, isKey: true },
    ]
  },
];

export default function AssetManagementMasters() {
  const [activeTab, setActiveTab] = useState(masterTabs[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [globalData, setGlobalData] = useState({}); // Used for relationship dropdowns
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assetmanagement/masters/${activeTab.apiType}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  const loadGlobalDependencies = async () => {
    try {
      const [citiesRes, faCatRes, mmeCatRes] = await Promise.all([
        fetch(`/api/assetmanagement/masters/locationcities`),
        fetch(`/api/assetmanagement/masters/fixed-asset-categories`),
        fetch(`/api/assetmanagement/masters/mme-categories`)
      ]);
      const cities = await citiesRes.json();
      const faCats = await faCatRes.json();
      const mmeCats = await mmeCatRes.json();
      setGlobalData({
        locationcities: cities,
        'fixed-asset-categories': faCats,
        'mme-categories': mmeCats
      });
    } catch (e) {
      console.error("Failed to load global dependencies", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    loadGlobalDependencies();
  }, []);

  const handleBulkImport = async (importedData) => {
    try {
      const res = await fetch(`/api/assetmanagement/masters/${activeTab.apiType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, data: importedData })
      });
      const json = await res.json();
      if (res.ok) {
        fetchData();
        loadGlobalDependencies();
        return { success: true, ...json };
      }
      return { success: false, error: json.error };
    } catch (err) {
      console.error("Bulk import failed:", err);
      return { success: false, error: err.message };
    }
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      if (data.length === 0) {
        alert("No data available to export");
        return;
      }

      const formattedData = data.map(({ _id, createdAt, updatedAt, nameKey, ...rest }) => rest);

      const XLSX = await import("xlsx");
      const Papa = await import("papaparse");

      if (format === 'csv') {
        const csv = Papa.unparse(formattedData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", downloadUrl);
        link.setAttribute("download", `${activeTab.id}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } else {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab.label);
        XLSX.writeFile(wb, `${activeTab.id}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error("Failed to export data:", err);
      alert("Failed to export data");
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    try {
      await fetch(`/api/assetmanagement/masters/${activeTab.apiType}?id=${id}`, {
        method: "DELETE",
      });
      fetchData();
      loadGlobalDependencies(); // refresh globals just in case
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const handleSave = async (formData) => {
    const method = editingRecord ? "PUT" : "POST";
    const payload = editingRecord ? { ...formData, _id: editingRecord._id } : formData;

    try {
      const res = await fetch(`/api/assetmanagement/masters/${activeTab.apiType}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        loadGlobalDependencies(); // refresh globals just in case
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save'}`);
      }
    } catch (err) {
      console.error("Error saving record:", err);
    }
  };

  return (
    <>
      <Head>
        <title>Asset Management - Masters</title>
      </Head>
      <div className="flex flex-col bg-slate-900 min-h-screen text-slate-200">
        {/* Horizontal Tabs */}
        <div className="w-full bg-slate-900 border-b border-slate-800 overflow-x-auto custom-scrollbar flex justify-center px-4 sm:px-12">
          <nav className="flex items-center gap-2 py-3 min-w-max">
            {masterTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-medium ${
                    activeTab.id === tab.id
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:px-12 lg:px-24 xl:px-32 overflow-x-hidden w-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <activeTab.icon className="text-cyan-400" size={24} />
                {activeTab.label}
              </h1>
              <p className="text-sm text-slate-400 mt-1">Manage all reference data for {activeTab.label.toLowerCase()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Export Button Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-semibold rounded-md border border-slate-700 hover:border-slate-650 transition-colors shadow-md"
                >
                  <Download size={14} /> Export
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-slate-800 border border-slate-700 rounded-md shadow-xl hidden group-hover:block hover:block z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-700 border-t border-slate-700/50 transition-colors"
                  >
                    CSV (.csv)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-semibold rounded-md border border-slate-700 hover:border-slate-650 transition-colors shadow-md"
              >
                <Upload size={14} /> Bulk Import
              </button>

              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-sm font-semibold rounded-md shadow-lg shadow-cyan-500/10 transition-colors"
              >
                + Add Record
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700">
            <MasterTable 
              data={data} 
              fields={activeTab.fields} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <MasterFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          fields={activeTab.fields}
          initialData={editingRecord}
          globalData={globalData}
          title={`${editingRecord ? 'Edit' : 'Add'} ${activeTab.label}`}
        />
      )}

      {isImportModalOpen && (
        <BulkImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleBulkImport}
          fields={activeTab.fields}
          tabLabel={activeTab.label}
          globalData={globalData}
        />
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
      `}</style>
    </>
  );
}
