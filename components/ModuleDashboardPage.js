import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { moduleDashboards } from "./moduleData";

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

  return (
    <>
      <Head>
        <title>{currentModule.label} Dashboard | OPTAIMYZE Portal</title>
        <meta
          name="description"
          content={`Access dashboards and sub-modules for ${currentModule.label}.`}
        />
      </Head>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <div className="app-card rounded-[2rem] p-8 shadow-md">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-app-accent">{currentModule.label} Hub</p>
                <h1 className="text-4xl font-semibold text-app-text">{currentModule.label} Dashboard</h1>
                <p className="max-w-3xl text-lg leading-8 text-app-text-secondary">
                  {currentModule.description} Use the cards below to open the pages you already know, or
                  switch modules using the navigation above.
                </p>
              </div>
            </div>

            {currentModule.uploadFields && (
              <div className="app-card rounded-[2rem] p-8 shadow-md space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-app-text">Initial CSV Data Upload</h3>
                  <p className="text-sm text-app-text-muted mt-1">
                    Download the template, fill it with your data, and upload the CSV file directly into MongoDB.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Download CSV Template
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleUploadCSV}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-700 to-slate-800 hover:from-gray-800 hover:to-slate-900 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Upload CSV File
                    </button>
                  </div>
                </div>
                {uploadStatus && (
                  <div className={`p-4 rounded-xl text-sm ${uploadStatus.success ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                    {uploadStatus.message}
                  </div>
                )}
              </div>
            )}

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {currentModule.sublinks
                .filter((link) => !link.adminOnly || session?.user?.role === "admin")
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group app-card rounded-3xl p-6 transition hover:border-app-accent hover:shadow-md"
                  >
                    <p className="text-lg font-semibold text-app-text group-hover:text-app-accent">
                      {link.label}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-app-text-muted">
                      Open the current page for {link.label.toLowerCase()} details and actions.
                    </p>
                  </Link>
                ))}
            </section>
          </div>

          <aside className="app-card space-y-6 rounded-[2rem] p-8 shadow-md">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-app-accent">Quick actions</p>
              <h2 className="text-2xl font-semibold text-app-text">Jump to a related workflow</h2>
              <p className="text-sm leading-7 text-app-text-muted">
                The module navigation above gives you fast access to sub-pages and the other core modules
                in the portal.
              </p>
            </div>
            <div className="grid gap-4">
              <Link href={currentModule.href} className="app-btn-primary rounded-2xl px-5 py-4 text-center">
                Return to {currentModule.label} dashboard
              </Link>
              <Link
                href="/"
                className="app-btn-secondary rounded-2xl px-5 py-4 text-center hover:border-app-accent hover:text-app-accent"
              >
                Back to home
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
