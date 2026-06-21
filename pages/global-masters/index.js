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
  Download,
  Plus,
  Search,
  ChevronDown,
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
    subtitle: "Manage global reference database for employees",
    fields: [
      { key: "empno", label: "Employee Code / ID", type: "text", required: true, isKey: true },
      { key: "empname", label: "Full Name", type: "text", required: true },
      { key: "designation", label: "Designation", type: "dynamic-select", required: true },
      { key: "department", label: "Department", type: "dynamic-select", required: true },
      { key: "email", label: "Email Address", type: "text", required: false },
      { key: "grade", label: "Grade", type: "dynamic-select", required: false },
      { key: "salaryLevel", label: "Salary Level", type: "dynamic-select", required: false },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
          { value: "On Leave", label: "On Leave" },
        ],
        required: true,
      },
    ],
  },
  {
    id: "designations",
    label: "Designations",
    apiType: "designations",
    icon: BadgeCheck,
    subtitle: "Manage job titles and designation reference data",
    fields: [{ key: "name", label: "Designation Name", type: "text", required: true, isKey: true }],
  },
  {
    id: "departments",
    label: "Departments",
    apiType: "departments",
    icon: Building2,
    subtitle: "Manage organizational department reference data",
    fields: [{ key: "name", label: "Department Name", type: "text", required: true, isKey: true }],
  },
  {
    id: "locations",
    label: "Locations",
    apiType: "locations",
    icon: MapPin,
    subtitle: "Manage warehouse and camp location records",
    fields: [
      { key: "locationName", label: "Location Name", type: "text", required: true, isKey: true },
      {
        key: "premisesKind",
        label: "Premises Kind",
        type: "select",
        options: [
          { value: "warehouse", label: "Warehouse" },
          { value: "department", label: "Department / Camp" },
        ],
        required: true,
      },
      { key: "townCity", label: "Town/City", type: "dynamic-select", dependsOn: "premisesKind", required: true },
      { key: "buildingTower", label: "Building/Tower", type: "text", required: true },
      { key: "landmark", label: "Landmark", type: "text" },
      { key: "latitude", label: "Latitude", type: "text" },
      { key: "longitude", label: "Longitude", type: "text" },
      { key: "remarks", label: "Remarks", type: "textarea" },
    ],
  },
  {
    id: "locationcities",
    label: "Location Cities",
    apiType: "locationcities",
    icon: Map,
    subtitle: "Manage city and town reference data for locations",
    fields: [
      { key: "name", label: "City Name", type: "text", required: true, isKey: true },
      {
        key: "kind",
        label: "Kind",
        type: "select",
        options: [
          { value: "warehouse", label: "Warehouse" },
          { value: "department", label: "Department / Camp" },
        ],
        required: true,
        isKey: true,
      },
    ],
  },
  {
    id: "employee-grades",
    label: "Employee Grades",
    apiType: "employee-grades",
    icon: Award,
    subtitle: "Manage employee grade codes and descriptions",
    fields: [
      { key: "grade", label: "Grade Code", type: "text", required: true, isKey: true },
      { key: "description", label: "Description", type: "text" },
    ],
  },
  {
    id: "employee-salary-levels",
    label: "Salary Levels",
    apiType: "employee-salary-levels",
    icon: Coins,
    subtitle: "Manage salary level bands and ranges",
    fields: [
      { key: "level", label: "Salary Level", type: "text", required: true, isKey: true },
      { key: "minSalary", label: "Min Salary (SAR)", type: "text" },
      { key: "maxSalary", label: "Max Salary (SAR)", type: "text" },
    ],
  },
  {
    id: "equipment-types",
    label: "Equipment Types",
    apiType: "equipment-types",
    icon: Settings,
    subtitle: "Manage equipment type classifications",
    fields: [
      { key: "name", label: "Equipment Type Name", type: "text", required: true, isKey: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
];

function getModalTitle(tab, editing) {
  if (tab.id === "employees") {
    return editing ? "Edit Employee" : "Add Employees";
  }
  const singular = tab.label.endsWith("s") ? tab.label.slice(0, -1) : tab.label;
  return `${editing ? "Edit" : "Add"} ${singular}`;
}

export default function GlobalMasters() {
  const [activeTab, setActiveTab] = useState(masterTabs[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [globalData, setGlobalData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const loadMoreRef = useRef(null);
  const exportRef = useRef(null);

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
      setGlobalData({
        locationcities: await citiesRes.json(),
        designations: await designationsRes.json(),
        departments: await departmentsRes.json(),
        "employee-grades": await gradesRes.json(),
        "employee-salary-levels": await salaryLevelsRes.json(),
      });
    } catch (e) {
      console.error("Failed to load global masters dependencies", e);
    }
  };

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

  useEffect(() => {
    if (activeTab.id === "employees") {
      fetchData(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadGlobalDependencies();
  }, []);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchData(true);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, data.length]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleBulkImport = async (importedData) => {
    try {
      const res = await fetch(`/api/global-masters/${activeTab.apiType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, data: importedData }),
      });
      const json = await res.json();
      if (res.ok) {
        fetchData(false);
        loadGlobalDependencies();
        return { success: true, ...json };
      }
      return { success: false, error: json.error };
    } catch (err) {
      console.error("Bulk import failed:", err);
      return { success: false, error: err.message };
    }
  };

  const handleExport = async (format = "xlsx") => {
    setExportOpen(false);
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

      if (format === "csv") {
        const csv = Papa.unparse(formattedData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", downloadUrl);
        link.setAttribute("download", `${activeTab.id}_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } else {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab.label);
        XLSX.writeFile(wb, `${activeTab.id}_export_${new Date().toISOString().split("T")[0]}.xlsx`);
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
      await fetch(`/api/global-masters/${activeTab.apiType}?id=${id}`, { method: "DELETE" });
      fetchData(false);
      loadGlobalDependencies();
    } catch (err) {
      console.error("Error deleting global master record:", err);
    }
  };

  const handleSave = async (formData) => {
    const method = editingRecord ? "PUT" : "POST";
    const payload = editingRecord ? { ...formData, _id: editingRecord._id } : formData;

    const res = await fetch(`/api/global-masters/${activeTab.apiType}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchData(false);
      loadGlobalDependencies();
    } else {
      const err = await res.json();
      alert(`Error: ${err.error || "Failed to save"}`);
      throw new Error(err.error || "Failed to save");
    }
  };

  const ActiveIcon = activeTab.icon;

  return (
    <>
      <Head>
        <title>Global Masters | OPTAIMYZE Portal</title>
      </Head>

      <div className="app-page min-h-full">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-xs text-app-text-muted" aria-label="Breadcrumb">
            <span>Global Masters</span>
            <span className="mx-1.5 text-app-text-secondary">/</span>
            <span className="font-medium text-app-accent">{activeTab.label}</span>
          </nav>

          {/* Pill tabs */}
          <div className="mb-6 overflow-x-auto custom-scrollbar">
            <div className="inline-flex min-w-max gap-1 rounded-full border border-app-border bg-app-surface-muted p-1">
              {masterTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab.id === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 ${
                      isActive
                        ? "bg-app-accent text-app-accent-text shadow-sm"
                        : "text-app-text-secondary hover:bg-app-surface hover:text-app-text"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={isActive ? "text-app-accent-text" : "text-app-text-muted"}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title + actions */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ActiveIcon className="h-6 w-6 text-app-accent" aria-hidden />
                <h1 className="text-2xl font-bold text-app-text">{activeTab.label}</h1>
              </div>
              <p className="mt-1 pl-9 text-sm text-app-text-muted">{activeTab.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab.id === "employees" && (
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-app-text-muted"
                    aria-hidden
                  />
                  <input
                    type="text"
                    placeholder="Search by name or ID…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-72 rounded-lg border border-app-border bg-app-surface pl-10 pr-4 text-sm text-app-text placeholder-app-text-disabled transition focus:border-app-accent focus:outline-none focus:ring-[3px] focus:ring-app-accent-soft"
                  />
                </div>
              )}

              <div className="relative" ref={exportRef}>
                <button
                  type="button"
                  onClick={() => setExportOpen((v) => !v)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 text-sm font-medium text-app-text-secondary shadow-sm transition hover:border-app-border hover:bg-app-surface-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export
                  <ChevronDown className="h-3.5 w-3.5 text-app-text-muted" aria-hidden />
                </button>
                {exportOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleExport("xlsx")}
                      className="block w-full px-4 py-2.5 text-left text-sm text-app-text-secondary hover:bg-app-surface-muted"
                    >
                      Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport("csv")}
                      className="block w-full border-t border-app-border-light px-4 py-2.5 text-left text-sm text-app-text-secondary hover:bg-app-surface-muted"
                    >
                      CSV (.csv)
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 text-sm font-medium text-app-text-secondary shadow-sm transition hover:border-app-border hover:bg-app-surface-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Bulk Import
              </button>

              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-app-accent px-4 text-sm font-medium text-white shadow-sm transition hover:bg-app-accent-hover focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Record
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm">
            <MasterTable
              data={data}
              fields={activeTab.fields}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading && data.length === 0}
              
              totalCount={totalCount}
              onAdd={handleAdd}
              tabLabel={activeTab.label}
            />

            {activeTab.id === "employees" && data.length > 0 && (
              <div ref={loadMoreRef} className="border-t border-app-border bg-app-surface-muted px-4 py-4 text-center">
                {loadingMore ? (
                  <span className="text-sm font-medium text-app-accent">Loading more employees…</span>
                ) : hasMore ? (
                  <span className="text-xs text-app-text-muted">Scroll down to load more</span>
                ) : (
                  <span className="text-xs text-app-text-muted">All {totalCount} employees loaded.</span>
                )}
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
          title={getModalTitle(activeTab, editingRecord)}
          
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps(context) {
  const { authOptions } = require("../api/auth/[...nextauth]");
  const { getServerSession } = require("next-auth/next");

  const protocol = context.req.headers["x-forwarded-proto"] || "http";
  let host = context.req.headers["x-forwarded-host"] || context.req.headers.host || "127.0.0.1:3000";
  if (host.startsWith("localhost")) {
    host = host.replace("localhost", "127.0.0.1");
  }
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;

  const session = await getServerSession(context.req, context.res, authOptions);

  return {
    props: {
      session: session || null,
    },
  };
}
