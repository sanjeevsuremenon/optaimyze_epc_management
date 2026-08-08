import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Eye,
  Inbox,
} from "lucide-react";

const parseCSV = (text) => {
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const row = [];
    let inQuotes = false;
    let currentToken = "";
    for (let charIndex = 0; charIndex < lines[i].length; charIndex++) {
      const char = lines[i][charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(currentToken.trim().replace(/^["']|["']$/g, ""));
        currentToken = "";
      } else {
        currentToken += char;
      }
    }
    row.push(currentToken.trim().replace(/^["']|["']$/g, ""));

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

/** Parse activities: [{ activity-number, activity-wbs }, ...] */
function normalizeActivities(raw, projectWbs = "") {
  if (!raw) return [];

  const toItem = (activityNumber, activityWbs) => {
    const num = String(activityNumber || "").trim();
    const wbs = String(activityWbs || "").trim();
    if (!num && !wbs) return null;
    return { "activity-number": num, "activity-wbs": wbs };
  };

  let items = [];

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (entry && typeof entry === "object") {
        const item = toItem(entry["activity-number"] ?? entry.activityNumber, entry["activity-wbs"] ?? entry.activityWbs);
        if (item) items.push(item);
      } else if (typeof entry === "string") {
        // "0010:IS/GP.20.009.002" or bare activity number
        const [a, b] = entry.split(":").map((s) => s.trim());
        const item = toItem(a, b || "");
        if (item) items.push(item);
      }
    });
  } else if (typeof raw === "string") {
    raw
      .split(/[;\n|]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((part) => {
        const [a, b] = part.split(":").map((s) => s.trim());
        const item = toItem(a, b || "");
        if (item) items.push(item);
      });
  }

  // Deduplicate by activity-number + activity-wbs
  const seen = new Set();
  items = items.filter((item) => {
    const key = `${item["activity-number"]}|${item["activity-wbs"]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return items;
}

/** Activity WBS must equal root or be a child/grandchild under root (exact prefix + '.') */
function isValidActivityWbs(rootWbs, activityWbs) {
  const root = String(rootWbs || "").trim();
  const wbs = String(activityWbs || "").trim();
  if (!root || !wbs) return false;
  if (wbs === root) return false; // must be child activity WBS, not root
  return wbs.startsWith(root + ".");
}

function formatActivitiesSummary(activitiesOrLegacy) {
  const activities = Array.isArray(activitiesOrLegacy)
    ? normalizeActivities(activitiesOrLegacy)
    : normalizeActivities(activitiesOrLegacy);
  if (!activities.length) return "—";
  return activities
    .map((a) =>
      a["activity-wbs"]
        ? `${a["activity-number"] || "?"} → ${a["activity-wbs"]}`
        : a["activity-number"] || "?"
    )
    .join("; ");
}

function toDateInputValue(value) {
  if (!value) return "";
  try {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatDate(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

/** Build nested WBS tree from flat list (prefix hierarchy on wbs-number) */
function buildWbsTree(elements) {
  const sorted = [...elements].sort((a, b) =>
    String(a["wbs-number"] || "").localeCompare(String(b["wbs-number"] || ""))
  );
  const roots = [];
  const byNum = new Map();

  sorted.forEach((el) => {
    const node = { ...el, children: [] };
    byNum.set(el["wbs-number"], node);
  });

  sorted.forEach((el) => {
    const num = el["wbs-number"] || "";
    const node = byNum.get(num);
    let parent = null;
    // Find longest matching parent prefix (e.g. IS/GP.20.009.01 → IS/GP.20.009)
    const candidates = sorted
      .map((x) => x["wbs-number"])
      .filter((p) => p && p !== num && num.startsWith(p + "."));
    if (candidates.length) {
      parent = candidates.sort((a, b) => b.length - a.length)[0];
    }
    if (parent && byNum.has(parent)) {
      byNum.get(parent).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function WbsTreeNodes({ nodes, depth = 0 }) {
  if (!nodes?.length) return null;
  return (
    <ul className={depth === 0 ? "space-y-2" : "mt-2 ml-3 space-y-1.5 border-l border-app-border pl-3"}>
      {nodes.map((node) => (
        <li key={node._id || node["wbs-number"]}>
          <div className="rounded-lg border border-app-border bg-app-bg/80 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {node["wbs-number"]}
              </span>
              {(node["network-num"] || node["activity-number"]) && (
                <span className="text-[10px] font-semibold text-app-text-muted">
                  {node["network-num"] ? `Net ${node["network-num"]}` : ""}
                  {node["network-num"] && node["activity-number"] ? " · " : ""}
                  {node["activity-number"] ? `Act ${node["activity-number"]}` : ""}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-app-text mt-0.5">{node["wbs-description"] || "—"}</p>
          </div>
          <WbsTreeNodes nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-app-border bg-app-bg text-app-text text-sm font-medium placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent disabled:opacity-60";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1.5";

export default function ProjectsManager({ initialTab = "projects" }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});

  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectWbs, setSelectedProjectWbs] = useState("");
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: "projects", label: "Projects List", icon: Briefcase },
    { id: "networks", label: "Networks List", icon: Network },
    { id: "wbs", label: "WBS Elements", icon: FileText },
    { id: "explorer", label: "Hierarchy Explorer", icon: GitBranch },
  ];

  const fetchData = useCallback(async () => {
    if (activeTab === "explorer") return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/data-load/${activeTab}?search=${encodeURIComponent(searchTerm)}&limit=100`
      );
      const json = await res.json();
      setDataList(json.data || []);
      setTotalCount(json.total || 0);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  const fetchAllProjects = async () => {
    try {
      const res = await fetch("/api/data-load/projects?limit=500");
      const json = await res.json();
      setAllProjects(json.data || []);
      if (json.data?.length > 0 && !selectedProjectWbs) {
        setSelectedProjectWbs(json.data[0]["project-wbs"]);
      }
    } catch (err) {
      console.error("Error fetching projects for explorer:", err);
    }
  };

  const fetchHierarchy = useCallback(async () => {
    if (!selectedProjectWbs) return;
    setLoadingHierarchy(true);
    try {
      const res = await fetch(
        `/api/projects/hierarchy?projectWbs=${encodeURIComponent(selectedProjectWbs)}`
      );
      const json = await res.json();
      setHierarchyData(json);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      setHierarchyData(null);
    } finally {
      setLoadingHierarchy(false);
    }
  }, [selectedProjectWbs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "explorer" || activeTab === "networks") fetchAllProjects();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "explorer" && selectedProjectWbs) fetchHierarchy();
  }, [activeTab, selectedProjectWbs, fetchHierarchy]);

  const handleDelete = async (record) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/data-load/${activeTab}?id=${record._id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
      }
    } catch {
      alert("Error deleting record.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingRecord ? "PUT" : "POST";
    const bodyData = editingRecord ? { ...formData, _id: editingRecord._id } : { ...formData };

    if (activeTab === "projects") {
      ["start-date", "finished-date"].forEach((key) => {
        if (!bodyData[key]) bodyData[key] = null;
      });
    }

    if (activeTab === "networks") {
      const projectWbs = String(bodyData["project-wbs"] || "").trim();
      if (!projectWbs) {
        alert("Please select a project from the Projects list. Create the project first under Projects List.");
        return;
      }
      const existing = allProjects.find((p) => p["project-wbs"] === projectWbs);
      if (!existing) {
        alert(
          `Project "${projectWbs}" is not in the Projects collection.\n` +
            `Create it under Projects List first, then link it to a network.`
        );
        return;
      }
      // Always sync name from the canonical projects record
      bodyData["project-name"] = existing["project-name"] || bodyData["project-name"] || "";

      const activities = normalizeActivities(
        bodyData.activities ?? bodyData["activity-numbers"] ?? bodyData["activity-number"],
        projectWbs
      );

      const invalid = activities.filter(
        (a) => a["activity-wbs"] && !isValidActivityWbs(projectWbs, a["activity-wbs"])
      );
      if (invalid.length) {
        alert(
          `Activity WBS must be a child under the root project WBS ("${projectWbs}").\n` +
            `Examples: ${projectWbs}.002  ·  ${projectWbs}.003.002  ·  ${projectWbs}.001.001.001\n\n` +
            `Invalid:\n` +
            invalid.map((a) => a["activity-wbs"]).join("\n")
        );
        return;
      }

      const missingWbs = activities.filter((a) => a["activity-number"] && !a["activity-wbs"]);
      if (missingWbs.length) {
        alert("Each activity number should map to an Activity WBS (child of the project root).");
        return;
      }

      bodyData.activities = activities;
      bodyData["activity-numbers"] = activities.map((a) => a["activity-number"]).filter(Boolean);
      bodyData["activity-number"] = bodyData["activity-numbers"].join("; ");
    }

    if (activeTab === "wbs") {
      if (!bodyData["network-num"]) bodyData["network-num"] = null;
      if (!bodyData["activity-number"]) bodyData["activity-number"] = null;
    }

    try {
      const res = await fetch(`/api/data-load/${activeTab}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        if (activeTab === "explorer" || selectedProjectWbs) fetchHierarchy();
      } else {
        const err = await res.json();
        alert(`Save failed: ${err.error}`);
      }
    } catch {
      alert("Error saving record.");
    }
  };

  const openAddModal = () => {
    if (activeTab === "networks" && allProjects.length === 0) {
      alert("No projects found. Create a project under Projects List before adding a network.");
      return;
    }
    setEditingRecord(null);
    if (activeTab === "projects") {
      setFormData({
        "project-wbs": "",
        "project-name": "",
        "project-incharge": "",
        "start-date": "",
        "finished-date": "",
      });
    } else if (activeTab === "networks") {
      const first = allProjects[0];
      setFormData({
        "network-num": "",
        "project-wbs": first?.["project-wbs"] || "",
        "project-name": first?.["project-name"] || "",
        activities: [{ "activity-number": "", "activity-wbs": first?.["project-wbs"] ? `${first["project-wbs"]}.` : "" }],
        "created-by": "",
      });
    } else if (activeTab === "wbs") {
      setFormData({
        "wbs-number": "",
        "wbs-description": "",
        "network-num": "",
        "activity-number": "",
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const next = { ...record };
    if (activeTab === "projects") {
      next["start-date"] = toDateInputValue(record["start-date"]);
      next["finished-date"] = toDateInputValue(record["finished-date"]);
    }
    if (activeTab === "networks") {
      const acts = normalizeActivities(
        record.activities ?? record["activity-numbers"] ?? record["activity-number"]
      );
      next.activities = acts.length
        ? acts
        : [{ "activity-number": "", "activity-wbs": "" }];
    }
    setFormData(next);
    setIsModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    let headers = [];
    let sample = "";
    if (activeTab === "projects") {
      headers = [
        "project-wbs",
        "project-name",
        "project-incharge",
        "created-date",
        "changed-date",
        "start-date",
        "finished-date",
      ];
      sample =
        "\nIS/GP.20.009,5800000546 RENOVATION OF CONFERANCE ROOM,Ahmed Ghaith,2020-03-07,2021-12-13,2020-02-20,2020-06-27";
    } else if (activeTab === "networks") {
      headers = [
        "network-num",
        "project-wbs",
        "project-name",
        "activities",
        "created-date",
        "created-by",
      ];
      // activities = activity-number:activity-wbs pairs (semicolon-separated)
      sample =
        "\n4004616,IS/GP.20.005,PO 4801764366,0010:IS/GP.20.005.002;0020:IS/GP.20.005.003.001,2020-02-29,242";
    } else if (activeTab === "wbs") {
      headers = [
        "wbs-number",
        "wbs-description",
        "network-num",
        "activity-number",
        "updated-at",
      ];
      sample = "\nIS/GP.21.038.01,MATERIALS,4004616,0010,2026-06-25";
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + sample;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${activeTab}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const parsedData = parseCSV(event.target.result);
      if (parsedData.length === 0) {
        alert("The CSV file is empty or invalid.");
        return;
      }
      try {
        const res = await fetch(`/api/data-load/${activeTab}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, data: parsedData }),
        });
        const result = await res.json();
        if (res.ok) {
          const skipped = result.skippedMissingProjects?.length
            ? `\nSkipped ${result.skippedMissingProjects.length} network(s) — project not in Projects collection: ${[...new Set(result.skippedMissingProjects)].join(", ")}`
            : "";
          alert(`Successfully uploaded ${result.matchedCount + result.upsertedCount} records.${skipped}`);
          fetchData();
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      } catch {
        alert("Upload error.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const colSpan =
    activeTab === "projects" ? 6 : activeTab === "networks" ? 6 : activeTab === "wbs" ? 6 : 5;

  const hierarchyNetworks = hierarchyData?.networks || [];
  const hierarchyWbs = hierarchyData?.wbsElements || [];

  /** WBS under a given activity-wbs prefix (that node + descendants) */
  const wbsUnderActivity = (activityWbs) => {
    const prefix = String(activityWbs || "").trim();
    if (!prefix) return [];
    return hierarchyWbs.filter((w) => {
      const num = String(w["wbs-number"] || "");
      return num === prefix || num.startsWith(prefix + ".");
    });
  };

  const mappedActivityWbsSet = useMemo(() => {
    const set = new Set();
    hierarchyNetworks.forEach((net) => {
      normalizeActivities(net.activities ?? net["activity-numbers"] ?? net["activity-number"]).forEach(
        (a) => {
          if (a["activity-wbs"]) set.add(a["activity-wbs"]);
        }
      );
    });
    return set;
  }, [hierarchyNetworks]);

  const unmappedWbs = useMemo(() => {
    // Unmapped = project child WBS not covered by any activity-wbs (or its descendants already shown under an activity)
    return hierarchyWbs.filter((w) => {
      const num = String(w["wbs-number"] || "");
      // covered if equals or is under any mapped activity-wbs
      for (const actWbs of mappedActivityWbsSet) {
        if (num === actWbs || num.startsWith(actWbs + ".")) return false;
      }
      return true;
    });
  }, [hierarchyWbs, mappedActivityWbsSet]);

  const updateActivityRow = (index, field, value) => {
    const list = [...(formData.activities || [])];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, activities: list });
  };

  const addActivityRow = () => {
    const root = String(formData["project-wbs"] || "").trim();
    setFormData({
      ...formData,
      activities: [
        ...(formData.activities || []),
        {
          "activity-number": "",
          "activity-wbs": root ? `${root}.` : "",
        },
      ],
    });
  };

  const removeActivityRow = (index) => {
    const list = [...(formData.activities || [])];
    list.splice(index, 1);
    setFormData({
      ...formData,
      activities: list.length ? list : [{ "activity-number": "", "activity-wbs": "" }],
    });
  };

  return (
    <div className="app-page min-h-full font-[Poppins,sans-serif]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-app-border gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm("");
                }}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                  active
                    ? "border-app-accent text-app-accent"
                    : "border-transparent text-app-text-muted hover:text-app-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab !== "explorer" ? (
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-app-surface-muted border border-app-border rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "table"
                        ? "bg-app-surface text-app-accent shadow-sm"
                        : "text-app-text-muted"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "card"
                        ? "bg-app-surface text-app-accent shadow-sm"
                        : "text-app-text-muted"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="app-btn-secondary text-sm"
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
                  <button type="button" className="app-btn-secondary text-sm pointer-events-none">
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </button>
                </div>

                <button type="button" onClick={openAddModal} className="app-btn-primary text-sm">
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>
            </div>

            {totalCount > 0 && (
              <p className="text-xs text-app-text-muted px-1">{totalCount} record(s)</p>
            )}

            {loading ? (
              <div className="text-center py-16 text-app-text-muted font-medium">Loading data...</div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-app-border">
                  <thead className="bg-app-surface-muted">
                    {activeTab === "projects" && (
                      <tr>
                        {["Project WBS", "Project Name", "Project Incharge", "Start Date", "End Date", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className={`px-5 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider ${
                                h === "Actions" ? "text-right" : "text-left"
                              }`}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    )}
                    {activeTab === "networks" && (
                      <tr>
                        {[
                          "Network Number",
                          "Activity → Activity WBS",
                          "Project WBS (root)",
                          "Project Name",
                          "Created By",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`px-5 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider ${
                              h === "Actions" ? "text-right" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    )}
                    {activeTab === "wbs" && (
                      <tr>
                        {[
                          "WBS Number",
                          "WBS Description",
                          "Network",
                          "Activity",
                          "Last Updated",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`px-5 py-3.5 text-xs font-bold text-app-text-secondary uppercase tracking-wider ${
                              h === "Actions" ? "text-right" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
                    {dataList.map((row) => (
                      <tr key={row._id} className="hover:bg-app-surface-muted/70 transition-colors">
                        {activeTab === "projects" && (
                          <>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-app-accent">
                              {row["project-wbs"]}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-medium max-w-xs truncate text-app-text">
                              {row["project-name"]}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-secondary">
                              {row["project-incharge"]}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-muted">
                              {formatDate(row["start-date"])}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-muted">
                              {formatDate(row["finished-date"])}
                            </td>
                          </>
                        )}
                        {activeTab === "networks" && (
                          <>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-violet-600 dark:text-violet-400">
                              {row["network-num"]}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-app-text-secondary max-w-sm">
                              <div className="space-y-1">
                                {normalizeActivities(
                                  row.activities ?? row["activity-numbers"] ?? row["activity-number"]
                                ).map((a, i) => (
                                  <div key={i} className="text-xs leading-snug">
                                    <span className="font-semibold text-app-text">
                                      {a["activity-number"] || "—"}
                                    </span>
                                    <span className="text-app-text-muted"> → </span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                      {a["activity-wbs"] || "—"}
                                    </span>
                                  </div>
                                ))}
                                {!normalizeActivities(
                                  row.activities ?? row["activity-numbers"] ?? row["activity-number"]
                                ).length && <span>—</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-app-text">
                              {row["project-wbs"]}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-app-text-secondary max-w-xs truncate">
                              {row["project-name"]}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-muted">
                              {row["created-by"] || "N/A"}
                            </td>
                          </>
                        )}
                        {activeTab === "wbs" && (
                          <>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {row["wbs-number"]}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-medium text-app-text">
                              {row["wbs-description"]}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-secondary">
                              {row["network-num"] || "—"}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-secondary">
                              {row["activity-number"] || "—"}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-sm text-app-text-muted">
                              {formatDate(row["updated-at"])}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm space-x-1">
                          {activeTab === "projects" && (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/projects1?project=${encodeURIComponent(row["project-wbs"])}`)
                              }
                              className="p-1.5 rounded-lg text-app-text-muted hover:text-app-accent hover:bg-app-accent-soft transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 inline" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="p-1.5 rounded-lg text-app-text-muted hover:text-amber-600 hover:bg-amber-500/10 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="p-1.5 rounded-lg text-app-text-muted hover:text-rose-600 hover:bg-rose-500/10 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {dataList.length === 0 && (
                      <tr>
                        <td colSpan={colSpan} className="text-center py-12 text-app-text-muted text-sm">
                          <Inbox className="w-10 h-10 mx-auto mb-2 text-app-text-disabled" />
                          No data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {dataList.map((row) => (
                  <div
                    key={row._id}
                    className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm hover:border-app-accent/40 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div>
                      {activeTab === "projects" && (
                        <>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-app-accent bg-app-accent-soft px-2.5 py-0.5 rounded-full">
                            {row["project-wbs"]}
                          </span>
                          <h4 className="text-lg font-bold text-app-text mt-3 line-clamp-2">
                            {row["project-name"]}
                          </h4>
                          <p className="text-sm text-app-text-muted mt-2">
                            PM:{" "}
                            <span className="font-semibold text-app-text">{row["project-incharge"]}</span>
                          </p>
                        </>
                      )}
                      {activeTab === "networks" && (
                        <>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                            Network: {row["network-num"]}
                          </span>
                          <h4 className="text-base font-bold text-app-text mt-3 line-clamp-2">
                            {row["project-name"]}
                          </h4>
                          <p className="text-xs text-app-text-muted mt-2">
                            Root WBS:{" "}
                            <span className="font-semibold text-app-text">{row["project-wbs"]}</span>
                          </p>
                          <p className="text-xs text-app-text-muted mt-1 leading-relaxed">
                            Activities:{" "}
                            <span className="font-semibold text-app-text">
                              {formatActivitiesSummary(
                                row.activities ?? row["activity-numbers"] ?? row["activity-number"]
                              )}
                            </span>
                          </p>
                        </>
                      )}
                      {activeTab === "wbs" && (
                        <>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            {row["wbs-number"]}
                          </span>
                          <h4 className="text-base font-bold text-app-text mt-3">{row["wbs-description"]}</h4>
                          <p className="text-xs text-app-text-muted mt-2">
                            Net / Act: {row["network-num"] || "—"} / {row["activity-number"] || "—"}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-app-border pt-3">
                      <span className="text-[11px] text-app-text-muted">
                        {activeTab === "projects" && row["start-date"]
                          ? `Start: ${formatDate(row["start-date"])}`
                          : ""}
                        {activeTab === "projects" && row["finished-date"]
                          ? ` · End: ${formatDate(row["finished-date"])}`
                          : ""}
                        {activeTab === "wbs" && row["updated-at"]
                          ? `Updated: ${formatDate(row["updated-at"])}`
                          : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        {activeTab === "projects" && (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/projects1?project=${encodeURIComponent(row["project-wbs"])}`)
                            }
                            className="p-1.5 bg-app-surface-muted hover:bg-app-accent-soft text-app-text-muted hover:text-app-accent rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 bg-app-surface-muted hover:bg-amber-500/10 text-app-text-muted hover:text-amber-600 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="p-1.5 bg-app-surface-muted hover:bg-rose-500/10 text-app-text-muted hover:text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {dataList.length === 0 && (
                  <div className="col-span-full text-center py-16 text-app-text-muted">
                    <Inbox className="w-10 h-10 mx-auto mb-2 text-app-text-disabled" />
                    No data
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Hierarchy Explorer */
          <div className="space-y-5">
            <div className="bg-app-surface border border-app-border p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-app-text">Project Network & WBS Element Map</h3>
                <p className="text-sm text-app-text-muted mt-1">
                  Root project WBS → networks → activity number mapped to child Activity WBS (and deeper levels).
                </p>
              </div>
              <select
                value={selectedProjectWbs}
                onChange={(e) => setSelectedProjectWbs(e.target.value)}
                className={`${inputClass} md:w-80 font-semibold`}
              >
                {allProjects.length === 0 && <option value="">No projects</option>}
                {allProjects.map((p) => (
                  <option key={p._id} value={p["project-wbs"]}>
                    {p["project-wbs"]} - {p["project-name"]}
                  </option>
                ))}
              </select>
            </div>

            {loadingHierarchy ? (
              <div className="text-center py-16 text-app-text-muted font-medium">
                Tracing nodes & connections...
              </div>
            ) : !hierarchyData?.project ? (
              <div className="bg-app-surface border border-app-border rounded-2xl p-12 text-center shadow-sm">
                <Inbox className="w-12 h-12 mx-auto mb-3 text-app-text-disabled" />
                <p className="text-lg font-bold text-app-text">No data</p>
                <p className="text-sm text-app-text-muted mt-1">
                  No project selected or project record not found.
                </p>
              </div>
            ) : (
              <div className="bg-app-surface-muted/40 border border-app-border p-6 sm:p-8 rounded-2xl">
                <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
                  {/* Root */}
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-r from-sky-500 to-cyan-600 p-6 rounded-2xl shadow-lg text-center text-white max-w-md w-full">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-sky-100">
                        Root Project WBS
                      </span>
                      <h2 className="text-lg font-bold mt-1">{hierarchyData.project["project-wbs"]}</h2>
                      <p className="text-sm text-sky-50 mt-2">{hierarchyData.project["project-name"]}</p>
                      <div className="mt-3 text-xs text-sky-100 border-t border-white/20 pt-2">
                        Incharge: {hierarchyData.project["project-incharge"] || "—"}
                      </div>
                    </div>
                    <div className="w-0.5 h-8 bg-app-border" />
                  </div>

                  {/* Networks with activity → activity WBS */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Network className="w-5 h-5 text-violet-500" />
                      <h3 className="text-base font-bold text-app-text">
                        Networks → Activity → Activity WBS
                      </h3>
                    </div>

                    {hierarchyNetworks.length === 0 ? (
                      <div className="rounded-xl border border-app-border bg-app-surface p-8 text-center">
                        <p className="font-medium text-app-text">No data</p>
                        <p className="text-sm text-app-text-muted mt-1">
                          No networks mapped to this project.
                        </p>
                      </div>
                    ) : (
                      hierarchyNetworks.map((net) => {
                        const acts = normalizeActivities(
                          net.activities ?? net["activity-numbers"] ?? net["activity-number"]
                        );
                        return (
                          <div
                            key={net._id || net["network-num"]}
                            className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                              <div>
                                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                  Network {net["network-num"]}
                                </span>
                                <p className="text-sm text-app-text-secondary mt-0.5">
                                  {net["project-name"] || "—"}
                                </p>
                              </div>
                              <span className="text-[11px] text-app-text-muted">
                                By: {net["created-by"] || "System"}
                              </span>
                            </div>

                            {acts.length === 0 ? (
                              <p className="text-sm text-app-text-muted">
                                No activity → Activity WBS mappings yet.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {acts.map((a, idx) => {
                                  const under = wbsUnderActivity(a["activity-wbs"]);
                                  const tree = buildWbsTree(under);
                                  return (
                                    <div
                                      key={`${a["activity-number"]}-${a["activity-wbs"]}-${idx}`}
                                      className="rounded-xl border border-app-border bg-app-bg/60 p-4"
                                    >
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                                          Act {a["activity-number"] || "—"}
                                        </span>
                                        <span className="text-app-text-muted text-xs">→</span>
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                          Activity WBS {a["activity-wbs"] || "—"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-app-text-muted mb-2 flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5" />
                                        Child / grandchild WBS under this activity
                                      </p>
                                      {under.length === 0 ? (
                                        <p className="text-sm text-app-text-muted">
                                          No matching WBS records under this Activity WBS prefix yet
                                          (add them in WBS Elements).
                                        </p>
                                      ) : (
                                        <WbsTreeNodes nodes={tree} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Unmapped WBS */}
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-base font-bold text-app-text">
                        Unmapped child WBS (not under any Activity WBS)
                      </h3>
                    </div>
                    {unmappedWbs.length === 0 ? (
                      <div className="rounded-xl border border-app-border bg-app-surface p-6 text-center text-sm text-app-text-muted">
                        {hierarchyWbs.length === 0
                          ? "No child WBS elements found for this project."
                          : "All child WBS elements fall under a mapped Activity WBS."}
                      </div>
                    ) : (
                      <div className="bg-app-surface border border-app-border rounded-2xl p-5">
                        <WbsTreeNodes nodes={buildWbsTree(unmappedWbs)} />
                        <p className="text-xs text-app-text-muted mt-3">
                          Tip: on Networks, map an activity number to an Activity WBS that prefixes these
                          nodes (e.g. root.002 or root.003.001).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {mounted &&
          isModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-app-overlay backdrop-blur-sm overflow-y-auto">
              <div className="bg-app-surface border border-app-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-app-border">
                  <h3 className="text-lg font-bold text-app-text">
                    {editingRecord ? "Edit Record" : "Add New Record"}
                  </h3>
                  <p className="text-xs text-app-text-muted mt-1">
                    Fill in the required fields to save.
                  </p>
                </div>

                <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {activeTab === "projects" && (
                      <>
                        <div>
                          <label className={labelClass}>Project WBS (Required)</label>
                          <input
                            type="text"
                            required
                            disabled={!!editingRecord}
                            value={formData["project-wbs"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "project-wbs": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Project Name (Required)</label>
                          <input
                            type="text"
                            required
                            value={formData["project-name"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "project-name": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Project Incharge (Required)</label>
                          <input
                            type="text"
                            required
                            value={formData["project-incharge"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "project-incharge": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Start Date (optional)</label>
                            <input
                              type="date"
                              value={formData["start-date"] || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, "start-date": e.target.value })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>End Date (optional)</label>
                            <input
                              type="date"
                              value={formData["finished-date"] || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, "finished-date": e.target.value })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === "networks" && (
                      <>
                        <div>
                          <label className={labelClass}>Network Number (Required)</label>
                          <input
                            type="text"
                            required
                            disabled={!!editingRecord}
                            value={formData["network-num"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "network-num": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Root Project (Required)</label>
                          <select
                            required
                            value={formData["project-wbs"] || ""}
                            onChange={(e) => {
                              const wbs = e.target.value;
                              const proj = allProjects.find((p) => p["project-wbs"] === wbs);
                              setFormData({
                                ...formData,
                                "project-wbs": wbs,
                                "project-name": proj?.["project-name"] || "",
                              });
                            }}
                            className={inputClass}
                          >
                            <option value="">Select an existing project…</option>
                            {allProjects.map((p) => (
                              <option key={p._id || p["project-wbs"]} value={p["project-wbs"]}>
                                {p["project-wbs"]} — {p["project-name"]}
                              </option>
                            ))}
                            {formData["project-wbs"] &&
                              !allProjects.some((p) => p["project-wbs"] === formData["project-wbs"]) && (
                                <option value={formData["project-wbs"]}>
                                  {formData["project-wbs"]} — (not in Projects — create it first)
                                </option>
                              )}
                          </select>
                          <p className="mt-1 text-[11px] text-app-text-muted">
                            Only projects already created under Projects List can be linked.
                            Activity WBS must use this root prefix (e.g. .002, .003.002, .001.001.001).
                          </p>
                          {allProjects.length === 0 && (
                            <p className="mt-1 text-[11px] text-rose-500 font-medium">
                              No projects available. Add one under Projects List first.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>Project Name</label>
                          <input
                            type="text"
                            readOnly
                            value={formData["project-name"] || ""}
                            className={`${inputClass} opacity-80 cursor-not-allowed`}
                            title="Filled from the selected project"
                          />
                        </div>

                        <div className="rounded-xl border border-app-border bg-app-surface-muted/40 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <label className={`${labelClass} mb-0`}>
                              Activities → Activity WBS{" "}
                              <span className="normal-case font-medium">(one-to-many)</span>
                            </label>
                            <button
                              type="button"
                              onClick={addActivityRow}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-app-accent hover:text-app-accent-hover"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add activity
                            </button>
                          </div>
                          {(formData.activities || []).map((row, index) => {
                            const root = String(formData["project-wbs"] || "").trim();
                            const wbsOk =
                              !row["activity-wbs"] || isValidActivityWbs(root, row["activity-wbs"]);
                            return (
                              <div
                                key={index}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-start bg-app-surface border border-app-border rounded-xl p-3"
                              >
                                <div>
                                  <label className="text-[10px] font-semibold uppercase text-app-text-muted">
                                    Activity #
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 0010"
                                    value={row["activity-number"] || ""}
                                    onChange={(e) =>
                                      updateActivityRow(index, "activity-number", e.target.value)
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold uppercase text-app-text-muted">
                                    Activity WBS (child)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={root ? `${root}.002` : "root.002"}
                                    value={row["activity-wbs"] || ""}
                                    onChange={(e) =>
                                      updateActivityRow(index, "activity-wbs", e.target.value)
                                    }
                                    className={`${inputClass} ${
                                      !wbsOk ? "border-rose-400 focus:border-rose-500" : ""
                                    }`}
                                  />
                                  {!wbsOk && (
                                    <p className="mt-1 text-[10px] text-rose-500">
                                      Must start with {root}.
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeActivityRow(index)}
                                  className="mt-5 p-2 rounded-lg text-app-text-muted hover:text-rose-600 hover:bg-rose-500/10"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          <p className="text-[11px] text-app-text-muted">
                            Example: root <code className="text-app-text">IS/GP.20.009</code> →
                            child <code className="text-app-text">IS/GP.20.009.002</code>, grandchild{" "}
                            <code className="text-app-text">IS/GP.20.009.003.002</code>, 3rd level{" "}
                            <code className="text-app-text">IS/GP.20.009.001.001.001</code>
                          </p>
                        </div>

                        <div>
                          <label className={labelClass}>Created By</label>
                          <input
                            type="text"
                            value={formData["created-by"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "created-by": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}

                    {activeTab === "wbs" && (
                      <>
                        <div>
                          <label className={labelClass}>WBS Number (Required)</label>
                          <input
                            type="text"
                            required
                            disabled={!!editingRecord}
                            value={formData["wbs-number"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "wbs-number": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>WBS Description (Required)</label>
                          <input
                            type="text"
                            required
                            value={formData["wbs-description"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "wbs-description": e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Network Number</label>
                            <input
                              type="text"
                              placeholder="Optional"
                              value={formData["network-num"] || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, "network-num": e.target.value })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Activity Number</label>
                            <input
                              type="text"
                              placeholder="Optional"
                              value={formData["activity-number"] || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, "activity-number": e.target.value })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-app-text-muted">
                          Optional reverse link. Prefer mapping Activity → Activity WBS on the Network
                          record (child WBS under the project root).
                        </p>
                      </>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-app-border bg-app-surface-muted/50 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="app-btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="app-btn-primary text-sm">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
