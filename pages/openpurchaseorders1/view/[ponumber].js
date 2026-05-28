import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiArrowLeft, FiBox, FiClock, FiMessageSquare, FiTruck, FiDollarSign, FiX } from 'react-icons/fi';
import moment from 'moment';
import POTimeline from '../../../components/PO/POTimeline';

export default function POViewPage() {
  const router = useRouter();
  const { ponumber } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [poData, setPoData] = useState(null);
  const [poLineItems, setPoLineItems] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [isNewTab, setIsNewTab] = useState(false);

  useEffect(() => {
    if (window.opener) {
      setIsNewTab(true);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !ponumber) return;
    
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [poRes, schedRes, commRes, histRes] = await Promise.all([
          fetch(`/api/purchaseorders/porder/${ponumber}`).catch(() => ({ ok: false })),
          fetch(`/api/purchaseorders/schedule/generaldata/${ponumber}`).catch(() => ({ ok: false })),
          fetch(`/api/purchaseorders/openpo/comments/${ponumber}`).catch(() => ({ ok: false })),
          fetch(`/api/materialdocumentsforpo/${ponumber}`).catch(() => ({ ok: false }))
        ]);

        const poJson = poRes.ok ? await poRes.json() : null;
        const schedJson = schedRes.ok ? await schedRes.json() : null;
        const commJson = commRes.ok ? await commRes.json() : [];
        const histJson = histRes.ok ? await histRes.json() : [];

        // If porder returns an array, take the first one for basic info but keep all line items
        setPoData(Array.isArray(poJson) ? poJson[0] : poJson);
        setPoLineItems(Array.isArray(poJson) ? poJson : (poJson ? [poJson] : []));
        setScheduleData(schedJson);
        setComments(commJson);
        setHistory(histJson);
      } catch (err) {
        console.error("Error fetching PO details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [router.isReady, ponumber]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-slate-950 font-sans">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-8 text-center bg-slate-950 min-h-screen font-sans">
      <div className="text-rose-400 bg-rose-500/10 p-4 rounded-lg inline-block border border-rose-500/20">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col pb-12 font-sans">
      <Head>
        <title>PO View: {ponumber} | MM Portal</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => isNewTab ? window.close() : router.back()}
            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6 transition-colors font-semibold text-sm bg-cyan-950/30 px-3 py-1.5 rounded border border-cyan-900/50"
          >
            {isNewTab ? <><FiX className="mr-2" /> Close Tab</> : <><FiArrowLeft className="mr-2" /> Back</>}
          </button>
        </div>

        {/* PO Overview Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <FiBox size={120} className="text-cyan-500" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Purchase Order <span className="text-cyan-400">{ponumber}</span></h1>
            {poData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Vendor</p>
                  <p className="font-medium text-slate-200">{poData.vendorname}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{poData.vendorcode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-medium text-slate-200">{poData['po-date'] ? moment(poData['po-date']).format('DD MMM YYYY') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Value</p>
                  <p className="font-medium text-emerald-400">{poData['po-value-sar'] ? poData['po-value-sar'].toLocaleString() : 0} SAR</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Plant</p>
                  <p className="font-medium text-slate-200">{poData['plant-code']}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 mt-4">Basic PO details could not be loaded.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Left Col - 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Schedule Snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-6 border-b border-slate-800 pb-4">
                <FiClock className="text-cyan-400 text-xl mr-3" />
                <h2 className="text-lg font-bold text-slate-100">Schedule Snapshot</h2>
              </div>
              
              {scheduleData && scheduleData.generaldata ? (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {scheduleData.generaldata.estdelydate && (
                    <div>
                      <span className="block text-xs text-slate-500">Estimated Delivery</span>
                      <span className="font-medium text-slate-200">{moment(scheduleData.generaldata.estdelydate).format('DD MMM YYYY')}</span>
                    </div>
                  )}
                  {scheduleData.generaldata.poackdate && (
                    <div>
                      <span className="block text-xs text-slate-500">PO Acknowledged</span>
                      <span className="font-medium text-slate-200">{moment(scheduleData.generaldata.poackdate).format('DD MMM YYYY')}</span>
                    </div>
                  )}
                  {scheduleData.generaldata.mfgclearancedate && (
                    <div>
                      <span className="block text-xs text-slate-500">Manufacturing Clearance</span>
                      <span className="font-medium text-slate-200">{moment(scheduleData.generaldata.mfgclearancedate).format('DD MMM YYYY')}</span>
                    </div>
                  )}
                  {scheduleData.generaldata.delysch && (
                    <div className="col-span-2 mt-2 p-3 bg-slate-950 rounded border border-slate-800">
                      <span className="block text-xs text-slate-500 mb-1">Delivery Schedule Notes</span>
                      <span className="text-sm text-slate-300">{scheduleData.generaldata.delysch}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 italic bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
                  No schedule data has been entered yet.
                </div>
              )}
            </div>

            {/* Delivery History */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-6 border-b border-slate-800 pb-4">
                <FiTruck className="text-emerald-400 text-xl mr-3" />
                <h2 className="text-lg font-bold text-slate-100">Delivery History (Goods Receipts)</h2>
              </div>
              
              {history && history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Material</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Doc Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Qty</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Value (SAR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {history.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-300">{doc.material}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{doc.docdate ? moment(doc.docdate).format('DD MMM YYYY') : ''}</td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-300 text-right">{doc.qty ? doc.qty.toLocaleString() : 0}</td>
                          <td className="px-4 py-3 text-sm font-mono text-emerald-400 text-right">{doc.value ? doc.value.toLocaleString() : 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
                  No deliveries or goods receipts found for this PO.
                </div>
              )}
            </div>
            
          </div>

          {/* Right Col - 1/3 */}
          <div className="space-y-8">
            {/* Comments Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col h-full max-h-[800px]">
              <div className="p-6 border-b border-slate-800 flex items-center shrink-0">
                <FiMessageSquare className="text-blue-400 text-xl mr-3" />
                <h2 className="text-lg font-bold text-slate-100">Comments Log</h2>
                <span className="ml-auto bg-slate-800 text-slate-300 text-xs py-1 px-2 rounded-full">{comments.length}</span>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {comments.length > 0 ? (
                  comments.map((c, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-slate-200">{c.title}</span>
                      </div>
                      <div 
                        className="text-sm text-slate-400 prose prose-invert prose-sm max-w-none prose-p:leading-snug prose-li:my-0"
                        dangerouslySetInnerHTML={{ __html: c.comment }}
                      />
                      <div className="mt-3 text-xs text-slate-500 flex justify-between">
                        <span>{c.updatedBy}</span>
                        <span>{moment(c.updatedAt).format('DD MMM YYYY HH:mm')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 italic">No comments have been logged.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PO Line Items Section */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6 border-b border-slate-800 pb-4">
            <FiBox className="text-emerald-400 text-xl mr-3" />
            <h2 className="text-lg font-bold text-slate-100">PO Line Items</h2>
          </div>
          
          {poLineItems && poLineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Line</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Material</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Mat Group / Svc Group</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Qty</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Unit Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Total (SAR)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {poLineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300">{item["po-line-item"]}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {item.material?.matdescription || item["short-text"] || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {item["material-group"] || item["service-group"] || item.material?.matgroup || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300 text-right">
                        {item["po-quantity"]?.["$numberDecimal"] || item["po-quantity"] || '0'} {item["po-unit-of-measure"] || ''}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-400 text-right">
                        {item["po-unit-price"] ? item["po-unit-price"].toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-emerald-400 text-right">
                        {item["po-value-sar"] ? item["po-value-sar"].toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300 text-right">
                        {item["pending-qty"]?.["$numberDecimal"] || item["pending-qty"] || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 italic bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
              No line items found.
            </div>
          )}
        </div>

        {/* PO Timeline Section */}
        <div className="mt-8">
          <POTimeline ponumber={ponumber} />
        </div>
      </div>
    </div>
  );
}
