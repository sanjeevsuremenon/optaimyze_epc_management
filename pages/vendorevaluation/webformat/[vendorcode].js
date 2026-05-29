import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

import { 
  Cpu, 
  Users, 
  ShieldAlert, 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Star, 
  Activity, 
  Clock 
} from "lucide-react";

export default function VendorEvaluationDetails() {
  const router = useRouter();
  const [evalmarks, setEvalmarks] = useState({});
  const [evalmarks2, setEvalmarks2] = useState({});
  const [subgroups, setSubgroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { vendorcode } = router.query;

  useEffect(() => {
    if (!vendorcode) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [result1, result2, result3] = await Promise.all([
          fetch(`/api/vendorevaluation/${vendorcode}`),
          fetch(`/api/vendors/vendorevalfixed/${vendorcode}`),
          fetch(`/api/vendorgroupmap/subgroups-by-vendor?vendorCode=${encodeURIComponent(vendorcode)}`)
        ]);

        if (!result1.ok || !result2.ok) {
          throw new Error('Failed to fetch vendor data');
        }

        const json1 = await result1.json();
        const json2 = await result2.json();
        const json3 = result3.ok ? await result3.json().catch(() => []) : [];

        setEvalmarks(json1);
        setEvalmarks2(json2);
        setSubgroups(Array.isArray(json3) ? json3 : []);
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vendorcode]);

  if (!vendorcode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <LoaderSpinner label="Retrieving vendor context..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <LoaderSpinner label="Loading vendor evaluation details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 max-w-md text-center shadow-xl">
          <p className="text-rose-400 font-bold mb-2">Error Loading Evaluation</p>
          <p className="text-xs text-slate-400 leading-normal">{error}</p>
        </div>
        <Link href="/vendorevaluation/webformat" className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline">
          <ArrowLeft size={14} /> Back to List
        </Link>
      </div>
    );
  }

  const fixedscoretext = [
    "Quote submission",
    "Payment terms",
    "Quality assurance",
    "Technical clarity",
    "Salesman interaction",
  ];

  return (
    <>
      <Head>
        <title>Vendor Details - {evalmarks?.vendorname || vendorcode}</title>
      </Head>
        <div className="min-h-screen pb-16">
          <div className="max-w-7xl mx-auto py-6 flex flex-col gap-6">
          
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between">
            <Link 
              href="/vendorevaluation/webformat" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all shadow-md"
            >
              <ArrowLeft size={14} /> Back to Evaluations
            </Link>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Module</span>
              <p className="text-xs font-semibold text-cyan-400">Vendor Master / Evaluation</p>
            </div>
          </div>

          {/* Vendor Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-cyan-400">
                  {evalmarks?.vendorcode}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-2 font-Poppins leading-tight">
                {evalmarks?.vendorname || "Unnamed Vendor"}
              </h1>
            </div>

            {/* Score Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Fixed Score</span>
                <span className="text-base font-black text-cyan-400 mt-0.5 block">
                  {evalmarks?.finalfixedscore?.$numberDecimal || "0.00"}
                </span>
              </div>
              {evalmarks.finalscore2022 && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Year 2022</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    {evalmarks.finalscore2022.toFixed(2)}
                  </span>
                </div>
              )}
              {evalmarks.finalscore2023 && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Year 2023</span>
                  <span className="text-base font-black text-teal-400 mt-0.5 block">
                    {evalmarks.finalscore2023.toFixed(2)}
                  </span>
                </div>
              )}
              {evalmarks.finalscore2024 && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Year 2024</span>
                  <span className="text-base font-black text-cyan-500 mt-0.5 block">
                    {evalmarks.finalscore2024.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Columns: Existing Evaluation Data */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Subgroups Mapped */}
              {subgroups.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4 animate-fadeIn">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Activity size={16} className="text-cyan-400" />
                    Mapped Material &amp; Service Subgroups ({subgroups.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subgroups.map((sg, idx) => {
                      const bgClass = idx % 2 === 0 ? "bg-slate-950/60 hover:bg-slate-950/90" : "bg-slate-900/40 hover:bg-slate-900/70";
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col gap-1 px-4 py-3 border border-slate-850/60 rounded-xl transition-all ${bgClass}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest leading-none">
                              {sg.groupName || '—'}
                            </span>
                            {sg.isService ? (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950 border border-violet-800/30 px-1.5 py-0.5 rounded">
                                Service
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800/30 px-1.5 py-0.5 rounded">
                                Material
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-200 leading-normal">
                            {sg.subgroupName || '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fixed Score Basis */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Star size={16} className="text-cyan-400" />
                  Fixed Score Basis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {evalmarks2.fixedevalyear1?.fixedeval?.map((fixed, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center bg-slate-950/50 border border-slate-850 rounded-xl p-3"
                    >
                      <span className="text-xs text-slate-400 font-medium">{fixedscoretext[index]}</span>
                      <span className="text-sm font-bold text-white bg-slate-900 border border-slate-800 w-8 h-8 rounded-full flex items-center justify-center">
                        {fixed}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Year Ratings */}
              {evalmarks2?.past && evalmarks2.past.some(p => p.pastyearscore > 0) && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity size={16} className="text-cyan-400" />
                    Past Evaluation Ratings
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {evalmarks2.past.map((past, index) => 
                      past.pastyearscore > 0 ? (
                        <div 
                          key={index}
                          className="bg-slate-950/40 border border-slate-850 rounded-xl px-4 py-3 min-w-[120px] flex justify-between items-center flex-1"
                        >
                          <span className="text-xs text-slate-400 font-bold uppercase">Year {past.pastyear}</span>
                          <span className="text-sm font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {past.pastyearscore}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* POs Used for Scoring */}
              {["powiseevalyear1", "powiseevalyear2", "powiseevalyear3"].some(
                (yearKey) => evalmarks2?.[yearKey]?.powiserating?.length > 0
              ) && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText size={16} className="text-cyan-400" />
                    POs Used for Scoring
                  </h2>
                  <div className="flex flex-col gap-5">
                    {["2022", "2023", "2024"].map((year, idx) => {
                      const yearKey = `powiseevalyear${idx + 1}`;
                      const list = evalmarks2?.[yearKey]?.powiserating || [];
                      if (list.length === 0) return null;
                      return (
                        <div key={year} className="flex flex-col gap-2">
                          <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                            Transaction Data - Year {year}
                          </span>
                          <div className="overflow-x-auto w-full border border-slate-850 rounded-xl">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-950 border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                                  <th className="py-2.5 px-3">PO Number</th>
                                  <th className="py-2.5 px-3 text-right">PO Value (SAR)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850">
                                {list.map((po, index) => (
                                  <tr key={index} className="hover:bg-slate-850/20 transition-colors">
                                    <td className="py-2 px-3 font-semibold text-slate-200">{po.ponumber}</td>
                                    <td className="py-2 px-3 text-right text-slate-300 font-medium">
                                      {parseFloat(po.povalue || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Three Scaffolded Evaluation Pillars */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity size={16} className="text-amber-500" />
                    Evaluation Pillars
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    This vendor is subjected to three additional automated and review metrics (under development).
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  
                  {/* Pillar 1: AI Evaluation */}
                  <div className="bg-slate-950/50 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex gap-3 transition-colors relative overflow-hidden group">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">
                        Coming Soon
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Cpu size={16} />
                    </div>
                    <div className="min-w-0 pr-12">
                      <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        AI Performance
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Evaluates transactional compliance based on PO logs: delivery delays deviation, quantity deviations, pricing index tracking, and response times.
                      </p>
                    </div>
                  </div>

                  {/* Pillar 2: Procurement Ratings */}
                  <div className="bg-slate-950/50 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex gap-3 transition-colors relative overflow-hidden group">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">
                        Under Dev
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                      <Users size={16} />
                    </div>
                    <div className="min-w-0 pr-12">
                      <h3 className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">
                        Procurement Team
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Allows procurement personnel to rate coordination efficiency, quotation speed, communication responsiveness, and billing/account reconciliation quality.
                      </p>
                    </div>
                  </div>

                  {/* Pillar 3: Compliance Audits */}
                  <div className="bg-slate-950/50 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex gap-3 transition-colors relative overflow-hidden group">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">
                        Under Dev
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="min-w-0 pr-12">
                      <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Compliance & Safety
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Direct scans of ISO certification validity, financial credit audits, HSE safety compliance logs, and commercial registration stand.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

function LoaderSpinner({ label }) {
  return (
    <div className="text-center p-6 flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      <span className="text-xs text-slate-400 font-semibold">{label}</span>
    </div>
  );
}
