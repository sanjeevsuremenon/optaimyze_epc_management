import React, { useState, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  FiArrowUp,
  FiArrowDown,
  FiFolder,
  FiShoppingCart,
  FiTrendingUp,
  FiList,
} from "react-icons/fi";

function OpenProjects() {
  const router = useRouter();
  const [projectsData, setProjectsData] = useState([]);
  const [totals, setTotals] = useState({
    totalProjects: 0,
    totalPOs: 0,
    totalPOValue: 0,
    totalOpenValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nameFilter, setNameFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "totalOpenValue",
    direction: "desc",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/openprojects");
        const data = await response.json();

        if (data.projects && data.totals) {
          setProjectsData(data.projects);
          setTotals(data.totals);
        }
      } catch (error) {
        console.error("Error fetching open projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const projectNameOptions = useMemo(() => {
    const names = new Set();
    projectsData.forEach((p) => {
      const label =
        p.projectId === "unassigned"
          ? "Unassigned POs"
          : p.projectName || p.projectWbs || p.projectId || "Unassigned";
      names.add(label);
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [projectsData]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectsData.filter((p) => {
      const label =
        p.projectId === "unassigned"
          ? "Unassigned POs"
          : p.projectName || p.projectWbs || p.projectId || "Unassigned";

      if (nameFilter !== "all" && label !== nameFilter) return false;
      if (!q) return true;

      return (
        label.toLowerCase().includes(q) ||
        String(p.projectWbs || "").toLowerCase().includes(q) ||
        String(p.projectId || "").toLowerCase().includes(q)
      );
    });
  }, [projectsData, search, nameFilter]);

  const sortedProjects = useMemo(() => {
    const items = [...filteredProjects];
    if (!sortConfig.key) return items;

    items.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      aValue = String(aValue ?? "").toLowerCase();
      bValue = String(bValue ?? "").toLowerCase();
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredProjects, sortConfig]);

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? (
      <FiArrowUp className="inline ml-1" />
    ) : (
      <FiArrowDown className="inline ml-1" />
    );
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleProjectClick = (projectId) => {
    if (!projectId || projectId === "unassigned") {
      router.push(`/projectpurchasetimelines/unassigned`);
    } else {
      router.push(`/projectpurchasetimelines/${encodeURIComponent(projectId)}`);
    }
  };

  const handleViewPOTimelines = (projectId) => {
    const targetId = !projectId || projectId === "unassigned" ? "unassigned" : projectId;
    window.open(`/projectpurchasetimelines/${encodeURIComponent(targetId)}`, "_blank");
  };

  const handleViewPOList = (projectId) => {
    const targetId = !projectId || projectId === "unassigned" ? "unassigned" : projectId;
    window.open(`/projects1?project=${encodeURIComponent(targetId)}`, "_blank");
  };

  const displayName = (p) =>
    p.projectId === "unassigned"
      ? "Unassigned POs (Cost Center, Order, etc.)"
      : p.projectName || p.projectWbs || p.projectId || "Unassigned";

  if (loading) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent mx-auto" />
          <p className="mt-4 text-app-text-muted">Loading open projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen py-10 font-[Poppins,sans-serif]">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-app-text mb-2 flex items-center tracking-tight">
                <FiFolder className="mr-3 text-app-accent" />
                Projects with Open POs
              </h1>
              <p className="text-app-text-muted font-medium ml-1 flex items-center">
                <span className="w-2 h-2 rounded-full bg-app-accent mr-2" />
                Overview of all active projects and their purchase orders
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-1">
                    Open Projects
                  </p>
                  <p className="text-3xl font-bold text-app-text tracking-tight">
                    {totals.totalProjects}
                  </p>
                </div>
                <div className="p-3 bg-app-accent-soft text-app-accent rounded-xl">
                  <FiFolder className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-1">
                    Total Open POs
                  </p>
                  <p className="text-3xl font-bold text-app-text tracking-tight">{totals.totalPOs}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FiShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-1">
                    Total PO Value
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-app-text-muted">SAR</span>
                    <p className="text-2xl font-bold text-app-text tracking-tight">
                      {formatNumber(totals.totalPOValue)}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                  <FiTrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-1">
                    Open Balance
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-rose-500">SAR</span>
                    <p className="text-2xl font-bold text-rose-500 tracking-tight">
                      {formatNumber(totals.totalOpenValue)}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                  <FiTrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-app-border bg-app-surface-muted/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-app-text flex items-center">
              <div className="w-1.5 h-6 bg-app-accent rounded-full mr-3" />
              Project Details
            </h2>
            <span className="text-sm text-app-text-muted">
              {sortedProjects.length} of {projectsData.length} shown
            </span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-5 flex flex-col sm:flex-row gap-3 sm:items-end">
              <label className="flex-1 min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1.5">
                  Search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search in ${projectsData.length} records`}
                  className="w-full px-3 py-2.5 rounded-lg border border-app-border bg-app-bg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent"
                />
              </label>
              <label className="sm:w-64">
                <span className="block text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1.5">
                  Project Name
                </span>
                <select
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-app-border bg-app-bg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent"
                >
                  <option value="all">All</option>
                  {projectNameOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sortedProjects.length === 0 ? (
              <div className="text-center py-16 text-app-text-muted flex flex-col items-center">
                <FiFolder className="h-14 w-14 text-app-text-disabled mb-4" />
                <p className="text-lg font-medium text-app-text">No data</p>
                <p className="text-sm mt-1">
                  {projectsData.length === 0
                    ? "No projects with open purchase orders found."
                    : "No projects match your current filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-app-border">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-app-surface-muted">
                    <tr>
                      {[
                        { key: "projectName", label: "Project Name", align: "left" },
                        { key: "projectWbs", label: "Project WBS", align: "left" },
                        { key: "openPOCount", label: "Open PO Count", align: "center" },
                        { key: "totalPOValue", label: "Total PO Value (SAR)", align: "right" },
                        { key: "totalOpenValue", label: "Open PO Balance (SAR)", align: "right" },
                        { key: null, label: "Actions", align: "center" },
                      ].map((col) => (
                        <th
                          key={col.label}
                          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-app-text-secondary ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left"
                          }`}
                        >
                          {col.key ? (
                            <button
                              type="button"
                              onClick={() => requestSort(col.key)}
                              className="inline-flex items-center gap-0.5 hover:text-app-accent transition-colors"
                            >
                              {col.label}
                              <SortIndicator columnKey={col.key} />
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border bg-app-surface">
                    {sortedProjects.map((p) => (
                      <tr key={p.projectId} className="hover:bg-app-surface-muted/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleProjectClick(p.projectId)}
                            className="font-semibold text-app-accent hover:underline text-left"
                          >
                            {displayName(p)}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-app-text">
                          {p.projectId === "unassigned" ? "N/A" : p.projectWbs || p.projectId || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-app-text">
                          {p.openPOCount || 0}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-app-text">
                          {formatNumber(p.totalPOValue)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-block min-w-[100px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-md">
                            {formatNumber(p.totalOpenValue)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2 justify-center flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleViewPOTimelines(p.projectId)}
                              className="bg-app-surface border border-app-border text-app-accent hover:bg-app-accent-soft transition-colors text-xs font-semibold py-1.5 px-3 rounded-lg inline-flex items-center whitespace-nowrap"
                            >
                              <FiTrendingUp className="mr-1.5" />
                              View PO timelines
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewPOList(p.projectId)}
                              className="bg-app-accent hover:bg-app-accent-hover text-app-accent-text transition-colors text-xs font-semibold py-1.5 px-3 rounded-lg inline-flex items-center whitespace-nowrap"
                            >
                              <FiList className="mr-1.5" />
                              View PO list
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
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default OpenProjects;
