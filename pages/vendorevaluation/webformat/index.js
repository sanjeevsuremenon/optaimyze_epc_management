import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

import { Star, Eye } from "lucide-react";

export default function VendorEvaluationList() {
  const [evalmarks, setEvalmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetch(`/api/vendorevaluation`);
        if (result.ok) {
          const json = await result.json();
          setEvalmarks(json);
        }
      } catch (err) {
        console.error("Failed to load evaluations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Head>
        <title>Vendor Evaluations | OPTAIMYZE Portal</title>
      </Head>
        <div className="min-h-screen pb-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-app-text mb-2 drop-shadow-sm">
              Vendor Evaluations
            </h1>
            <p className="text-app-text-muted text-sm md:text-base">
              Overview of all evaluated suppliers, PO transactions performance and audit scores
            </p>
          </div>

          {/* Evaluations Table Card */}
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-[0_20px_55px_rgba(15,23,42,0.22)] overflow-hidden">
            <div className="p-5 border-b border-app-border bg-app-bg/30 flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-1.5">
                <Star size={16} className="text-app-accent" />
                Evaluated Vendor Master List ({evalmarks.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-accent"></div>
                <span className="ml-3 text-app-text-muted font-semibold text-sm">Loading evaluations...</span>
              </div>
            ) : evalmarks.length === 0 ? (
              <p className="text-app-text-muted text-center py-20">No evaluations found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-app-bg border-b border-app-border text-app-text-muted font-bold uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="py-4 px-5">Vendor Code</th>
                      <th className="py-4 px-5">Vendor Name</th>
                      <th className="py-4 px-5 text-center">Fixed Score</th>
                      <th className="py-4 px-5 text-center">Year 2022</th>
                      <th className="py-4 px-5 text-center">Year 2023</th>
                      <th className="py-4 px-5 text-center">Year 2024</th>
                      <th className="py-4 px-5 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/60">
                    {evalmarks.map((evalmark, index) => {
                      const bgClass = index % 2 === 0 ? "bg-app-surface-muted/80" : "bg-app-surface-muted";
                      return (
                        <tr
                          key={index}
                          className={`${bgClass} hover:bg-app-surface/40 transition-colors group`}
                        >
                          <td className="py-3.5 px-5 font-mono font-semibold text-app-accent">
                            {evalmark.vendorcode}
                          </td>
                          <td className="py-3.5 px-5 text-sm font-bold text-app-text">
                            {evalmark.vendorname}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-block bg-app-surface-muted border border-slate-850 px-2.5 py-1 rounded text-app-accent font-bold font-mono">
                              {evalmark.finalfixedscore?.$numberDecimal || evalmark.finalfixedscore || "0"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-block text-emerald-400 font-bold font-mono">
                              {evalmark.finalscore2022 != null ? evalmark.finalscore2022.toFixed(2) : "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-block text-teal-400 font-bold font-mono">
                              {evalmark.finalscore2023 != null ? evalmark.finalscore2023.toFixed(2) : "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-block text-cyan-500 font-bold font-mono">
                              {evalmark.finalscore2024 != null ? evalmark.finalscore2024.toFixed(2) : "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/vendorevaluation/webformat/${evalmark.vendorcode}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 app-card hover:bg-app-accent hover:border-app-accent text-app-text-secondary hover:text-white rounded text-[10px] font-semibold transition-all shadow-sm"
                            >
                              <Eye size={12} className="mr-1" /> Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </>
  );
}
