import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { 
  FileImage, 
  FileSpreadsheet, 
  FileText, 
  BookOpen, 
  Mail, 
  ClipboardCheck, 
  FileBarChart, 
  FolderOpen,
  Clock,
  UploadCloud,
  Trash2,
  Download,
  AlertCircle,
  Loader,
  ChevronDown,
  Search,
  File,
  Info
} from "lucide-react";

const documentTabs = [
  { id: "project-drawings", label: "Project Drawings", icon: FileImage },
  { id: "project-boq", label: "Project BOQ", icon: FileSpreadsheet },
  { id: "scope-doc", label: "Scope Doc (PTS)", icon: FileText },
  { id: "equipment-catalogue", label: "Equipment Catalogue", icon: BookOpen },
  { id: "client-correspondence", label: "Client Correspondence", icon: Mail },
  { id: "supplier-correspondence", label: "Supplier Correspondence", icon: Mail },
  { id: "subcontract-correspondence", label: "Subcontract Correspondence", icon: Mail },
  { id: "request-for-inspection", label: "Request for Inspection", icon: ClipboardCheck },
  { id: "itp-reports", label: "ITP & Reports", icon: FileBarChart },
  { id: "other-documents", label: "Other Documents", icon: FolderOpen },
];

const getTabConstraints = (tabId) => {
  if (tabId === "project-drawings") {
    return {
      allowedExts: [".dwg", ".dxf", ".pdf"],
      allowedDesc: "CAD Drawings (.dwg, .dxf) or PDF (.pdf)",
      maxSizeMB: 25,
      accept: ".dwg,.dxf,.pdf"
    };
  } else if (
    tabId === "client-correspondence" ||
    tabId === "supplier-correspondence" ||
    tabId === "subcontract-correspondence"
  ) {
    return {
      allowedExts: [".eml", ".msg", ".pdf"],
      allowedDesc: "Emails (.eml, .msg) or PDF (.pdf)",
      maxSizeMB: 10,
      accept: ".eml,.msg,.pdf"
    };
  } else {
    return {
      allowedExts: [".docx", ".pdf", ".jpeg", ".jpg"],
      allowedDesc: "Word Docs (.docx), PDFs (.pdf), or Images (.jpeg, .jpg)",
      maxSizeMB: 10,
      accept: ".docx,.pdf,.jpeg,.jpg"
    };
  }
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const pathExt = (filename) => {
  if (!filename) return "";
  const idx = filename.lastIndexOf(".");
  return idx !== -1 ? filename.substring(idx).toLowerCase() : "";
};

const FileIcon = ({ ext, ...props }) => {
  if (ext === ".pdf") return <FileText {...props} />;
  if (ext === ".docx") return <FileText {...props} />;
  if ([".dwg", ".dxf"].includes(ext)) return <FileImage {...props} />;
  if ([".jpeg", ".jpg"].includes(ext)) return <FileImage {...props} />;
  if ([".eml", ".msg"].includes(ext)) return <Mail {...props} />;
  return <FolderOpen {...props} />;
};

export default function ProjectDocuments() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(documentTabs[0]);
  
  // Project list and selector state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Documents listing and action state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Selected files state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch projects on mount and restore selection
  useEffect(() => {
    async function initProjects() {
      setLoadingProjects(true);
      try {
        const savedWbs = localStorage.getItem("selected_project_wbs");
        let initialProject = null;

        // If there's a saved WBS, fetch it specifically first
        if (savedWbs) {
          try {
            const res = await fetch(`/api/projects?str=${encodeURIComponent(savedWbs)}`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                const found = data.find((p) => p["project-wbs"] === savedWbs);
                if (found) {
                  initialProject = found;
                }
              }
            }
          } catch (e) {
            console.error("Failed to fetch initial saved project", e);
          }
        }

        // Fetch default list of projects
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProjects(data);
            if (initialProject) {
              setSelectedProject(initialProject);
            } else if (data.length > 0) {
              setSelectedProject(data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Error initializing projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    initProjects();
  }, []);

  // Fetch projects list when search term changes (debounced database search)
  useEffect(() => {
    // Skip if search term is empty (handled by initial fetch)
    if (searchTerm === "") {
      // Re-fetch default list to reset
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setProjects(data);
        })
        .catch((err) => console.error(err));
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`/api/projects?str=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProjects(data);
          }
        }
      } catch (err) {
        console.error("Error searching projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Sync selection to localStorage & trigger document fetch
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem("selected_project_wbs", selectedProject["project-wbs"]);
      fetchDocuments();
    } else {
      setDocuments([]);
    }
    // Clear selected files when project or tab changes to prevent uploading to incorrect contexts
    setSelectedFiles([]);
    setValidationError(null);
  }, [selectedProject, activeTab.id]);

  const fetchDocuments = async () => {
    if (!selectedProject) return;
    setLoadingDocs(true);
    try {
      const res = await fetch(
        `/api/projectdocuments/files?projectWbs=${encodeURIComponent(
          selectedProject["project-wbs"]
        )}&tabId=${encodeURIComponent(activeTab.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        toast.error("Failed to load documents");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  const validateFile = (file, tabId) => {
    const extension = pathExt(file.name);
    const sizeInMB = file.size / (1024 * 1024);
    const constraints = getTabConstraints(tabId);

    if (!constraints.allowedExts.includes(extension)) {
      return `'${file.name}' format is invalid. Allowed: ${constraints.allowedDesc}.`;
    }
    if (sizeInMB > constraints.maxSizeMB) {
      return `'${file.name}' is too large (${sizeInMB.toFixed(2)}MB). Max size: ${constraints.maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFileSelection = (files) => {
    setValidationError(null);
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const errorMsg = validateFile(file, activeTab.id);
      if (errorMsg) {
        errors.push(errorMsg);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setValidationError(errors.join(" | "));
    }

    // Append newly selected valid files
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
    if (selectedFiles.length <= 1) {
      setValidationError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedProject || selectedFiles.length === 0) return;
    setUploading(true);
    setValidationError(null);

    const formData = new FormData();
    formData.append("projectWbs", selectedProject["project-wbs"]);
    formData.append("projectName", selectedProject["project-name"]);
    formData.append("tabId", activeTab.id);
    formData.append("uploadedBy", session?.user?.name || "Unknown");
    formData.append("uploadedByEmail", session?.user?.email || "");

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("/api/projectdocuments/files", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(result.message || "Files uploaded successfully!");
        setSelectedFiles([]);
        fetchDocuments();
      } else {
        setValidationError(result.error || "Upload failed");
        toast.error(result.error || "Failed to upload files");
      }
    } catch (err) {
      console.error(err);
      setValidationError("An error occurred during upload. Please try again.");
      toast.error("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/projectdocuments/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deleteTarget._id }),
      });

      if (res.ok) {
        toast.success("Document deleted successfully!");
        setDeleteTarget(null);
        fetchDocuments();
      } else {
        const result = await res.json();
        toast.error(result.error || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting document");
    } finally {
      setDeleting(false);
    }
  };

  const displayProjects = [...projects];
  if (selectedProject && !displayProjects.some((p) => p["project-wbs"] === selectedProject["project-wbs"])) {
    displayProjects.unshift(selectedProject);
  }

  const constraints = getTabConstraints(activeTab.id);

  return (
    <>
      <Head>
        <title>Project Documents</title>
      </Head>
      <div className="app-page min-h-screen flex flex-col">
        
        {/* Horizontal Tabs - Same style as Asset Masters */}
        <div className="w-full bg-app-surface border-b border-app-border flex justify-center px-2 sm:px-6 py-2 shrink-0">
          <nav className="flex flex-wrap items-center justify-center gap-1.5 max-w-7xl">
            {documentTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors text-[10px] md:text-xs font-medium ${
                    activeTab.id === tab.id
                      ? "bg-app-accent text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-app-surface-muted text-app-text-muted hover:bg-app-surface hover:text-app-text border border-app-border/50"
                  }`}
                >
                  <Icon size={12} className="shrink-0" />
                  <span className="whitespace-normal text-left leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-850 p-4 rounded-xl border border-app-border">
            <div>
              <h1 className="text-xl font-bold text-app-text flex items-center gap-2">
                <activeTab.icon className="text-app-accent" size={22} />
                {activeTab.label}
              </h1>
              <p className="text-xs text-app-text-muted mt-0.5">Manage and view your {activeTab.label.toLowerCase()} files</p>
            </div>

            {/* Searchable Combobox Project Selector */}
            <div className="relative w-full sm:w-80 z-30">
              <span className="block text-[10px] text-app-text-muted uppercase tracking-wider font-bold mb-1">Project Context</span>
              <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between bg-app-surface border border-app-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div className="truncate pr-2">
                  {loadingProjects ? (
                    <span className="text-xs text-app-text-muted">Loading projects...</span>
                  ) : selectedProject ? (
                    <span className="text-xs font-semibold text-app-accent">
                      {selectedProject["project-wbs"]} <span className="text-app-text-muted">- {selectedProject["project-name"]}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-app-text-muted">No project selected</span>
                  )}
                </div>
                <ChevronDown size={14} className="text-app-text-muted shrink-0" />
              </div>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                  <div className="absolute right-0 mt-1 w-full bg-app-surface border border-app-border rounded-lg shadow-2xl z-20 max-h-64 overflow-y-auto flex flex-col p-2">
                    <div className="relative mb-2 shrink-0">
                      <Search size={12} className="absolute left-2.5 top-2.5 text-app-text-muted" />
                      <input
                        type="text"
                        placeholder="Search WBS or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-app-bg border border-slate-850 rounded-md px-2 py-1.5 pl-8 text-xs text-app-text focus:outline-none focus:border-app-accent"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar max-h-48 divide-y divide-slate-850/50">
                      {displayProjects.length > 0 ? (
                        displayProjects.map((p) => (
                          <div
                            key={p["project-wbs"]}
                            onClick={() => {
                              setSelectedProject(p);
                              setIsOpen(false);
                              setSearchTerm("");
                            }}
                            className={`px-2.5 py-2 cursor-pointer hover:bg-app-surface/80 transition-colors text-left ${
                              selectedProject && selectedProject["project-wbs"] === p["project-wbs"]
                                ? "bg-app-accent/10 text-app-accent font-semibold"
                                : "text-app-text-secondary"
                            }`}
                          >
                            <div className="text-xs font-bold">{p["project-wbs"]}</div>
                            <div className="truncate text-[10px] text-app-text-muted mt-0.5">{p["project-name"]}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-app-text-muted p-3 text-center">No projects found</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Grid Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: File Upload Area */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-app-surface/40 border border-app-border rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-app-text-muted">Upload Files</h2>
                
                {/* Drag & Drop Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (selectedProject) setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    if (selectedProject && e.dataTransfer.files) {
                      handleFileSelection(Array.from(e.dataTransfer.files));
                    }
                  }}
                  onClick={() => {
                    if (selectedProject) {
                      fileInputRef.current?.click();
                    } else {
                      toast.info("Please select a project context first");
                    }
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                    !selectedProject
                      ? "border-slate-800 bg-app-surface/10 cursor-not-allowed opacity-50"
                      : isDragActive 
                        ? "border-app-accent bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer" 
                        : "border-slate-700 hover:border-slate-600 bg-app-surface-muted hover:bg-app-surface-muted cursor-pointer"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileSelection(Array.from(e.target.files));
                      }
                    }}
                    multiple
                    disabled={!selectedProject}
                    accept={constraints.accept}
                    className="hidden"
                  />
                  <UploadCloud size={30} className={isDragActive ? "text-app-accent animate-bounce" : "text-app-text-muted"} />
                  <span className="text-xs font-semibold text-app-text">
                    {!selectedProject ? "Select project to upload" : "Drag & drop files, or browse"}
                  </span>
                  <span className="text-[10px] text-app-text-muted max-w-[200px] leading-tight">
                    Accepts {constraints.allowedDesc} up to {constraints.maxSizeMB}MB
                  </span>
                </div>

                {/* Validation Error Messages */}
                {validationError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex gap-2 items-start text-[11px] text-rose-400">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Validation Failed</p>
                      <p className="mt-0.5 leading-relaxed break-words">{validationError}</p>
                    </div>
                  </div>
                )}

                {/* Selected Files Queue */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] uppercase font-bold text-app-text-muted tracking-wider">Selected Queue ({selectedFiles.length})</span>
                    <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-app-surface-muted/80 border border-app-border rounded px-2.5 py-1.5 text-xs">
                          <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                            <File size={12} className="text-app-accent shrink-0" />
                            <span className="truncate text-app-text-secondary font-medium">{file.name}</span>
                            <span className="text-[10px] text-app-text-muted shrink-0">({formatBytes(file.size)})</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeSelectedFile(idx)}
                            className="text-app-text-muted hover:text-rose-400 text-[10px] font-semibold transition-colors uppercase shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleUpload}
                      disabled={uploading || !selectedProject}
                      className="w-full mt-2 bg-app-accent hover:bg-app-accent-hover text-slate-950 font-bold py-2 rounded-lg text-xs shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      {uploading ? (
                        <>
                          <Loader size={12} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Documents"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Uploaded Documents Table */}
            <div className="lg:col-span-2 flex flex-col gap-4 h-full">
              <div className="bg-app-surface/40 border border-app-border rounded-xl p-5 shadow-lg flex-1 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-app-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-2">
                    Uploaded Documents
                    {!loadingDocs && selectedProject && (
                      <span className="bg-app-surface border border-app-border px-2 py-0.5 rounded-full text-[10px] text-app-accent">
                        {documents.length}
                      </span>
                    )}
                  </h2>
                  {loadingDocs && <Loader size={14} className="animate-spin text-app-accent" />}
                </div>

                {!selectedProject ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Info className="text-slate-600 mb-2" size={32} />
                    <h3 className="text-xs font-bold text-app-text-muted">No Project Context Selected</h3>
                    <p className="text-[11px] text-app-text-muted max-w-xs mt-1 leading-normal">
                      Please select a project from the dropdown at the top right of the page to view and upload files.
                    </p>
                  </div>
                ) : loadingDocs ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader size={20} className="animate-spin text-cyan-500 mx-auto mb-2" />
                      <span className="text-xs text-app-text-muted">Loading documents...</span>
                    </div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-850 rounded-lg bg-app-surface/10">
                    <FolderOpen size={32} className="text-slate-700 mb-2" />
                    <h3 className="text-xs font-bold text-app-text-muted">No Files Uploaded</h3>
                    <p className="text-[11px] text-app-text-muted max-w-xs mt-1 leading-normal">
                      No documents are currently uploaded for <strong>{activeTab.label}</strong> in this project.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full flex-1 custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-app-border text-app-text-muted font-semibold uppercase tracking-wider text-[9px]">
                          <th className="py-2 px-3">File Name</th>
                          <th className="py-2 px-3">Size</th>
                          <th className="py-2 px-3">Uploaded By</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {documents.map((doc) => (
                          <tr key={doc._id} className="hover:bg-slate-850/40 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2 max-w-[200px] md:max-w-[300px]">
                                <FileIcon ext={pathExt(doc.originalName)} className="shrink-0 text-app-accent/80" size={14} />
                                <a
                                  href={doc.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-app-text hover:text-app-accent transition-colors truncate text-xs"
                                  title={doc.originalName}
                                >
                                  {doc.originalName}
                                </a>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-app-text-muted whitespace-nowrap">{formatBytes(doc.fileSize)}</td>
                            <td className="py-2.5 px-3 text-app-text-secondary whitespace-nowrap">
                              <div className="font-medium text-app-text-secondary">{doc.uploadedBy}</div>
                              <div className="text-[9px] text-app-text-muted">{doc.uploadedByEmail}</div>
                            </td>
                            <td className="py-2.5 px-3 text-app-text-muted whitespace-nowrap">
                              {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex gap-1">
                                <a
                                  href={doc.filePath}
                                  download={doc.originalName}
                                  className="p-1 hover:bg-app-surface rounded text-app-text-muted hover:text-app-accent transition-all"
                                  title="Download"
                                >
                                  <Download size={13} />
                                </a>
                                <button
                                  onClick={() => setDeleteTarget(doc)}
                                  className="p-1 hover:bg-app-surface rounded text-app-text-muted hover:text-rose-400 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-app-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-surface border border-slate-850 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-app-text">Delete Document</h3>
                <p className="text-xs text-app-text-muted mt-1 leading-relaxed break-words">
                  Are you sure you want to delete <strong className="text-app-text">"{deleteTarget.originalName}"</strong>? This will permanently delete the file.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-3.5 py-1.5 bg-slate-850 hover:bg-app-surface border border-app-border text-app-text-secondary font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-lg shadow-rose-600/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader size={12} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete File"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
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
