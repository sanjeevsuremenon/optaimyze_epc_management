import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function VendorExtract() {
  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [source, setSource] = useState('vendors');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = vendorCode?.trim();
    if (!code) {
      toast.error('Please enter a vendor code');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/vendors/extract-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorcode: code,
          vendorName: vendorName?.trim() || undefined,
          source: source || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Request failed');
        toast.error(data?.error || data?.details || 'Extract failed');
        return;
      }

      setResult(data);
      toast.success('Extract completed and saved to vendorextracts');
    } catch (err) {
      setError(err.message || 'Network error');
      toast.error(err.message || 'Failed to call extract API');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6 bg-slate-900/5"
      style={{
        backgroundImage: `
          radial-gradient(circle at 0 0, rgba(59,130,246,0.16) 0, transparent 55%),
          radial-gradient(circle at 100% 0, rgba(236,72,153,0.12) 0, transparent 55%),
          radial-gradient(circle at 50% 120%, rgba(16,185,129,0.12) 0, transparent 60%)
        `,
        backgroundAttachment: 'fixed',
        backgroundSize: '120% 120%'
      }}
    >      <ToastContainer />

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 drop-shadow-sm">
          Vendor Extract (OpenAI)
        </h1>
        <p className="text-slate-600 text-sm md:text-base">
          Enter a vendor code to extract group and subgroup info via OpenAI and save to vendorextracts collection.
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-6 mb-6"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="vendorCode" className="block text-sm font-medium text-slate-700 mb-1">
                Vendor Code <span className="text-red-500">*</span>
              </label>
              <input
                id="vendorCode"
                type="text"
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value)}
                placeholder="e.g. 100246"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700 mb-1">
                Vendor Name <span className="text-slate-400">(optional, for registered vendors)</span>
              </label>
              <input
                id="vendorName"
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Full vendor name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-slate-700 mb-1">
                Source
              </label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={isSubmitting}
              >
                <option value="vendors">vendors</option>
                <option value="registeredvendors">registeredvendors</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Extracting…' : 'Extract & Save to vendorextracts'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && result.extract && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Saved extract</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Vendor name</dt>
                  <dd className="font-medium text-slate-900">{result.extract.vendorName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Number of POs</dt>
                  <dd className="font-medium text-slate-900">{result.extract.numberOfPO}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Value of purchase so far</dt>
                  <dd className="font-medium text-slate-900">
                    {typeof result.extract.valueOfPurchaseSoFar === 'number'
                      ? new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(result.extract.valueOfPurchaseSoFar)
                      : result.extract.valueOfPurchaseSoFar}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Record created</dt>
                  <dd className="font-medium text-slate-900">
                    {result.extract.dateOfRecordCreated
                      ? new Date(result.extract.dateOfRecordCreated).toLocaleString()
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Group & Subgroup</h2>
              {result.extract.groupAndSubgroup && result.extract.groupAndSubgroup.length > 0 ? (
                <ul className="space-y-2">
                  {result.extract.groupAndSubgroup.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-800">
                        {item.group}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-900">{item.subgroup}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No group/subgroup (gap &gt; 12 months or no materials).</p>
              )}
            </div>

            {result.debug && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Debug</p>
                <pre className="text-xs text-slate-700 overflow-x-auto">
                  {JSON.stringify(result.debug, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>    </div>
  );
}
