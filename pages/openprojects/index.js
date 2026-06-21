import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Tablecomponent, {
  SelectColumnFilter,
  Boldstyle1,
  Boldstyle2,
  Boldstyle3,
  Boldstyle4,
  Numberstyle,
} from "../../components/Tablecomponent";
import { FiArrowUp, FiArrowDown, FiFolder, FiShoppingCart, FiTrendingUp, FiList } from 'react-icons/fi';

function OpenProjects() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projectsData, setProjectsData] = useState([]);
  const [totals, setTotals] = useState({
    totalProjects: 0,
    totalPOs: 0,
    totalPOValue: 0,
    totalOpenValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'totalOpenValue',
    direction: 'desc'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/openprojects');
        const data = await response.json();
        
        if (data.projects && data.totals) {
          setProjectsData(data.projects);
          setTotals(data.totals);
        }
      } catch (error) {
        console.error('Error fetching open projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort projects based on current sort configuration
  const sortedProjects = useMemo(() => {
    let sortableItems = [...projectsData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string values
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [projectsData, sortConfig]);

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle project click - navigate to project purchase timelines
  const handleProjectClick = (projectId) => {
    if (!projectId || projectId === "unassigned") {
      router.push(`/projectpurchasetimelines/unassigned`);
    } else {
      router.push(`/projectpurchasetimelines/${encodeURIComponent(projectId)}`);
    }
  };

  // Handle view PO timelines click - open in new tab
  const handleViewPOTimelines = (projectId) => {
    const targetId = (!projectId || projectId === "unassigned") ? "unassigned" : projectId;
    const url = `/projectpurchasetimelines/${encodeURIComponent(targetId)}`;
    window.open(url, '_blank');
  };

  // Handle view PO list click - open in new tab
  const handleViewPOList = (projectId) => {
    const targetId = (!projectId || projectId === "unassigned") ? "unassigned" : projectId;
    const url = `/projects1?project=${encodeURIComponent(targetId)}`;
    window.open(url, '_blank');
  };

  const columns = useMemo(
    () => [
      {
        Header: () => (
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => requestSort('projectName')}
          >
            Project Name
            <SortIndicator columnKey="projectName" />
          </div>
        ),
        accessor: 'projectName',
        Cell: ({ row }) => (
          <div 
            className="font-semibold text-app-accent hover:text-app-accent cursor-pointer"
            onClick={() => handleProjectClick(row.original.projectId)}
          >
            {row.original.projectId === "unassigned" 
              ? "Unassigned POs (Cost Center, Order, etc.)" 
              : row.original.projectName || row.original.projectWbs || row.original.projectId || "Unassigned"}
          </div>
        ),
        Filter: SelectColumnFilter,
      },
      {
        Header: () => (
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => requestSort('projectWbs')}
          >
            Project WBS
            <SortIndicator columnKey="projectWbs" />
          </div>
        ),
        accessor: 'projectWbs',
        Cell: ({ row, value }) => <span className="font-semibold text-sm text-app-text">{row.original.projectId === "unassigned" ? "N/A" : value || "Unassigned"}</span>,
      },
      {
        Header: () => (
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => requestSort('openPOCount')}
          >
            Open PO Count
            <SortIndicator columnKey="openPOCount" />
          </div>
        ),
        accessor: 'openPOCount',
        Cell: ({ value }) => (
          <div className="text-center font-semibold text-app-text">
            {value || 0}
          </div>
        ),
      },
      {
        Header: () => (
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => requestSort('totalPOValue')}
          >
            Total PO Value (SAR)
            <SortIndicator columnKey="totalPOValue" />
          </div>
        ),
        accessor: 'totalPOValue',
        Cell: ({ value }) => (
          <div className="text-right font-semibold text-app-text">
            {formatNumber(value)}
          </div>
        ),
      },
      {
        Header: () => (
          <div 
            className="cursor-pointer flex items-center text-xs uppercase tracking-wider text-app-text-muted font-bold"
            onClick={() => requestSort('totalOpenValue')}
          >
            Open PO Balance (SAR)
            <SortIndicator columnKey="totalOpenValue" />
          </div>
        ),
        accessor: 'totalOpenValue',
        Cell: ({ value }) => (
          <div className="text-right font-bold text-rose-400 bg-rose-900/30 px-3 py-1 rounded-md inline-block min-w-[100px]">
            {formatNumber(value)}
          </div>
        ),
      },
      {
        Header: () => <div className="text-xs uppercase tracking-wider text-app-text-muted font-bold text-center">Actions</div>,
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleViewPOTimelines(row.original.projectId)}
              className="bg-app-surface hover:bg-app-surface-muted border border-app-border text-app-accent hover:text-app-accent transition-all duration-200 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm hover:shadow flex items-center whitespace-nowrap"
            >
              <FiTrendingUp className="mr-1.5" />
              View PO timelines
            </button>
            <button
              onClick={() => handleViewPOList(row.original.projectId)}
              className="bg-app-accent hover:bg-app-accent-hover text-slate-900 transition-all duration-200 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm hover:shadow flex items-center whitespace-nowrap"
            >
              <FiList className="mr-1.5" />
              View PO list
            </button>
          </div>
        ),
      },
    ],
    [sortConfig]
  );

  if (loading) {
    return (
      <>
        <div className="app-page min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent mx-auto"></div>
            <p className="mt-4 text-app-text-muted">Loading open projects...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app-page min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header Stats */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h1 className="text-4xl font-extrabold text-app-text mb-2 flex items-center tracking-tight">
                  <FiFolder className="mr-3 text-app-accent drop-shadow-sm" />
                  Projects with Open POs
                </h1>
                <p className="text-app-text-muted font-medium ml-1 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-app-accent mr-2 animate-pulse"></span>
                  Overview of all active projects and their purchase orders
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Projects Card */}
              <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg hover:border-app-accent/50 transition-all duration-300 p-6 flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-app-accent/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-sm font-semibold text-app-text-muted uppercase tracking-wider mb-1">Open Projects</p>
                    <p className="text-3xl font-bold text-app-text tracking-tight">
                      {totals.totalProjects}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-900/30 text-app-accent rounded-xl group-hover:bg-app-accent group-hover:text-slate-900 transition-colors duration-300 shadow-sm">
                    <FiFolder className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-app-accent bg-cyan-900/30 rounded-lg px-2 py-1 w-fit">
                  <span>Active Workspaces</span>
                </div>
              </div>

              {/* Total POs Card */}
              <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg hover:border-emerald-500/50 transition-all duration-300 p-6 flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-sm font-semibold text-app-text-muted uppercase tracking-wider mb-1">Total Open POs</p>
                    <p className="text-3xl font-bold text-app-text tracking-tight">
                      {totals.totalPOs}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors duration-300 shadow-sm">
                    <FiShoppingCart className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-400 bg-emerald-900/30 rounded-lg px-2 py-1 w-fit">
                  <span>Pending Deliveries</span>
                </div>
              </div>

              {/* Total PO Value Card */}
              <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg hover:border-purple-500/50 transition-all duration-300 p-6 flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-sm font-semibold text-app-text-muted uppercase tracking-wider mb-1">Total PO Value</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-app-text-muted">SAR</span>
                      <p className="text-2xl font-bold text-app-text tracking-tight">
                        {formatNumber(totals.totalPOValue)}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-900/30 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-slate-900 transition-colors duration-300 shadow-sm">
                    <FiTrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-purple-400 bg-purple-900/30 rounded-lg px-2 py-1 w-fit">
                  <span>Committed Budget</span>
                </div>
              </div>

              {/* Open Balance Card */}
              <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg hover:border-rose-500/50 transition-all duration-300 p-6 flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-sm font-semibold text-app-text-muted uppercase tracking-wider mb-1">Open Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-rose-400">SAR</span>
                      <p className="text-2xl font-bold text-rose-400 tracking-tight">
                        {formatNumber(totals.totalOpenValue)}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-900/30 text-rose-400 rounded-xl group-hover:bg-rose-500 group-hover:text-slate-900 transition-colors duration-300 shadow-sm">
                    <FiTrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-rose-400 bg-rose-900/30 rounded-lg px-2 py-1 w-fit">
                  <span>Remaining to be Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-app-border bg-app-surface-muted flex justify-between items-center">
              <h2 className="text-lg font-bold text-app-text flex items-center">
                <div className="w-1.5 h-6 bg-app-accent rounded-full mr-3"></div>
                Project Details
              </h2>
            </div>
            <div className="p-6">
              {projectsData.length === 0 ? (
                <div className="text-center py-16 text-app-text-muted flex flex-col items-center">
                  <FiFolder className="h-16 w-16 text-slate-700 mb-4" />
                  <p className="text-lg font-medium">No projects with open purchase orders found.</p>
                  <p className="text-sm text-app-text-muted mt-1">Check back later or adjust your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <Tablecomponent columns={columns} data={sortedProjects} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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
