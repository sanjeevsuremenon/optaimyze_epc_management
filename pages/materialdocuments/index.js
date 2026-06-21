import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { FiSearch, FiX, FiFileText, FiFilter } from "react-icons/fi";
import Matdocument from "./Matdocument";

function Matdocs() {
  const { ref, inView } = useInView();
  const LIMIT = 100;
  
  const [filters, setFilters] = useState({
    po: "",
    matCode: "",
    desc: "",
    wbs: ""
  });
  
  const [activeFilters, setActiveFilters] = useState({
    po: "",
    matCode: "",
    desc: "",
    wbs: ""
  });

  // Fetch material documents based on active filters
  const fetchMatdocs = async (page) => {
    let url = `/api/materialdocuments?limit=${LIMIT}&page=${page}`;
    
    if (activeFilters.po) url += `&po=${encodeURIComponent(activeFilters.po)}`;
    if (activeFilters.matCode) url += `&matCode=${encodeURIComponent(activeFilters.matCode)}`;
    if (activeFilters.desc) url += `&desc=${encodeURIComponent(activeFilters.desc)}`;
    if (activeFilters.wbs) url += `&wbs=${encodeURIComponent(activeFilters.wbs)}`;
    
    const response = await fetch(url);
    const json = await response.json();
    return json;
  };

  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["matdocs", activeFilters],
      queryFn: ({ pageParam = 1 }) => fetchMatdocs(pageParam),
      getNextPageParam: (lastPage, allPages) => {
        return lastPage?.length === LIMIT ? allPages.length + 1 : undefined;
      },
      staleTime: 60000,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
  };

  const handleClearFilters = () => {
    const emptyFilters = { po: "", matCode: "", desc: "", wbs: "" };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== "");

  const content =
    isSuccess &&
    data.pages.map((page, i) =>
      page.map((matdoc, j) => {
        if (page.length === j + 1) {
          return <Matdocument ref={ref} key={matdoc._id} matdoc={matdoc} />;
        }
        return <Matdocument key={matdoc._id} matdoc={matdoc} />;
      })
    );

  return (
    <div className="app-page min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center mb-6">
            <div className="w-1.5 h-8 bg-app-accent rounded-full mr-4"></div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Material Documents</h1>
          </div>
          
          {/* Multi-Field Filter Panel */}
          <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4 text-app-accent">
              <FiFilter className="mr-2" />
              <h2 className="font-semibold">Search Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-app-text-muted mb-1 uppercase tracking-wider">PO Number</label>
                <input
                  type="text"
                  name="po"
                  placeholder="e.g. 4500001234"
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text placeholder-app-text-disabled transition-colors"
                  value={filters.po}
                  onChange={handleFilterChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-app-text-muted mb-1 uppercase tracking-wider">Material Code</label>
                <input
                  type="text"
                  name="matCode"
                  placeholder="e.g. 10002345"
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text placeholder-app-text-disabled transition-colors"
                  value={filters.matCode}
                  onChange={handleFilterChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-app-text-muted mb-1 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  name="desc"
                  placeholder="e.g. porta cabin"
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text placeholder-app-text-disabled transition-colors"
                  value={filters.desc}
                  onChange={handleFilterChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-app-text-muted mb-1 uppercase tracking-wider">Project / WBS</label>
                <input
                  type="text"
                  name="wbs"
                  placeholder="e.g. PRJ-2023"
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text placeholder-app-text-disabled transition-colors"
                  value={filters.wbs}
                  onChange={handleFilterChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 text-sm font-semibold text-app-text-secondary bg-app-surface hover:bg-app-surface-muted rounded-lg transition-colors flex items-center border border-app-border hover:border-slate-600"
              >
                <FiX className="mr-2" /> Clear
              </button>
              <button
                onClick={applyFilters}
                className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center"
              >
                <FiSearch className="mr-2" /> Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg transition-all duration-300 overflow-hidden flex-1 flex flex-col relative">
          {hasActiveFilters && (
            <div className="px-6 py-3 bg-cyan-900/30 border-b border-cyan-800/50 flex items-center">
              <span className="text-sm text-cyan-200">
                Filters applied. Showing exact matches.
              </span>
            </div>
          )}
          <div className="flex-1">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-app-surface/80 sticky top-0 border-b border-app-border z-10 backdrop-blur-sm">
                <tr>
                  <th className="w-[10%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Doc #</th>
                  <th className="w-[6%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Item</th>
                  <th className="w-[10%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Date</th>
                  <th className="w-[10%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Material</th>
                  <th className="w-[20%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Description</th>
                  <th className="w-[8%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Qty</th>
                  <th className="w-[10%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Amount (SAR)</th>
                  <th className="w-[14%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Plant / SLoc / Mvt</th>
                  <th className="w-[12%] px-4 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Account</th>
                </tr>
              </thead>
              <tbody>
                {content}
              </tbody>
            </table>
            
            {/* Empty State */}
            {isSuccess && data?.pages?.[0]?.length === 0 && (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <FiFileText className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-app-text-secondary mb-2">No documents found</h3>
                <p className="text-sm text-app-text-muted max-w-sm">
                  We couldn't find any material documents matching your active filters. Try clearing some criteria.
                </p>
              </div>
            )}
          </div>
          
          {/* Loading Indicator */}
          {isFetchingNextPage && (
            <div className="p-4 border-t border-app-border bg-app-surface-muted flex justify-center">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-app-accent border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-app-accent font-medium">Loading more documents...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
  return { props: { session } };
}

export default Matdocs;
