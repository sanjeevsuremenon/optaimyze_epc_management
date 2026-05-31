import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { 
  Network,
  Upload,
  Download,
  AlertOctagon,
  ArrowLeft
} from "lucide-react";
import MasterTable from "../../components/AssetManagement/MasterTable";
import MasterFormModal from "../../components/AssetManagement/MasterFormModal";
import BulkImportModal from "../../components/AssetManagement/BulkImportModal";
import useDebounce from "../../lib/useDebounce";

const masterTabs = [
  {
    id: "networks",
    label: "Networks",
    apiType: "networks",
    icon: Network,
    fields: [
      { key: "network-num", label: "Network Number", type: "text", required: true, isKey: true },
      { key: "project-wbs", label: "Project WBS", type: "text", required: true },
      { key: "project-name", label: "Project Name", type: "text", required: true },
      { key: "created-date", label: "Created Date (YYYY-MM-DD)", type: "text", required: false },
      { key: "created-by", label: "Created By", type: "text", required: false },
    ]
  }
];

export default function DataLoad() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(masterTabs[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadMoreRef = useRef(null);

  // Authenticate and redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status]);

  const fetchData = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const skipOffset = isLoadMore ? data.length : 0;
      const url = `/api/data-load/${activeTab.apiType}?limit=50&skip=${skipOffset}&search=${encodeURIComponent(debouncedSearchTerm)}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (isLoadMore) {
        setData((prev) => [...prev, ...(json.data || [])]);
      } else {
        setData(json.data || []);
      }
      setHasMore(Boolean(json.hasMore));
      setTotalCount(json.total || 0);
    } catch (err) {
      console.error("Error fetching Data Load master data:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch when Tab changes or Search term resolves
  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchData(false);
    }
  }, [activeTab, debouncedSearchTerm, session]);

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
      const res = await fetch(`/api/data-load/${activeTab.apiType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, data: importedData })
      });
      const json = await res.json();
      if (res.ok) {
        fetchData(false);
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
      const url = `/api/data-load/${activeTab.apiType}?export=true&search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const json = await res.json();
      const exportData = json.data || [];

      if (exportData.length === 0) {
        alert("No data available to export");
        return;
      }

      // Format data and remove internal MongoDB fields
      const formattedData = exportData.map(({ _id, createdAt, updatedAt, ...rest }) => rest);

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
      const res = await fetch(`/api/data-load/${activeTab.apiType}?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData(false);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to delete record'}`);
      }
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const handleSave = async (formData) => {
    const method = editingRecord ? "PUT" : "POST";
    const payload = editingRecord ? { ...formData, _id: editingRecord._id } : formData;

    try {
      const res = await fetch(`/api/data-load/${activeTab.apiType}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData(false);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save'}`);
      }
    } catch (err) {
      console.error("Error saving record:", err);
    }
  };

  // Render Access Checking States
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <AlertOctagon size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You do not have permission to access the Data Load module. This area is restricted to accounts with administrator role privileges.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-md border border-slate-700 hover:border-slate-600 transition-colors shadow-lg"
          >
            <ArrowLeft size={16} /> Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Data Load | EPC Portal</title>
      </Head>
      <div className="flex flex-col bg-slate-950 min-h-screen text-slate-200">
        
        {/* Navigation Tabs */}
        <div className="w-full bg-slate-900 border-b border-slate-800 overflow-x-auto custom-scrollbar flex justify-center px-4 sm:px-12">
          <nav className="flex items-center gap-2 py-3 min-w-max">
            {masterTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors text-xs font-semibold ${
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

        {/* Content Container */}
        <div className="flex-1 p-6 md:px-12 lg:px-24 xl:px-32 overflow-x-hidden w-full max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <activeTab.icon className="text-cyan-400" size={24} />
                Data Load — {activeTab.label}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Import, upsert, and manage reference records for {activeTab.label.toLowerCase()} (showing {data.length} of {totalCount} records)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-4 py-2 border border-slate-700 rounded-md bg-slate-900/60 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="absolute right-3 top-2 flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-200 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Export Button Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-semibold rounded-md border border-slate-700 hover:border-slate-650 transition-colors shadow-md"
                >
                  <Download size={14} /> Export
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-slate-850 border border-slate-700 rounded-md shadow-xl hidden group-hover:block hover:block z-50 overflow-hidden">
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

          <div className="bg-slate-900/60 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
            <MasterTable 
              data={data} 
              fields={activeTab.fields} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              loading={loading && data.length === 0}
            />
            <div ref={loadMoreRef} className="py-6 text-center border-t border-slate-800 bg-slate-900/20">
              {loadingMore ? (
                <span className="text-sm text-cyan-400 font-semibold animate-pulse">Loading more records...</span>
              ) : hasMore ? (
                <span className="text-xs text-slate-500 font-medium">Scroll down to load more</span>
              ) : data.length > 0 ? (
                <span className="text-xs text-slate-500 font-medium">All {totalCount} records loaded.</span>
              ) : null}
            </div>
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
          globalData={{}}
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
          globalData={null}
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

export async function getServerSideProps(context) {
  const { authOptions } = require("../api/auth/[...nextauth]");
  const { getServerSession } = require("next-auth/next");

  // Dynamic host detection to prevent NEXTAUTH_URL mismatches and localhost resolution errors
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  let host = context.req.headers['x-forwarded-host'] || context.req.headers.host || '127.0.0.1:3000';
  if (host.startsWith('localhost')) {
    host = host.replace('localhost', '127.0.0.1');
  }
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;

  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || session?.user?.role !== "admin") {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}
