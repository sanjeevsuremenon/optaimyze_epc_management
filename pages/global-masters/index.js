import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { 
  Users, 
  BadgeCheck, 
  Building2, 
  MapPin, 
  Map, 
  Award,
  Coins,
  Settings,
  Upload,
  Download
} from "lucide-react";
import MasterTable from "../../components/AssetManagement/MasterTable";
import MasterFormModal from "../../components/AssetManagement/MasterFormModal";
import BulkImportModal from "../../components/AssetManagement/BulkImportModal";
import useDebounce from "../../lib/useDebounce";

const masterTabs = [
  {
    id: "employees",
    label: "Employees",
    apiType: "employees",
    icon: Users,
    fields: [
      { key: "empno", label: "Employee Code / ID", type: "text", required: true, isKey: true },
      { key: "empname", label: "Full Name", type: "text", required: true },
      { key: "designation", label: "Designation", type: "dynamic-select", required: true },
      { key: "department", label: "Department", type: "dynamic-select", required: true },
      { key: "email", label: "Email Address", type: "text", required: false },
      { key: "grade", label: "Grade", type: "dynamic-select", required: false },
      { key: "salaryLevel", label: "Salary Level", type: "dynamic-select", required: false },
      { key: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }], required: true },
    ]
  },
  {
    id: "designations",
    label: "Designations",
    apiType: "designations",
    icon: BadgeCheck,
    fields: [
      { key: "name", label: "Designation Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "departments",
    label: "Departments",
    apiType: "departments",
    icon: Building2,
    fields: [
      { key: "name", label: "Department Name", type: "text", required: true, isKey: true },
    ]
  },
  {
    id: "locations",
    label: "Locations",
    apiType: "locations",
    icon: MapPin,
    fields: [
      { key: "locationName", label: "Location Name", type: "text", required: true, isKey: true },
      { key: "premisesKind", label: "Premises Kind", type: "select", options: [{ value: "warehouse", label: "Warehouse" }, { value: "department", label: "Department / Camp" }], required: true },
      { key: "townCity", label: "Town/City", type: "dynamic-select", dependsOn: "premisesKind", required: true },
      { key: "buildingTower", label: "Building/Tower", type: "text", required: true },
      { key: "landmark", label: "Landmark", type: "text" },
      { key: "latitude", label: "Latitude", type: "text" },
      { key: "longitude", label: "Longitude", type: "text" },
      { key: "remarks", label: "Remarks", type: "textarea" },
    ]
  },
  {
    id: "locationcities",
    label: "Location Cities",
    apiType: "locationcities",
    icon: Map,
    fields: [
      { key: "name", label: "City Name", type: "text", required: true, isKey: true },
      { key: "kind", label: "Kind", type: "select", options: [{ value: "warehouse", label: "Warehouse" }, { value: "department", label: "Department / Camp" }], required: true, isKey: true },
    ]
  },
  {
    id: "employee-grades",
    label: "Employee Grades",
    apiType: "employee-grades",
    icon: Award,
    fields: [
      { key: "grade", label: "Grade Code", type: "text", required: true, isKey: true },
      { key: "description", label: "Description", type: "text" },
    ]
  },
  {
    id: "employee-salary-levels",
    label: "Salary Levels",
    apiType: "employee-salary-levels",
    icon: Coins,
    fields: [
      { key: "level", label: "Salary Level", type: "text", required: true, isKey: true },
      { key: "minSalary", label: "Min Salary (SAR)", type: "text" },
      { key: "maxSalary", label: "Max Salary (SAR)", type: "text" },
    ]
  },
  {
    id: "equipment-types",
    label: "Equipment Types",
    apiType: "equipment-types",
    icon: Settings,
    fields: [
      { key: "name", label: "Equipment Type Name", type: "text", required: true, isKey: true },
      { key: "description", label: "Description", type: "textarea" },
    ]
  },
];

export default function GlobalMasters() {
  const [activeTab, setActiveTab] = useState(masterTabs[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [globalData, setGlobalData] = useState({}); // Dynamic select source

  // Pagination & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadMoreRef = useRef(null);

  const fetchData = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (activeTab.id === "employees") {
        const skipOffset = isLoadMore ? data.length : 0;
        const url = `/api/global-masters/employees?limit=50&skip=${skipOffset}&search=${encodeURIComponent(debouncedSearchTerm)}`;
        const res = await fetch(url);
        const json = await res.json();
        
        if (isLoadMore) {
          setData((prev) => [...prev, ...(json.data || [])]);
        } else {
          setData(json.data || []);
        }
        setHasMore(Boolean(json.hasMore));
        setTotalCount(json.total || 0);
      } else {
        const res = await fetch(`/api/global-masters/${activeTab.apiType}`);
        const json = await res.json();
        setData(json || []);
        setHasMore(false);
        setTotalCount(json.length || 0);
      }
    } catch (err) {
      console.error("Error fetching Global Masters data:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadGlobalDependencies = async () => {
    try {
      const [citiesRes, designationsRes, departmentsRes, gradesRes, salaryLevelsRes] = await Promise.all([
        fetch(`/api/global-masters/locationcities`),
        fetch(`/api/global-masters/designations`),
        fetch(`/api/global-masters/departments`),
        fetch(`/api/global-masters/employee-grades`),
        fetch(`/api/global-masters/employee-salary-levels`),
      ]);
      const cities = await citiesRes.json();
      const designations = await designationsRes.json();
      const departments = await departmentsRes.json();
      const grades = await gradesRes.json();
      const salaryLevels = await salaryLevelsRes.json();

      setGlobalData({
        locationcities: cities,
        designations,
        departments,
        'employee-grades': grades,
        'employee-salary-levels': salaryLevels,
      });
    } catch (e) {
      console.error("Failed to load global masters dependencies", e);
    }
  };

  // Handle Tab Switch
  useEffect(() => {
    setSearchTerm("");
    if (activeTab.id !== "employees") {
      fetchData(false);
    } else {
      setData([]);
      setHasMore(false);
      setTotalCount(0);
    }
  }, [activeTab]);

  // Handle Search Queries
  useEffect(() => {
    if (activeTab.id === "employees") {
      fetchData(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadGlobalDependencies();
  }, []);

  // Infinite Scroll Trigger
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchData(true);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, data.length]);

  const handleBulkImport = async (importedData) => {
    try {
      const res = await fetch(`/api/global-masters/${activeTab.apiType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, data: importedData })
      });
      if (res.ok) {
        fetchData(false);
        loadGlobalDependencies();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Bulk import failed:", err);
      return false;
    }
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      let exportData = [];
      if (activeTab.id === "employees") {
        const url = `/api/global-masters/employees?export=true&search=${encodeURIComponent(searchTerm)}`;
        const res = await fetch(url);
        const json = await res.json();
        exportData = json.data || [];
      } else {
        exportData = data || [];
      }

      if (exportData.length === 0) {
        alert("No data available to export");
        return;
      }

      const formattedData = exportData.map(({ _id, createdAt, updatedAt, nameKey, ...rest }) => rest);

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
      await fetch(`/api/global-masters/${activeTab.apiType}?id=${id}`, {
        method: "DELETE",
      });
      fetchData(false);
      loadGlobalDependencies(); // refresh globals
    } catch (err) {
      console.error("Error deleting global master record:", err);
    }
  };

  const handleSave = async (formData) => {
    const method = editingRecord ? "PUT" : "POST";
    const payload = editingRecord ? { ...formData, _id: editingRecord._id } : formData;

    try {
      const res = await fetch(`/api/global-masters/${activeTab.apiType}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData(false);
        loadGlobalDependencies(); // refresh globals
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
        <title>Global Masters | EPC Portal</title>
      </Head>
      <div className="flex flex-col bg-slate-900 min-h-screen text-slate-200">
        {/* Horizontal Navigation Tabs */}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <activeTab.icon className="text-cyan-400" size={24} />
                {activeTab.label}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab.id === "employees" && totalCount > 0 
                  ? `Manage global reference database for employees (showing ${data.length} of ${totalCount} records)`
                  : `Manage global reference database for ${activeTab.label.toLowerCase()}`
                }
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {activeTab.id === "employees" && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-4 py-2 border border-slate-700 rounded-md bg-slate-950 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")} 
                      className="absolute right-3 top-2 flex items-center justify-center w-5 h-5 rounded-full text-slate-455 hover:text-slate-200 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

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
              loading={loading && data.length === 0}
            />
            {activeTab.id === "employees" && (
              <div ref={loadMoreRef} className="py-6 text-center border-t border-slate-700/50">
                {loadingMore ? (
                  <span className="text-sm text-cyan-400 font-semibold animate-pulse">Loading more employees...</span>
                ) : hasMore ? (
                  <span className="text-xs text-slate-500">Scroll down to load more</span>
                ) : data.length > 0 ? (
                  <span className="text-xs text-slate-500 font-medium">All {totalCount} employees loaded.</span>
                ) : null}
              </div>
            )}
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
