import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { 
  Boxes, 
  Layers, 
  Tag, 
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

export default function MaterialsManager({ initialTab = "materials" }) {
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
  const [editingRecord, setEditingRecord] = useState(null); 
  const [formData, setFormData] = useState({});

  // Hierarchy Explorer states
  const [allMatTypes, setAllMatTypes] = useState([]);
  const [selectedMatType, setSelectedMatType] = useState("");
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Tab definitions
  const tabs = [
    { id: "materials", label: "Materials List", icon: Boxes, type: "materials" },
    { id: "materialgroups", label: "Material Groups", icon: Layers, type: "materialgroups" },
    { id: "mattypes", label: "Material Types", icon: Tag, type: "mattypes" },
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

  // Load all material types for Explorer
  const fetchAllMatTypes = async () => {
    try {
      const res = await fetch("/api/data-load/mattypes?limit=200");
      const json = await res.json();
      setAllMatTypes(json.data || []);
      if (json.data && json.data.length > 0) {
        setSelectedMatType(json.data[0]["name"]);
      }
    } catch (err) {
      console.error("Error fetching material types:", err);
    }
  };

  // Load hierarchy mapping data
  const fetchHierarchy = useCallback(async () => {
    if (!selectedMatType) return;
    setLoadingHierarchy(true);
    try {
      const res = await fetch(`/api/materials/hierarchy?materialType=${encodeURIComponent(selectedMatType)}`);
      const json = await res.json();
      setHierarchyData(json);
    } catch (err) {
      console.error("Error fetching material hierarchy:", err);
    } finally {
      setLoadingHierarchy(false);
    }
  }, [selectedMatType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "explorer") {
      fetchAllMatTypes();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "explorer" && selectedMatType) {
      fetchHierarchy();
    }
  }, [activeTab, selectedMatType, fetchHierarchy]);

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
    if (activeTab === "materials") {
      newForm["material-code"] = "";
      newForm["material-industry"] = "M";
      newForm["material-group"] = "";
      newForm["unit-measure"] = "EA";
      newForm["old-material-number"] = "";
      newForm["material-description"] = "";
      newForm["mat-description2"] = "";
      newForm["created-by"] = "";
      newForm["updated-by"] = "";
    } else if (activeTab === "materialgroups") {
      newForm["name"] = "";
      newForm["description"] = "";
      newForm["groupId"] = "";
    } else if (activeTab === "mattypes") {
      newForm["name"] = "";
      newForm["description"] = "";
      newForm["isService"] = false;
    }
    setFormData(newForm);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const cleanRecord = { ...record };
    // If groupId is an object, convert it to string for display in form
    if (cleanRecord.groupId && typeof cleanRecord.groupId === 'object') {
      cleanRecord.groupId = cleanRecord.groupId.$oid || cleanRecord.groupId.toString();
    }
    setFormData(cleanRecord);
    setIsModalOpen(true);
  };

  // CSV Export/Template Download
  const handleDownloadTemplate = () => {
    let headers = [];
    let sample = "";
    if (activeTab === "materials") {
      headers = [
        "material-code", "material-industry", "material-group", "unit-measure", 
        "old-material-number", "material-description", "mat-description2", "created-by", "updated-by"
      ];
      sample = '\n11000208,M,IM01,EA,ANANZ0069,"BACK PANEL PC BOARD,TELEDYNE,D65295A","BACK PANEL PC BOARD,TELEDYNE,D65295A",A.RAGAB,20000020';
    } else if (activeTab === "materialgroups") {
      headers = ["name", "description", "groupId"];
      sample = "\nPROJECT SIGNBOARDS,PROJECT SIGNBOARDS AND OTHER SUBSTATION MARKINGS,6784d4fe3d38bfe045b0e861";
    } else if (activeTab === "mattypes") {
      headers = ["name", "description", "isService"];
      sample = "\nCivil Materials,Civil building earthwork materials,false";
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 bg-[var(--app-bg)] text-[var(--app-text)]">
      {/* Navigation tabs */}
      <div className="flex border-b border-[var(--app-border)] gap-2 overflow-x-auto pb-px">
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
                  ? "border-[var(--app-accent)] text-[var(--app-accent)]" 
                  : "border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--app-surface)] border border-[var(--app-border)] p-4 rounded-2xl backdrop-blur">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--app-text-muted)]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] placeholder:text-[var(--app-text-disabled)] focus:outline-none focus:border-[var(--app-accent)] text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Card / Table Toggle */}
              <div className="flex bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "table" ? "bg-[var(--app-surface-muted)] text-[var(--app-accent)]" : "text-[var(--app-text-muted)]"}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "card" ? "bg-[var(--app-surface-muted)] text-[var(--app-accent)]" : "text-[var(--app-text-muted)]"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* CSV Upload/Download */}
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border)] text-[var(--app-text)] text-sm font-semibold rounded-xl transition"
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
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border)] text-[var(--app-text)] text-sm font-semibold rounded-xl transition"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </button>
              </div>

              {/* Add New */}
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-accent-text)] text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
          </div>

          {/* List display based on viewMode */}
          {loading ? (
            <div className="text-center py-12 text-[var(--app-text-muted)] font-medium">Loading data...</div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl">
              <table className="min-w-full divide-y divide-[var(--app-border)]">
                <thead className="bg-[var(--app-surface-muted)]">
                  {activeTab === "materials" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Material Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Group</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Industry</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">UOM</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Old Mat No</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  {activeTab === "materialgroups" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Group Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Parent Type ID</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  {activeTab === "mattypes" && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Type Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Type (Service/Mat)</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[var(--app-border)] bg-transparent text-[var(--app-text)]">
                  {dataList.map((row) => (
                    <tr key={row._id} className="hover:bg-[var(--app-surface-muted)] transition-colors">
                      {activeTab === "materials" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--app-accent)]">{row["material-code"]}</td>
                          <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">{row["material-description"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-secondary)]">{row["material-group"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-muted)]">{row["material-industry"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-muted)]">{row["unit-measure"] || "EA"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-muted)]">{row["old-material-number"] || "N/A"}</td>
                        </>
                      )}
                      {activeTab === "materialgroups" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-700 dark:text-purple-400">{row["name"]}</td>
                          <td className="px-6 py-4 text-sm font-medium text-[var(--app-text-secondary)] max-w-xs truncate">{row["description"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-muted)] font-mono">
                            {row["groupId"] ? (row["groupId"].$oid || row["groupId"].toString()) : "N/A"}
                          </td>
                        </>
                      )}
                      {activeTab === "mattypes" && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700 dark:text-emerald-400">{row["name"]}</td>
                          <td className="px-6 py-4 text-sm font-medium text-[var(--app-text-secondary)] max-w-xs truncate">{row["description"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-muted)]">
                            {row["isService"] ? (
                              <span className="text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded text-xs border border-pink-200 dark:border-pink-900/30">Service</span>
                            ) : (
                              <span className="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded text-xs border border-teal-200 dark:border-teal-900/30">Material</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(row)}
                          className="text-[var(--app-text-muted)] hover:text-amber-400 transition p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-[var(--app-text-muted)] hover:text-rose-500 transition p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dataList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-[var(--app-text-muted)] text-sm">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card view */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dataList.map((row) => (
                <div key={row._id} className="app-card rounded-[1.5rem] p-6 shadow-md border border-[var(--app-border)] hover:border-[var(--app-border)] flex flex-col justify-between space-y-4">
                  <div>
                    {activeTab === "materials" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-[var(--app-accent)] bg-[var(--app-accent-soft)] border border-[var(--app-accent)] px-2.5 py-0.5 rounded-full">
                          Code: {row["material-code"]}
                        </span>
                        <h4 className="text-base font-bold text-[var(--app-text)] mt-3 line-clamp-2">{row["material-description"]}</h4>
                        <p className="text-xs text-[var(--app-text-muted)] mt-2">Group: <span className="font-semibold text-[var(--app-text-secondary)]">{row["material-group"]}</span></p>
                      </>
                    )}
                    {activeTab === "materialgroups" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/30 px-2.5 py-0.5 rounded-full">
                          Group: {row["name"]}
                        </span>
                        <h4 className="text-base font-bold text-[var(--app-text)] mt-3 line-clamp-2">{row["description"]}</h4>
                        <p className="text-[10px] text-[var(--app-text-muted)] mt-2 truncate">Parent ID: <span className="font-mono text-[var(--app-text-muted)]">{row["groupId"] ? (row["groupId"].$oid || row["groupId"].toString()) : "N/A"}</span></p>
                      </>
                    )}
                    {activeTab === "mattypes" && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/30 px-2.5 py-0.5 rounded-full">
                          Type: {row["name"]}
                        </span>
                        <h4 className="text-base font-bold text-[var(--app-text)] mt-3">{row["description"]}</h4>
                        <p className="text-xs text-[var(--app-text-muted)] mt-2">Class: <span className="font-semibold text-[var(--app-text-secondary)]">{row["isService"] ? "Service" : "Material"}</span></p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end border-t border-[var(--app-border)] pt-4 gap-2">
                    <button
                      onClick={() => openEditModal(row)}
                      className="p-1.5 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border)] text-[var(--app-text-secondary)] hover:text-amber-400 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-1.5 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border)] text-[var(--app-text-secondary)] hover:text-rose-500 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {dataList.length === 0 && (
                <div className="col-span-full text-center py-12 text-[var(--app-text-muted)]">No records found.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Hierarchy explorer nodes mapping view */
        <div className="space-y-6">
          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--app-text)]">Material Type, Group & Master Map</h3>
              <p className="text-xs text-[var(--app-text-muted)] mt-1">Select a Material Type to view associated Material Groups and mapped raw Materials.</p>
            </div>
            <div>
              <select
                value={selectedMatType}
                onChange={(e) => setSelectedMatType(e.target.value)}
                className="w-full md:w-80 px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
              >
                {allMatTypes.map((m) => (
                  <option key={m._id} value={m["name"]}>
                    {m["name"]} - {m["description"]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingHierarchy ? (
            <div className="text-center py-16 text-[var(--app-text-muted)] font-medium">Tracing material links...</div>
          ) : hierarchyData ? (
            <div className="bg-[var(--app-surface-muted)] border border-[var(--app-border)] p-8 rounded-[2rem] flex flex-col items-center">
              
              {/* Visual Node Hierarchy */}
              <div className="w-full max-w-4xl flex flex-col items-center gap-10">
                {/* 1. Material Type Node */}
                <div className="relative flex flex-col items-center">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-xl text-center border border-emerald-400/20 max-w-md">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200">Material Type</span>
                    <h2 className="text-lg font-black text-white mt-1">{hierarchyData.matType["name"]}</h2>
                    <p className="text-xs text-emerald-100 mt-2 font-medium">{hierarchyData.matType["description"]}</p>
                    <div className="mt-3 text-[10px] text-teal-250 border-t border-teal-500/30 pt-2">
                      <span>Category: {hierarchyData.matType["isService"] ? "Service" : "Material"}</span>
                    </div>
                  </div>
                  {/* Stem Down */}
                  <div className="w-0.5 h-10 bg-[var(--app-surface-muted)]"></div>
                </div>

                {/* Grid of Groups and Materials */}
                <div className="grid md:grid-cols-2 gap-8 w-full relative">
                  
                  {/* Left Column: Material Groups */}
                  <div className="flex flex-col items-center bg-[var(--app-surface-muted)] border border-[var(--app-border)] p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                      <h3 className="text-base font-bold text-[var(--app-text)]">Material Groups (Subgroups)</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full">
                      {hierarchyData.groups.map((group) => (
                        <div key={group._id} className="bg-[var(--app-surface)] border border-[var(--app-border)] p-4 rounded-xl shadow-sm flex flex-col gap-1">
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{group["name"]}</span>
                          <p className="text-xs text-[var(--app-text-secondary)] mt-1 line-clamp-2">{group["description"]}</p>
                        </div>
                      ))}
                      {hierarchyData.groups.length === 0 && (
                        <p className="text-xs text-[var(--app-text-muted)] text-center py-6">No groups matched the mapping keys.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Materials */}
                  <div className="flex flex-col items-center bg-[var(--app-surface-muted)] border border-[var(--app-border)] p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Boxes className="w-5 h-5 text-[var(--app-accent)]" />
                      <h3 className="text-base font-bold text-[var(--app-text)]">Raw Materials</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full max-h-96 overflow-y-auto pr-1">
                      {hierarchyData.materials.map((mat) => (
                        <div key={mat._id} className="bg-[var(--app-surface)] border border-[var(--app-border)] p-4 rounded-xl shadow-sm flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-[var(--app-accent)]">{mat["material-code"]}</span>
                            <span className="text-sm text-[var(--app-text-secondary)] font-medium line-clamp-1">{mat["material-description"]}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--app-text-disabled)]" />
                        </div>
                      ))}
                      {hierarchyData.materials.length === 0 && (
                        <p className="text-xs text-[var(--app-text-muted)] text-center py-6">No materials found in the mapped group.</p>
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
            backgroundColor: 'var(--app-overlay)',
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
              backgroundColor: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
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
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--app-border)' }}>
              <h3 className="text-lg font-bold text-[var(--app-text)]">{editingRecord ? "Edit Record" : "Add New Record"}</h3>
              <p className="text-xs text-[var(--app-text-muted)] mt-1">Fill in the fields to save to database.</p>
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
                {activeTab === "materials" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Material Code (Required)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRecord}
                        value={formData["material-code"] || ""}
                        onChange={(e) => setFormData({ ...formData, "material-code": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Industry Code</label>
                      <input
                        type="text"
                        value={formData["material-industry"] || ""}
                        onChange={(e) => setFormData({ ...formData, "material-industry": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Material Group Code (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["material-group"] || ""}
                        onChange={(e) => setFormData({ ...formData, "material-group": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Unit of Measure (UOM)</label>
                      <input
                        type="text"
                        value={formData["unit-measure"] || ""}
                        onChange={(e) => setFormData({ ...formData, "unit-measure": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Old Material Number</label>
                      <input
                        type="text"
                        value={formData["old-material-number"] || ""}
                        onChange={(e) => setFormData({ ...formData, "old-material-number": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Material Description (Required)</label>
                      <textarea
                        required
                        value={formData["material-description"] || ""}
                        onChange={(e) => setFormData({ ...formData, "material-description": e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Material Description 2</label>
                      <textarea
                        value={formData["mat-description2"] || ""}
                        onChange={(e) => setFormData({ ...formData, "mat-description2": e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Created By</label>
                      <input
                        type="text"
                        value={formData["created-by"] || ""}
                        onChange={(e) => setFormData({ ...formData, "created-by": e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Updated By</label>
                      <input
                        type="text"
                        value={formData["updated-by"] || ""}
                        onChange={(e) => setFormData({ ...formData, "updated-by": e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                  </>
                )}

                {activeTab === "materialgroups" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Group Name/Code (Required)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRecord}
                        value={formData["name"] || ""}
                        onChange={(e) => setFormData({ ...formData, "name": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Description (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["description"] || ""}
                        onChange={(e) => setFormData({ ...formData, "description": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Parent Type ID (groupId ObjectId string)</label>
                      <input
                        type="text"
                        value={formData["groupId"] || ""}
                        onChange={(e) => setFormData({ ...formData, "groupId": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold font-mono"
                      />
                    </div>
                  </>
                )}

                {activeTab === "mattypes" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Type Name (Required)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingRecord}
                        value={formData["name"] || ""}
                        onChange={(e) => setFormData({ ...formData, "name": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-[var(--app-text-muted)] mb-1.5">Description (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["description"] || ""}
                        onChange={(e) => setFormData({ ...formData, "description": e.target.value })}
                        className="w-full px-4 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-xl text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-sm font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isService"
                        checked={!!formData["isService"]}
                        onChange={(e) => setFormData({ ...formData, "isService": e.target.checked })}
                        className="w-4 h-4 accent-cyan-500 rounded bg-[var(--app-bg)] border-[var(--app-border)]"
                      />
                      <label htmlFor="isService" className="text-xs font-semibold uppercase text-[var(--app-text-muted)]">Is Service Type</label>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div 
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--app-border)',
                  backgroundColor: 'var(--app-surface-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border)] text-[var(--app-text-secondary)] text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-accent-text)] text-sm font-bold rounded-lg transition"
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
