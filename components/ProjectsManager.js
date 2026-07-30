import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { 
  Briefcase, 
  Network, 
  FileText, 
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

export default function ProjectsManager({ initialTab = "projects" }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [searchTerm, setSearchTerm] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Edit/Add modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // null for add new
  const [formData, setFormData] = useState({});

  // Hierarchy Explorer states
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectWbs, setSelectedProjectWbs] = useState("");
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Tab definitions
  const tabs = [
    { id: "projects", label: "Projects List", icon: Briefcase, type: "projects" },
    { id: "networks", label: "Networks List", icon: Network, type: "networks" },
    { id: "wbs", label: "WBS Elements", icon: FileText, type: "wbs" },
    { id: "explorer", label: "Hierarchy Explorer", icon: GitBranch, type: "explorer" }
  ];

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

  // Load all projects for Explorer selection
  const fetchAllProjects = async () => {
    try {
      const res = await fetch("/api/data-load/projects?limit=500");
      const json = await res.json();
      setAllProjects(json.data || []);
      if (json.data && json.data.length > 0) {
        setSelectedProjectWbs(json.data[0]["project-wbs"]);
      }
    } catch (err) {
      console.error("Error fetching projects for explorer:", err);
    }
  };

  // Load hierarchy data when project selection changes
  const fetchHierarchy = useCallback(async () => {
    if (!selectedProjectWbs) return;
    setLoadingHierarchy(true);
    try {
      const res = await fetch(`/api/projects/hierarchy?projectWbs=${encodeURIComponent(selectedProjectWbs)}`);
      const json = await res.json();
      setHierarchyData(json);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
    } finally {
      setLoadingHierarchy(false);
    }
  }, [selectedProjectWbs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "explorer") {
      fetchAllProjects();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "explorer" && selectedProjectWbs) {
      fetchHierarchy();
    }
  }, [activeTab, selectedProjectWbs, fetchHierarchy]);

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
    if (activeTab === "projects") {
      newForm["project-wbs"] = "";
      newForm["project-name"] = "";
      newForm["project-incharge"] = "";
    } else if (activeTab === "networks") {
      newForm["network-num"] = "";
      newForm["project-wbs"] = "";
      newForm["project-name"] = "";
    } else if (activeTab === "wbs") {
      newForm["wbs-number"] = "";
      newForm["wbs-description"] = "";
    }
    setFormData(newForm);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setIsModalOpen(true);
  };

  // CSV Export/Template Download
  const handleDownloadTemplate = () => {
    let headers = [];
    let sample = "";
    if (activeTab === "projects") {
      headers = ["project-wbs", "project-name", "project-incharge", "created-date", "changed-date", "start-date", "finished-date"];
      sample = "\nIS/GP.20.009,5800000546 RENOVATION OF CONFERANCE ROOM,Ahmed Ghaith,2020-03-07,2021-12-13,2020-02-20,2020-06-27";
    } else if (activeTab === "networks") {
      headers = ["network-num", "project-wbs", "project-name", "created-date", "created-by"];
      sample = "\n4004616,IS/GP.20.005,PO 4801764366 /4801764368 / 4801765063,2020-02-29,242";
    } else if (activeTab === "wbs") {
      headers = ["wbs-number", "wbs-description", "updated-at"];
      sample = "\nIS/GP.21.038.01,MATERIALS,2026-06-25";
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + sample;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  {activeTab === "projects" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Project WBS</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Project Incharge</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  {activeTab === "networks" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Network Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Project WBS</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  {activeTab === "wbs" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">WBS Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">WBS Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-transparent text-slate-200">
                  {dataList.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-800/20 transition-colors">
                      {activeTab === "projects" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-400">{row["project-wbs"]}</td>
                          <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">{row["project-name"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row["project-incharge"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["start-date"] ? new Date(row["start-date"]).toLocaleDateString() : "N/A"}</td>
                        </>
                      )}
                      {activeTab === "networks" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-400">{row["network-num"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{row["project-wbs"]}</td>
                          <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">{row["project-name"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["created-by"] || "N/A"}</td>
                        </>
                      )}
                      {activeTab === "wbs" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-400">{row["wbs-number"]}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-300">{row["wbs-description"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{row["updated-at"] ? new Date(row["updated-at"]).toLocaleDateString() : "N/A"}</td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {activeTab === "projects" && (
                          <button
                            onClick={() => router.push(`/projects1?project=${encodeURIComponent(row["project-wbs"])}`)}
                            className="text-slate-400 hover:text-cyan-400 transition p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </button>
                        )}
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
                      <td colSpan="5" className="text-center py-8 text-slate-500 text-sm">No records found.</td>
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
                    {activeTab === "projects" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-0.5 rounded-full">
                          {row["project-wbs"]}
                        </span>
                        <h4 className="text-lg font-bold text-slate-100 mt-3 line-clamp-2">{row["project-name"]}</h4>
                        <p className="text-sm text-slate-400 mt-2">PM: <span className="font-semibold text-slate-200">{row["project-incharge"]}</span></p>
                      </>
                    )}
                    {activeTab === "networks" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-400 bg-purple-950/40 border border-purple-800/30 px-2.5 py-0.5 rounded-full">
                          Network: {row["network-num"]}
                        </span>
                        <h4 className="text-base font-bold text-slate-100 mt-3 line-clamp-2">{row["project-name"]}</h4>
                        <p className="text-xs text-slate-500 mt-2">Proj WBS: <span className="font-semibold text-slate-300">{row["project-wbs"]}</span></p>
                      </>
                    )}
                    {activeTab === "wbs" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-0.5 rounded-full">
                          {row["wbs-number"]}
                        </span>
                        <h4 className="text-base font-bold text-slate-100 mt-3">{row["wbs-description"]}</h4>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
                    <span className="text-[11px] text-slate-500">
                      {activeTab === "projects" && row["start-date"] ? `Started: ${new Date(row["start-date"]).toLocaleDateString()}` : ""}
                      {activeTab === "wbs" && row["updated-at"] ? `Updated: ${new Date(row["updated-at"]).toLocaleDateString()}` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {activeTab === "projects" && (
                        <button
                          onClick={() => router.push(`/projects1?project=${encodeURIComponent(row["project-wbs"])}`)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
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
              <h3 className="text-lg font-bold text-slate-100">Project Network & WBS Element Map</h3>
              <p className="text-xs text-slate-400 mt-1">Select a project to inspect its mapped networks and nested WBS element nodes.</p>
            </div>
            <div>
              <select
                value={selectedProjectWbs}
                onChange={(e) => setSelectedProjectWbs(e.target.value)}
                className="w-full md:w-80 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
              >
                {allProjects.map((p) => (
                  <option key={p._id} value={p["project-wbs"]}>
                    {p["project-wbs"]} - {p["project-name"]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingHierarchy ? (
            <div className="text-center py-16 text-slate-400 font-medium">Tracing nodes & connections...</div>
          ) : hierarchyData ? (
            <div className="bg-slate-950/40 border border-slate-900/60 p-8 rounded-[2rem] flex flex-col items-center">
              
              {/* Visual Node Hierarchy Representation */}
              <div className="w-full max-w-4xl flex flex-col items-center gap-10">
                {/* 1. Root Project Node */}
                <div className="relative group flex flex-col items-center">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-2xl shadow-xl text-center border border-cyan-400/20 max-w-md">
                    <span className="text-[10px] uppercase font-black tracking-widest text-cyan-200">Root Project Node</span>
                    <h2 className="text-lg font-black text-white mt-1">{hierarchyData.project["project-wbs"]}</h2>
                    <p className="text-xs text-cyan-100 mt-2 font-medium">{hierarchyData.project["project-name"]}</p>
                    <div className="mt-3 text-[10px] text-blue-200 border-t border-blue-500/30 pt-2 flex justify-around">
                      <span>Incharge: {hierarchyData.project["project-incharge"]}</span>
                    </div>
                  </div>
                  {/* Stem Down */}
                  <div className="w-0.5 h-10 bg-slate-800"></div>
                </div>

                {/* Grid of Networks and WBS */}
                <div className="grid md:grid-cols-2 gap-8 w-full relative">
                  
                  {/* Left Column: Network Numbers */}
                  <div className="flex flex-col items-center bg-slate-900/30 border border-slate-800/40 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Network className="w-5 h-5 text-purple-400" />
                      <h3 className="text-base font-bold text-slate-200">Associated Networks</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full">
                      {hierarchyData.networks.map((net) => (
                        <div key={net._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-purple-400">{net["network-num"]}</span>
                            <span className="text-[10px] text-slate-500">By: {net["created-by"] || "System"}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{net["project-name"]}</p>
                        </div>
                      ))}
                      {hierarchyData.networks.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-6">No networks mapped to this project.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: WBS Nodes */}
                  <div className="flex flex-col items-center bg-slate-900/30 border border-slate-800/40 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-slate-200">WBS Nodes (Sub-elements)</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full">
                      {hierarchyData.wbsElements.map((w) => (
                        <div key={w._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-emerald-400">{w["wbs-number"]}</span>
                            <span className="text-sm text-slate-300 font-semibold">{w["wbs-description"]}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </div>
                      ))}
                      {hierarchyData.wbsElements.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-6">No child WBS elements found.</p>
                      )}
                    </div>
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
              maxWidth: '28rem',
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
              <p className="text-xs text-slate-400 mt-1">Fill in the required fields to save.</p>
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
                {activeTab === "projects" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Project WBS (Required)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRecord}
                        value={formData["project-wbs"] || ""}
                        onChange={(e) => setFormData({ ...formData, "project-wbs": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Project Name (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["project-name"] || ""}
                        onChange={(e) => setFormData({ ...formData, "project-name": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Project Incharge (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["project-incharge"] || ""}
                        onChange={(e) => setFormData({ ...formData, "project-incharge": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                  </>
                )}

                {activeTab === "networks" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Network Number (Required)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRecord}
                        value={formData["network-num"] || ""}
                        onChange={(e) => setFormData({ ...formData, "network-num": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Project WBS Link (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["project-wbs"] || ""}
                        onChange={(e) => setFormData({ ...formData, "project-wbs": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Project Name (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["project-name"] || ""}
                        onChange={(e) => setFormData({ ...formData, "project-name": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Created By</label>
                      <input
                        type="text"
                        value={formData["created-by"] || ""}
                        onChange={(e) => setFormData({ ...formData, "created-by": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                  </>
                )}

                {activeTab === "wbs" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">WBS Number (Required)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRecord}
                        value={formData["wbs-number"] || ""}
                        onChange={(e) => setFormData({ ...formData, "wbs-number": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">WBS Description (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["wbs-description"] || ""}
                        onChange={(e) => setFormData({ ...formData, "wbs-description": e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                      />
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
