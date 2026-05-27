import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";

import { getSession } from "next-auth/react";

import Tablecomponent, {
  SelectColumnFilter,
  Boldstyle3,
  Boldstyle4,
  Datestyle,
} from "../../components/Tablecomponent";

export default function Projectdetails({ initialProjects = [], session }) {
  const router = useRouter();
  const [projectlist, setProjectlist] = useState(initialProjects || []);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [viewMode, setViewMode] = useState('table');

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleEdit = (projWbs) => {
    router.push(`/projectdetails/projectsch?projnumber=${encodeURIComponent(projWbs)}`);
  };

  const columns = useMemo(
    () => [
      {
        Header: "Project Number",
        accessor: "project-wbs",
        Cell: Boldstyle3,
        Filter: SelectColumnFilter,
      },
      {
        Header: "Project Name",
        accessor: "project-name",
        Cell: Boldstyle4,
        Filter: SelectColumnFilter,
      },
      {
        Header: "Project Manager",
        accessor: "project-incharge",
        Filter: SelectColumnFilter,
        Cell: Boldstyle3,
      },
      {
        Header: "Start Date",
        accessor: "start-date",
        Cell: Datestyle,
      },
      {
        Header: "Finish Date",
        accessor: "finished-date",
        Cell: Datestyle,
      },
      {
        Header: "Action",
        accessor: "action",
        Cell: ({ row }) => (
          <div className="inline-flex">
            <button
              onClick={() => handleEdit(row.original["project-wbs"])}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-3 py-1 rounded-md text-sm font-semibold shadow-sm"
            >
              View Schedule
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    if (!debounced) return projectlist;
    return projectlist.filter((p) => {
      const s = debounced;
      return (
        (p["project-wbs"] || "").toLowerCase().includes(s) ||
        (p["project-name"] || "").toLowerCase().includes(s) ||
        (p["project-incharge"] || "").toLowerCase().includes(s)
      );
    });
  }, [projectlist, debounced]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-1">Master list of all projects in the system</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, WBS or manager"
              className="bg-slate-900/70 placeholder:text-slate-400 text-slate-100 px-3 py-2 rounded-md border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800/70 text-slate-200 px-3 py-2 rounded-md hover:bg-slate-800/90"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-lg">
            <Tablecomponent 
              columns={columns} 
              data={filtered}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              enablePagination={true}
            />
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

  // fetch project data server-side to avoid an extra client request
  try {
    const proto = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host;
    const res = await fetch(`${proto}://${host}/api/projects/projectdetails`);
    const projects = await res.json();
    return { props: { initialProjects: projects, session } };
  } catch (e) {
    return { props: { initialProjects: [], session } };
  }
}
