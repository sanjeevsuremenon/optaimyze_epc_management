import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getSession } from "next-auth/react";
import {
  FiArrowLeft,
  FiCalendar,
  FiFolder,
  FiUser,
  FiInbox,
  FiExternalLink,
} from "react-icons/fi";

function formatDisplayDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectSchedulePage() {
  const router = useRouter();
  const { projnumber } = router.query;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [error, setError] = useState(null);

  const decodedProj = useMemo(() => {
    if (!projnumber) return "";
    try {
      return decodeURIComponent(String(projnumber));
    } catch {
      return String(projnumber);
    }
  }, [projnumber]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!decodedProj) {
      setLoading(false);
      setProject(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const encoded = encodeURIComponent(decodedProj);
        const [projRes, hierRes] = await Promise.all([
          fetch(`/api/projects?wbs=${encoded}`),
          fetch(`/api/projects/hierarchy?projectWbs=${encoded}`).catch(() => null),
        ]);

        const projJson = projRes.ok ? await projRes.json() : null;
        setProject(projJson && projJson["project-wbs"] ? projJson : null);

        if (hierRes && hierRes.ok) {
          const hierJson = await hierRes.json();
          setNetworks(hierJson?.networks || []);
        } else {
          setNetworks([]);
        }
      } catch (err) {
        console.error("Failed to load project schedule:", err);
        setError("Unable to load project details.");
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router.isReady, decodedProj]);

  return (
    <div className="app-page min-h-screen font-[Poppins,sans-serif]">
      <Head>
        <title>
          {decodedProj ? `Project Schedule · ${decodedProj}` : "Project Schedule"}
        </title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() => router.push("/projectdetails")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-app-accent hover:text-app-accent-hover mb-6"
        >
          <FiArrowLeft />
          Back to projects
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-app-text tracking-tight flex items-center gap-3">
            <FiCalendar className="text-app-accent" />
            Project Schedule
          </h1>
          <p className="text-app-text-muted mt-2">
            Contractual timeline and summary for{" "}
            <span className="font-semibold text-app-text">{decodedProj || "…"}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-accent" />
          </div>
        ) : error ? (
          <div className="bg-app-surface border border-app-border rounded-2xl p-10 text-center">
            <p className="text-rose-500 font-medium">{error}</p>
          </div>
        ) : !project ? (
          <div className="bg-app-surface border border-app-border rounded-2xl p-12 text-center shadow-sm">
            <FiInbox className="mx-auto h-14 w-14 text-app-text-disabled mb-4" />
            <h2 className="text-xl font-bold text-app-text mb-2">No data</h2>
            <p className="text-app-text-muted max-w-md mx-auto">
              No project record was found for WBS{" "}
              <span className="font-semibold text-app-text">{decodedProj}</span>.
              Add or update the project under Projects, then return here.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => router.push("/projects")}
                className="app-btn-primary"
              >
                Go to Projects
              </button>
              <button
                type="button"
                onClick={() => router.push("/projectdetails")}
                className="app-btn-secondary"
              >
                Back to list
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-app-surface border border-app-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-app-accent bg-app-accent-soft px-2.5 py-1 rounded-full">
                    <FiFolder className="w-3.5 h-3.5" />
                    {project["project-wbs"]}
                  </span>
                  <h2 className="text-2xl font-bold text-app-text mt-3">
                    {project["project-name"] || "Untitled project"}
                  </h2>
                  <p className="text-sm text-app-text-muted mt-2 inline-flex items-center gap-1.5">
                    <FiUser className="w-4 h-4" />
                    Incharge:{" "}
                    <span className="font-semibold text-app-text">
                      {project["project-incharge"] || "—"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `/projects1?project=${encodeURIComponent(project["project-wbs"])}`,
                      "_blank"
                    )
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-app-border bg-app-surface-muted text-app-text hover:border-app-accent hover:text-app-accent transition-colors"
                >
                  <FiExternalLink />
                  Open PO list
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-app-border bg-app-surface-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1">
                    Start Date
                  </p>
                  <p className="text-lg font-bold text-app-text">
                    {formatDisplayDate(project["start-date"])}
                  </p>
                  <p className="text-[11px] text-app-text-disabled mt-1">Estimated / contractual</p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-surface-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1">
                    End Date
                  </p>
                  <p className="text-lg font-bold text-app-text">
                    {formatDisplayDate(project["finished-date"])}
                  </p>
                  <p className="text-[11px] text-app-text-disabled mt-1">Estimated / contractual</p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-surface-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1">
                    Created
                  </p>
                  <p className="text-lg font-bold text-app-text">
                    {formatDisplayDate(project["created-date"])}
                  </p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-surface-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-1">
                    Last Changed
                  </p>
                  <p className="text-lg font-bold text-app-text">
                    {formatDisplayDate(project["changed-date"])}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-app-surface border border-app-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-app-text mb-4">Linked Networks</h3>
              {networks.length === 0 ? (
                <div className="text-center py-10 text-app-text-muted">
                  <FiInbox className="mx-auto h-10 w-10 text-app-text-disabled mb-3" />
                  <p className="font-medium text-app-text">No data</p>
                  <p className="text-sm mt-1">No networks are linked to this project yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-app-border">
                  <table className="w-full text-sm">
                    <thead className="bg-app-surface-muted text-app-text-secondary text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Network</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Created By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {networks.map((net) => (
                        <tr key={net._id || net["network-num"]} className="hover:bg-app-surface-muted/50">
                          <td className="px-4 py-3 font-semibold text-app-accent">
                            {net["network-num"]}
                          </td>
                          <td className="px-4 py-3 text-app-text">{net["project-name"] || "—"}</td>
                          <td className="px-4 py-3 text-app-text-muted">{net["created-by"] || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
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
  return { props: { session } };
}
