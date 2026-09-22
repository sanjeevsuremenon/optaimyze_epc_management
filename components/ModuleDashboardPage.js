import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArrowRight, Sparkles, Upload, Download, Home } from "lucide-react";
import { moduleDashboards } from "./moduleData";
import { GlassStyles, Tilt } from "./landing/glass";

const ACCENTS = ["cyan", "emerald", "violet", "amber", "sky", "indigo", "rose"];
const MODULE_ACCENTS = {
  projects: "cyan",
  materials: "emerald",
  stock: "sky",
  purchaseorders: "amber",
  vendors: "violet",
  projectdocumentss: "indigo",
  assets: "rose",
  globalmasters: "cyan",
  tracking: "emerald",
  reports: "violet",
  networks: "sky",
  wbs: "indigo",
  materialgroups: "amber",
  mattypes: "rose",
};
const ACCENT_TEXT = {
  cyan: "text-cyan-600 dark:text-cyan-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  rose: "text-rose-600 dark:text-rose-400",
};
const ACCENT_CHIP = {
  cyan: "bg-cyan-500/10 border-cyan-500/20",
  emerald: "bg-emerald-500/10 border-emerald-500/20",
  violet: "bg-violet-500/10 border-violet-500/20",
  amber: "bg-amber-500/10 border-amber-500/20",
  sky: "bg-sky-500/10 border-sky-500/20",
  indigo: "bg-indigo-500/10 border-indigo-500/20",
  rose: "bg-rose-500/10 border-rose-500/20",
};
const ACCENT_BLOB = {
  cyan: "bg-cyan-400/20 dark:bg-cyan-500/15",
  emerald: "bg-emerald-400/20 dark:bg-emerald-500/15",
  violet: "bg-violet-400/20 dark:bg-violet-500/15",
  amber: "bg-amber-400/20 dark:bg-amber-500/15",
  sky: "bg-sky-400/20 dark:bg-sky-500/15",
  indigo: "bg-indigo-400/20 dark:bg-indigo-500/15",
  rose: "bg-rose-400/20 dark:bg-rose-500/15",
};

const parseCSV = (text) => {
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const row = [];
    let inQuotes = false;
    let currentToken = '';
    for (let charIndex = 0; charIndex < lines[i].length; charIndex++) {
      const char = lines[i][charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentToken.trim().replace(/^["']|["']$/g, ''));
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    row.push(currentToken.trim().replace(/^["']|["']$/g, ''));

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

export default function ModuleDashboardPage({ currentModuleKey }) {
  const { data: session } = useSession();
  const currentModule = moduleDashboards[currentModuleKey];
  const [uploadStatus, setUploadStatus] = useState(null);
  const [chips, setChips] = useState(null);

  const accent = MODULE_ACCENTS[currentModuleKey] || "cyan";

  useEffect(() => {
    if (!currentModuleKey) return;
    let cancelled = false;
    fetch(`/api/dashboard/stats?module=${encodeURIComponent(currentModuleKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setChips(data.stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentModuleKey]);

  if (!currentModule) return null;

  const handleDownloadTemplate = () => {
    if (!currentModule.uploadFields) return;
    const headerRow = currentModule.uploadFields.join(",");
    let sampleRow = "";
    if (currentModuleKey === "projects") {
      sampleRow = "\nIS/GP.20.009,5800000546 RENOVATION OF CONFERANCE ROOM,Ahmed Ghaith,2020-03-07,2021-12-13,2020-02-20,2020-06-27";
    } else if (currentModuleKey === "networks") {
      sampleRow = "\n4004616,IS/GP.20.005,PO 4801764366 /4801764368 / 4801765063,2020-02-29,242";
    } else if (currentModuleKey === "wbs") {
      sampleRow = "\nIS/GP.21.038.01,MATERIALS,2026-06-25";
    } else if (currentModuleKey === "materials") {
      sampleRow = '\n11000208,M,IM01,EA,ANANZ0069,"BACK PANEL PC BOARD,TELEDYNE,D65295A","BACK PANEL PC BOARD,TELEDYNE,D65295A",A.RAGAB,20000020';
    } else if (currentModuleKey === "materialgroups") {
      sampleRow = "\nPROJECT SIGNBOARDS,PROJECT SIGNBOARDS AND OTHER SUBSTATION MARKINGS,6784d4fe3d38bfe045b0e861";
    } else if (currentModuleKey === "mattypes") {
      sampleRow = "\nCivil Materials,Civil building earthwork materials,false";
    }
    const csvContent = "data:text/csv;charset=utf-8," + headerRow + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentModuleKey}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedData = parseCSV(text);
      if (parsedData.length === 0) {
        setUploadStatus({ success: false, message: "The CSV file is empty or invalid." });
        return;
      }

      setUploadStatus({ success: true, message: `Uploading ${parsedData.length} records...` });

      try {
        const res = await fetch(`/api/data-load/${currentModule.key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, data: parsedData })
        });
        const result = await res.json();
        if (res.ok) {
          setUploadStatus({
            success: true,
            message: `Successfully uploaded ${result.matchedCount + result.upsertedCount} records.`
          });
        } else {
          setUploadStatus({ success: false, message: result.error || "Upload failed." });
        }
      } catch (err) {
        setUploadStatus({ success: false, message: err.message || "Failed to upload." });
      }
    };
    reader.readAsText(file);
  };

  const sublinks = currentModule.sublinks
    ? currentModule.sublinks.filter((link) => !link.adminOnly || session?.user?.role === "admin")
    : [];

  return (
    <>
      <Head>
        <title>{currentModule.label} Dashboard | OPTAIMYZE Portal</title>
        <meta
          name="description"
          content={`Access dashboards and sub-modules for ${currentModule.label}.`}
        />
      </Head>

      <div className="landing-root relative overflow-hidden">
        <GlassStyles />

        {/* ambient background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 hero-grid-bg" />
          <div className={`blob absolute -top-32 -left-24 h-96 w-96 rounded-full blur-[110px] ${ACCENT_BLOB[accent]}`} />
          <div className="blob-2 absolute top-40 -right-28 h-[26rem] w-[26rem] rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-[120px]" />
        </div>

        <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="space-y-6">
              {/* Hero banner */}
              <div style={{ animation: "fadeInUp 0.5s ease-out both" }}>
                <Tilt glow={accent}>
                  <div className="relative z-10 flex flex-col gap-5 p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-xl ${ACCENT_CHIP[accent]}`}>
                        <FontAwesomeIcon icon={currentModule.icon} className={ACCENT_TEXT[accent]} />
                      </div>
                      <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${ACCENT_TEXT[accent]}`}>
                        {currentModule.label} Hub
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {currentModule.label} Dashboard
                      </h1>
                      <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {currentModule.description} Use the cards below to open the pages you already know.
                      </p>
                    </div>
                    {/* Live data chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {chips === null && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                          Loading live data…
                        </span>
                      )}
                      {chips !== null && chips.length === 0 && (
                        <span className="inline-flex items-center rounded-full border border-slate-300/60 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Live data not available for this module yet
                        </span>
                      )}
                      {chips?.map((chip) => (
                        <span
                          key={chip}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums ${ACCENT_CHIP[accent]} ${ACCENT_TEXT[accent]}`}
                        >
                          <Sparkles size={11} className="mr-1.5" />
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </Tilt>
              </div>

              {/* CSV upload */}
              {currentModule.uploadFields && (
                <div
                  className="liquid-glass liquid-glass-slate rounded-3xl border p-6 sm:p-8"
                  style={{ animation: "fadeInUp 0.5s ease-out 0.08s both" }}
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Initial CSV Data Upload</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Download the template, fill it with your data, and upload the CSV file directly into MongoDB.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleDownloadTemplate}
                      className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5"
                    >
                      <Download size={14} />
                      Download CSV Template
                    </button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleUploadCSV}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5">
                        <Upload size={14} />
                        Upload CSV File
                      </button>
                    </div>
                  </div>
                  {uploadStatus && (
                    <div
                      className={`mt-4 rounded-2xl border p-3 text-xs font-semibold ${
                        uploadStatus.success
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {uploadStatus.message}
                    </div>
                  )}
                </div>
              )}

              {/* Sublink cards — bento spans for a modern mosaic */}
              <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {sublinks.map((link, index) => {
                  const cardAccent = ACCENTS[(index + ACCENTS.indexOf(accent)) % ACCENTS.length];
                  const wide = index === 0 || (sublinks.length >= 4 && index === 3);
                  const cardDelay = wide ? 0.05 : 0.1 + index * 0.06;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`group block h-full ${wide ? "sm:col-span-2 xl:col-span-2" : ""} ${
                        sublinks.length === 1 ? "sm:col-span-2 xl:col-span-3" : ""
                      }`}
                    >
                      <Tilt glow={cardAccent} className="h-full">
                        <div
                          className="relative z-10 flex h-full flex-col p-5"
                          style={{ animation: `fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) ${cardDelay}s both` }}
                        >
                          <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${ACCENT_CHIP[cardAccent]}`}>
                            <FontAwesomeIcon icon={currentModule.icon} className={`text-sm ${ACCENT_TEXT[cardAccent]}`} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                            {link.label}
                          </h3>
                          <p className="mt-1.5 flex-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                            Open the current page for {link.label.toLowerCase()} details and actions.
                          </p>
                          <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 transition-all group-hover:gap-2">
                            Open <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Tilt>
                    </Link>
                  );
                })}
              </section>
            </div>

            {/* Quick actions aside */}
            <aside
              className="liquid-glass liquid-glass-slate rounded-3xl border p-6 sm:p-8"
              style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
            >
              <div className="space-y-2">
                <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${ACCENT_TEXT[accent]}`}>
                  Quick actions
                </p>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Jump to a related workflow
                </h2>
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Fast access to sub-pages and the other core modules in the portal.
                </p>
              </div>
              <div className="mt-5 grid gap-3">
                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
                >
                  <Home size={14} />
                  Back to home
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/db-agent"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/70 px-5 py-3 text-xs font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  <Sparkles size={14} />
                  Ask the DB Agent
                </Link>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
