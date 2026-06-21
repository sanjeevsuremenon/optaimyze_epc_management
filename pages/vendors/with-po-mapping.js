import { useState, useEffect, useMemo } from 'react';
import VendorGroupMapping from '../../components/VendorGroupMapping';

export default function VendorsWithPOMappingPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorCodeFilter, setVendorCodeFilter] = useState('');
  const [onlyVendorsNotMapped, setOnlyVendorsNotMapped] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [mapModalVendor, setMapModalVendor] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vendors/vendorswithpo/with-mappings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVendors(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load vendors with PO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedVendors = useMemo(() => {
    let result = [...vendors];

    // Show only vendors not mapped (no material/service groups mapped yet)
    if (onlyVendorsNotMapped) {
      result = result.filter((v) => (v.mappings || []).length === 0);
    }

    // Apply vendor name/code search filter
    if (vendorSearch.trim()) {
      const term = vendorSearch.trim().toLowerCase();
      result = result.filter(
        (v) =>
          (v['vendor-name'] || '').toLowerCase().includes(term) ||
          (v['vendor-code'] || '').toLowerCase().includes(term)
      );
    }

    // Apply vendor code filter
    if (vendorCodeFilter.trim()) {
      const codeTerm = vendorCodeFilter.trim().toLowerCase();
      result = result.filter((v) =>
        (v['vendor-code'] || '').toLowerCase().includes(codeTerm)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        const comparison = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [vendors, vendorSearch, vendorCodeFilter, onlyVendorsNotMapped, sortConfig]);

  const handleMapSuccess = () => {
    fetchVendors();
    setMapModalVendor(null);
  };

  return (
    <div
      className="app-page min-h-screen/5"
      style={{
        backgroundImage: `radial-gradient(circle at 0 0, rgba(59,130,246,0.18) 0, transparent 55%),
                          radial-gradient(circle at 100% 0, rgba(236,72,153,0.14) 0, transparent 55%),
                          radial-gradient(circle at 50% 120%, rgba(16,185,129,0.14) 0, transparent 60%)`,
        backgroundAttachment: 'fixed',
        backgroundSize: '120% 120%'
      }}
    >

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2 drop-shadow-sm">
              Vendors with PO – Group Mapping
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Vendors with at least one PO. View mapped material/service groups and use Map to assign or update groups.
            </p>
          </div>

          {/* Client-side vendor search and filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vendorSearch" className="block text-xs md:text-sm font-semibold text-slate-800 mb-2 tracking-wide uppercase">
                  Search vendor (by name or code)
                </label>
                <input
                  id="vendorSearch"
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Type to filter vendors..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-inner bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-app-text-muted text-sm md:text-base"
                />
              </div>
              <div>
                <label htmlFor="vendorCodeFilter" className="block text-xs md:text-sm font-semibold text-slate-800 mb-2 tracking-wide uppercase">
                  Filter by vendor code
                </label>
                <input
                  id="vendorCodeFilter"
                  type="text"
                  value={vendorCodeFilter}
                  onChange={(e) => setVendorCodeFilter(e.target.value)}
                  placeholder="Type vendor code..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-inner bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-app-text-muted text-sm md:text-base"
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <span className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border border-slate-200 bg-slate-200 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 has-[:checked]:bg-blue-600 has-[:checked]:border-blue-600">
                  <input
                    type="checkbox"
                    checked={onlyVendorsNotMapped}
                    onChange={(e) => setOnlyVendorsNotMapped(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="pointer-events-none inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow ring-0 transition peer-checked:translate-x-5" />
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Show only vendors not mapped
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="mt-2 text-slate-600 text-sm">Loading vendors...</p>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_20px_55px_rgba(15,23,42,0.22)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-app-text-muted uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none transition-colors"
                        onClick={() => handleSort('vendor-name')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Vendor Name</span>
                          {sortConfig.key === 'vendor-name' && (
                            <span className="text-blue-600 font-bold">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-app-text-muted uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none transition-colors"
                        onClick={() => handleSort('vendor-code')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Vendor Code</span>
                          {sortConfig.key === 'vendor-code' && (
                            <span className="text-blue-600 font-bold">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                        Mapped material / service groups
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-app-text-muted uppercase tracking-wider w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredAndSortedVendors.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-app-text-muted text-sm">
                          {onlyVendorsNotMapped && !vendorSearch.trim() && !vendorCodeFilter.trim()
                            ? 'No unmapped vendors. All vendors with PO have at least one group mapped.'
                            : (vendorSearch.trim() || vendorCodeFilter.trim())
                              ? 'No vendors match the filters'
                              : 'No vendors with PO found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedVendors.map((v) => (
                        <tr key={v['vendor-code']} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {v['vendor-name'] || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {v['vendor-code'] || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(v.mappings || []).length === 0 ? (
                                <span className="text-app-text-muted text-sm">None mapped</span>
                              ) : (
                                (v.mappings || []).map((m, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                                  >
                                    {m.groupName} → {m.subgroupName}
                                    {m.isService && (
                                      <span className="ml-1 text-app-text-muted">(Svc)</span>
                                    )}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setMapModalVendor(v)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              Map
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map modal */}
      {mapModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Map groups – {mapModalVendor['vendor-name']} ({mapModalVendor['vendor-code']})
              </h2>
              <button
                type="button"
                onClick={() => setMapModalVendor(null)}
                className="p-2 text-app-text-muted hover:text-slate-700 rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <VendorGroupMapping
                vendorCode={mapModalVendor['vendor-code']}
                vendorName={mapModalVendor['vendor-name']}
                onSaveSuccess={handleMapSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
