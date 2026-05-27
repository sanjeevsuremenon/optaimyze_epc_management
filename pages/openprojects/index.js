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
import { FiArrowUp, FiArrowDown, FiFolder, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';

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
    router.push(`/projectpurchasetimelines/${encodeURIComponent(projectId)}`);
  };

  // Handle view POs click - open in new tab
  const handleViewPOs = (projectId) => {
    const url = `/projectpurchasetimelines/${encodeURIComponent(projectId)}`;
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
            className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => handleProjectClick(row.original.projectId)}
          >
            {row.original.projectName || row.original.projectWbs || row.original.projectId}
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
        Cell: Boldstyle3,
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
          <div className="text-center font-semibold text-gray-700">
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
          <div className="text-right font-semibold text-gray-800">
            {formatNumber(value)}
          </div>
        ),
      },
      {
        Header: () => (
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => requestSort('totalOpenValue')}
          >
            Open PO Balance (SAR)
            <SortIndicator columnKey="totalOpenValue" />
          </div>
        ),
        accessor: 'totalOpenValue',
        Cell: ({ value }) => (
          <div className="text-right font-bold text-red-600">
            {formatNumber(value)}
          </div>
        ),
      },
      {
        Header: "Actions",
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPOs(row.original.projectId)}
              className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded"
            >
              View POs
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
        <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading open projects...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Stats */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <FiFolder className="mr-3 text-blue-600" />
              Projects with Open Purchase Orders
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Projects Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Projects</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {totals.totalProjects}
                    </p>
                  </div>
                  <FiFolder className="h-10 w-10 text-blue-500" />
                </div>
              </div>

              {/* Total POs Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Open POs</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {totals.totalPOs}
                    </p>
                  </div>
                  <FiShoppingCart className="h-10 w-10 text-green-500" />
                </div>
              </div>

              {/* Total PO Value Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total PO Value</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">
                      {formatNumber(totals.totalPOValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">SAR</p>
                  </div>
                  <FiTrendingUp className="h-10 w-10 text-purple-500" />
                </div>
              </div>

              {/* Open Balance Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Balance</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {formatNumber(totals.totalOpenValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">SAR</p>
                  </div>
                  <FiTrendingUp className="h-10 w-10 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Projects List
            </h2>
            {projectsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No projects with open purchase orders found.
              </div>
            ) : (
              <Tablecomponent columns={columns} data={sortedProjects} />
            )}
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
