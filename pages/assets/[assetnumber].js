import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { QRCodeSVG } from 'qrcode.react';

export default function AssetDetailsPage() {
  const router = useRouter();
  const { assetnumber } = router.query;
  const [origin, setOrigin] = useState('');
  const [asset, setAsset] = useState(null);
  const [calibrations, setCalibrations] = useState([]);
  const [custodyRecords, setCustodyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!assetnumber) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [assetRes, calibRes, custodyRes] = await Promise.all([
          fetch(`/api/assets/${assetnumber}`),
          fetch(`/api/assets/calibrations/${assetnumber}`),
          fetch(`/api/assets/custody/${assetnumber}`)
        ]);

        if (!assetRes.ok) throw new Error('Asset not found');

        const assetData = await assetRes.json();
        const calibData = calibRes.ok ? await calibRes.json() : [];
        const custodyData = custodyRes.ok ? await custodyRes.json() : [];

        setAsset(assetData);
        setCalibrations(Array.isArray(calibData) ? calibData : []);
        setCustodyRecords(Array.isArray(custodyData) ? custodyData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assetnumber]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-app-bg">
        <span className="loading loading-spinner loading-lg text-cyan-500"></span>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex justify-center items-center h-screen bg-app-bg text-app-text">
        <div className="bg-app-surface border border-red-500/50 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p>{error || 'Failed to load asset details'}</p>
          <button onClick={() => router.back()} className="btn btn-outline btn-sm mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Head>
        <title>{asset.assetnumber} - Asset Details</title>
      </Head>

      <div className="flex justify-between items-start bg-app-surface-muted/80 rounded-xl p-6 border border-app-border shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-app-text mb-2">{asset.assetnumber}</h1>
          <p className="text-lg text-app-text-secondary">{asset.assetdescription}</p>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <QRCodeSVG value={`${origin}/assets/publicdata/${asset.assetnumber}`} size={80} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="app-card rounded-xl p-6 border border-app-border shadow-lg">
          <h2 className="text-xl font-bold text-app-accent border-b border-app-border pb-2 mb-4">Core Information</h2>
          <dl className="grid grid-cols-1 gap-y-4">
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Category</dt>
              <dd className="mt-1 text-base text-app-text">{asset.assetcategory || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Subcategory</dt>
              <dd className="mt-1 text-base text-app-text">{asset.assetsubcategory || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Status</dt>
              <dd className="mt-1">
                <span className="px-3 py-1 bg-slate-700 text-app-text rounded-full text-sm font-medium">
                  {asset.assetstatus || '—'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="app-card rounded-xl p-6 border border-app-border shadow-lg">
          <h2 className="text-xl font-bold text-app-accent border-b border-app-border pb-2 mb-4">Acquisition Details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Acquisition Date</dt>
              <dd className="mt-1 text-base text-app-text">
                {asset.acquireddate ? new Date(asset.acquireddate).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Acquisition Value</dt>
              <dd className="mt-1 text-base font-medium text-amber-400">
                {asset.acquiredvalue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(asset.acquiredvalue) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Manufacturer</dt>
              <dd className="mt-1 text-base text-app-text">{asset.assetmanufacturer || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-app-text-muted">Model</dt>
              <dd className="mt-1 text-base text-app-text">{asset.assetmodel || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-app-text-muted">Serial Number</dt>
              <dd className="mt-1 text-base text-app-text">{asset.assetserialnumber || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Custody Section */}
        <div className="app-card rounded-xl p-6 border border-app-border shadow-lg md:col-span-2">
          <div className="flex justify-between items-center border-b border-app-border pb-2 mb-4">
            <h2 className="text-xl font-bold text-app-accent">Custody History</h2>
            <span className="badge badge-primary">{custodyRecords.length} records</span>
          </div>
          {custodyRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table w-full text-left">
                <thead>
                  <tr className="text-app-text-muted border-b border-app-border">
                    <th className="font-semibold px-4 py-2">Employee</th>
                    <th className="font-semibold px-4 py-2">Location</th>
                    <th className="font-semibold px-4 py-2">From</th>
                    <th className="font-semibold px-4 py-2">To</th>
                    <th className="font-semibold px-4 py-2">Doc No.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {custodyRecords.map((c, i) => (
                    <tr key={c._id || i} className="text-app-text">
                      <td className="px-4 py-2 align-top">
                        <div className="font-medium text-app-text">{c.employeename || 'N/A'}</div>
                        {c.employeenumber && <div className="text-app-text-muted text-xs">ID: {c.employeenumber}</div>}
                        {c.custodianDetail && <div className="text-app-text-muted text-xs mt-1">{c.custodianDetail}</div>}
                      </td>
                      <td className="px-4 py-2 align-top max-w-xs break-words">
                        {c.locationType && <span className="uppercase text-[10px] font-bold text-cyan-500 tracking-wider mb-1 block">{c.locationType.replace('_', ' ')}</span>}
                        <div className="text-sm">
                          {c.projectname || c.project || c.departmentLocation || c.campOfficeLocation || c.warehouseLocation || c.premisesLabel || c.location || 'Unknown Location'}
                        </div>
                        {(c.custodyCity || c.warehouseCity) && (
                          <div className="text-app-text-muted text-xs mt-1">
                            City: {c.custodyCity || c.warehouseCity}
                          </div>
                        )}
                        {(c.floorRoom || c.shedRoomNumber || c.containerNumberRack) && (
                          <div className="text-app-text-muted text-xs mt-1">
                            {c.floorRoom && <span className="mr-2">Room: {c.floorRoom}</span>}
                            {c.shedRoomNumber && <span className="mr-2">Shed: {c.shedRoomNumber}</span>}
                            {c.containerNumberRack && <span className="mr-2">Rack/Bin: {c.containerNumberRack}</span>}
                          </div>
                        )}
                        {c.custodyRemark && <div className="text-app-text-muted text-xs mt-1 italic">Note: {c.custodyRemark}</div>}
                      </td>
                      <td className="px-4 py-2 align-top text-sm">
                        {c.custodyfrom ? new Date(c.custodyfrom).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 align-top text-sm">
                        {c.custodyto ? new Date(c.custodyto).toLocaleDateString() : <span className="text-teal-400 font-semibold bg-teal-400/10 px-2 py-0.5 rounded">Active</span>}
                      </td>
                      <td className="px-4 py-2 align-top text-sm font-mono text-app-text-secondary">
                        {c.documentnumber || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-app-text-muted text-sm">No custody records found.</p>
          )}
        </div>

        {/* Calibration Section */}
        <div className="app-card rounded-xl p-6 border border-app-border shadow-lg md:col-span-2">
          <div className="flex justify-between items-center border-b border-app-border pb-2 mb-4">
            <h2 className="text-xl font-bold text-app-accent">Calibration Certificates</h2>
            <span className="badge badge-primary">{calibrations.length} records</span>
          </div>
          {calibrations.length > 0 ? (
            calibrations.every(c => c.calibrationRequired === 'Not Required') ? (
              <div className="bg-app-surface-muted p-4 rounded-lg border border-app-border/50 text-center">
                <p className="text-teal-400 font-medium">Calibration Not Required</p>
                <p className="text-app-text-muted text-sm mt-1">This asset is marked as not requiring calibration.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full text-left">
                  <thead>
                    <tr className="text-app-text-muted border-b border-app-border">
                      <th className="font-semibold px-4 py-2">Status / Company</th>
                      <th className="font-semibold px-4 py-2">Calibrated By</th>
                      <th className="font-semibold px-4 py-2">Date</th>
                      <th className="font-semibold px-4 py-2">Valid Until</th>
                      <th className="font-semibold px-4 py-2">Cert No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {calibrations.map((c, i) => (
                      <tr key={c._id || i} className="text-app-text">
                        <td className="px-4 py-2">
                          {c.calibrationRequired === 'Not Required' ? (
                            <span className="text-teal-400 font-medium">Not Required</span>
                          ) : (
                            c.calibrationcompany || '—'
                          )}
                        </td>
                        <td className="px-4 py-2">{c.calibratedby || '—'}</td>
                        <td className="px-4 py-2">{c.calibrationdate ? new Date(c.calibrationdate).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-2">
                          {c.calibrationtodate ? (
                            <span className={new Date(c.calibrationtodate) < new Date() ? 'text-red-400 font-bold' : 'text-teal-400'}>
                              {new Date(c.calibrationtodate).toLocaleDateString()}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2">{c.certificatenumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p className="text-app-text-muted text-sm">No calibration records found.</p>
          )}
        </div>

        {asset.accessories && (
          <div className="app-card rounded-xl p-6 border border-app-border shadow-lg md:col-span-2">
            <h2 className="text-xl font-bold text-app-accent border-b border-app-border pb-2 mb-4">Accessories</h2>
            <div 
              className="prose prose-invert max-w-none text-app-text-secondary"
              dangerouslySetInnerHTML={{ __html: asset.accessories }}
            />
          </div>
        )}

        {asset.assetnotes && (
          <div className="app-card rounded-xl p-6 border border-app-border shadow-lg md:col-span-2">
            <h2 className="text-xl font-bold text-app-accent border-b border-app-border pb-2 mb-4">Notes</h2>
            <div 
              className="prose prose-invert max-w-none text-app-text-secondary"
              dangerouslySetInnerHTML={{ __html: asset.assetnotes }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
