import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PublicAssetDetailsPage() {
  const router = useRouter();
  const { assetnumber } = router.query;
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [asset, setAsset] = useState(null);
  const [calibrationRecords, setCalibrationRecords] = useState([]);
  const [custodyRecords, setCustodyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetnumber) return;

    const fetchPublicData = async () => {
      try {
        setLoading(true);
        // Fetch core public data (secured on the server side: strips price if logged out)
        const assetRes = await fetch(`/api/assets/publicdata/${assetnumber}`);
        if (!assetRes.ok) throw new Error('Asset not found');
        const assetData = await assetRes.json();
        setAsset(assetData);

        // If the user is logged in, fetch restricted custody and calibration data
        if (isLoggedIn) {
          const [calibRes, custodyRes] = await Promise.all([
            fetch(`/api/assets/calibrations/${assetnumber}`),
            fetch(`/api/assets/custody/${assetnumber}`)
          ]);
          const calibData = calibRes.ok ? await calibRes.json() : [];
          const custodyData = custodyRes.ok ? await custodyRes.json() : [];
          setCalibrationRecords(Array.isArray(calibData) ? calibData : []);
          setCustodyRecords(Array.isArray(custodyData) ? custodyData : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [assetnumber, isLoggedIn]);

  const getCalibrationStatus = (records) => {
    if (!records || records.length === 0) {
      return { required: false, text: 'No calibration data', color: 'text-slate-400 bg-slate-800' };
    }
    const isRequired = !records.every(c => c.calibrationRequired === 'Not Required');
    if (!isRequired) {
      return { required: false, text: 'Calibration Not Required', color: 'text-teal-400 bg-teal-400/10' };
    }
    const latest = records[0];
    if (!latest || !latest.calibrationtodate) {
      return { required: true, text: 'Calibration Required (Not Done)', color: 'text-red-400 bg-red-400/10' };
    }
    const expiryDate = new Date(latest.calibrationtodate);
    const now = new Date();
    if (expiryDate >= now) {
      return { required: true, text: `Calibration Done (Active until ${expiryDate.toLocaleDateString()})`, color: 'text-emerald-400 bg-emerald-400/10' };
    } else {
      return { required: true, text: `Calibration Expired on ${expiryDate.toLocaleDateString()}`, color: 'text-rose-400 bg-rose-400/10' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <span className="loading loading-spinner loading-lg text-cyan-500"></span>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white p-4">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Asset Not Found</h2>
          <p className="text-slate-400 text-sm mb-4">{error || 'The requested asset number could not be retrieved.'}</p>
          <Link href="/auth/login" className="btn btn-cyan btn-sm text-slate-900 font-semibold w-full">
            Log In to Portal
          </Link>
        </div>
      </div>
    );
  }

  const isMME = asset.assetcategory !== 'Fixed Asset';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col justify-between">
      <Head>
        <title>{asset.assetnumber} - Asset Public Record</title>
      </Head>

      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Header Branding & Login Action */}
        <div className="flex justify-between items-center bg-slate-900/60 rounded-xl p-4 sm:p-6 border border-slate-800 shadow-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest block mb-1">Asset Verification Portal</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Asset: <span className="font-mono text-cyan-400">{asset.assetnumber}</span>
            </h1>
          </div>
          <div>
            {isLoggedIn ? (
              <div className="flex items-center gap-2 text-xs bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 px-3 py-1.5 rounded-lg font-semibold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                <span>Portal Session Active</span>
              </div>
            ) : (
              <Link 
                href={`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`}
                className="btn btn-sm btn-cyan bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0 px-4"
              >
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* Core Asset details */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-800 pb-2 mb-4">Asset Description</h2>
            <p className="text-lg text-slate-100 font-medium leading-relaxed">{asset.assetdescription || 'No description available.'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Category</p>
              <p className="text-sm font-bold text-slate-200 mt-1">{asset.assetcategory || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Subcategory</p>
              <p className="text-sm font-bold text-slate-200 mt-1">{asset.assetsubcategory || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
              <span className="inline-block px-2.5 py-0.5 mt-1 bg-slate-800 text-slate-300 text-xs font-bold rounded border border-slate-700">
                {asset.assetstatus || 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Serial Number</p>
              <p className="text-sm font-mono text-slate-200 mt-1">{asset.assetserialnumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Manufacturer</p>
              <p className="text-sm font-bold text-slate-200 mt-1">{asset.assetmanufacturer || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Model</p>
              <p className="text-sm font-bold text-slate-200 mt-1">{asset.assetmodel || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Acquisition Date</p>
              <p className="text-sm font-bold text-slate-200 mt-1">
                {asset.acquireddate ? new Date(asset.acquireddate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Acquisition Value (SAR)</p>
              {isLoggedIn ? (
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  {asset.acquiredvalue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(asset.acquiredvalue) : '—'}
                </p>
              ) : (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-450 font-semibold bg-amber-405/5 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Login required to view price</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restricted Info: Custody History */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-805 pb-2 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Custody Assignment
          </h3>

          {isLoggedIn ? (
            custodyRecords.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No custody records found.</p>
            ) : (
              <div className="space-y-4">
                {/* Active Custody */}
                {(() => {
                  const current = custodyRecords.find(r => !r.custodyto);
                  return current ? (
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block mb-2">Current Active Custodian</span>
                      <div className="text-sm">
                        <p className="font-bold text-white">{current.employeename}</p>
                        {current.employeenumber && <p className="text-xs text-slate-400 font-mono mt-0.5">Employee ID: {current.employeenumber}</p>}
                        <p className="text-slate-300 mt-2">
                          <span className="font-semibold text-slate-400 text-xs uppercase mr-2">Location:</span>
                          {current.projectname || current.project || current.departmentLocation || current.location || '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Assigned Since: {current.custodyfrom ? new Date(current.custodyfrom).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">No active custody assignment (asset is in warehouse storage).</div>
                  );
                })()}

                {/* Timeline log list */}
                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-950/40 p-2.5 font-semibold text-slate-400 border-b border-slate-800">Custody Logs ({custodyRecords.length})</div>
                  <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto">
                    {custodyRecords.map((c, i) => (
                      <div key={c._id || i} className="p-3 hover:bg-slate-900/30 flex justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-200">{c.employeename}</p>
                          <p className="text-slate-405 mt-0.5">{c.projectname || c.location || '—'}</p>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 shrink-0">
                          <div><span className="text-slate-500">From:</span> {c.custodyfrom ? new Date(c.custodyfrom).toLocaleDateString() : '—'}</div>
                          <div><span className="text-slate-500">To:</span> {c.custodyto ? new Date(c.custodyto).toLocaleDateString() : <span className="text-emerald-400 font-bold">Present</span>}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="w-10 h-10 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm font-semibold text-slate-400">Custody information requires login</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">You must be logged into a portal account to view the custody history timeline for this equipment.</p>
            </div>
          )}
        </div>

        {/* Restricted Info: Calibration (MME only) */}
        {isMME && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-805 pb-2 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Calibration Status & Records
            </h3>

            {isLoggedIn ? (
              calibrationRecords.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">No calibration records configured.</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const statusVal = getCalibrationStatus(calibrationRecords);
                    return (
                      <div className={`p-4 rounded-xl border text-sm font-semibold ${statusVal.color}`}>
                        {statusVal.text}
                      </div>
                    );
                  })()}

                  <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-950/40 p-2.5 font-semibold text-slate-400 border-b border-slate-800">Calibration Logs ({calibrationRecords.length})</div>
                    <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto">
                      {calibrationRecords.map((c, i) => (
                        <div key={c._id || i} className="p-3 hover:bg-slate-900/30 flex justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-200">{c.calibrationcompany || 'Private Agency'}</p>
                            {c.calibratedby && <p className="text-[10px] text-slate-500 mt-0.5">By: {c.calibratedby}</p>}
                          </div>
                          <div className="text-right text-[11px] shrink-0">
                            <div className="text-slate-400"><span className="text-slate-500">Date:</span> {c.calibrationdate ? new Date(c.calibrationdate).toLocaleDateString() : '—'}</div>
                            <div className="mt-0.5">
                              <span className="text-slate-550">Expires:</span>{' '}
                              {c.calibrationtodate ? (
                                <span className={new Date(c.calibrationtodate) < new Date() ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                                  {new Date(c.calibrationtodate).toLocaleDateString()}
                                </span>
                              ) : '—'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <svg className="w-10 h-10 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm font-semibold text-slate-400">Calibration certificate details require login</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">You must be logged into a portal account to view the list of calibration certificates and expiry timelines.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer copyright branding */}
      <div className="text-center py-8 text-xs text-slate-650 font-mono tracking-wider border-t border-slate-900/50 mt-12 max-w-3xl w-full mx-auto">
        © {new Date().getFullYear()} JAL International. All rights reserved.
      </div>
    </div>
  );
}
