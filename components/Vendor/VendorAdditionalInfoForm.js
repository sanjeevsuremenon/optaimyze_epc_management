import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function VendorAdditionalInfoForm({ vendorCode, onSaved, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    companyTypes: [],
    yearEstablished: '',
    companyLegalType: '',
    companyLegalTypeOther: '',
    numEmployees: '',
    numTechnicalStaff: '',
    numSkilledLabor: '',
    numUnskilledLabor: '',
    annualTurnoverAvgSAR: '',
    financialReferences: [{ bankName: '', contact: '', mobile: '', email: '' }],
    clientReferences: [{ companyName: '', contact: '', mobile: '', email: '' }],
    totalAreaSqm: '',
    remarks: ''
  });

  const companyTypeOptions = [
    'manufacturer', 'trader', 'stockist', 'dealer/agent', 'distributor', 'service provider'
  ];

  const legalTypeOptions = [
    'proprietory/establishment', 'closed stock', 'listed', 'limited liability', 'multinational', 'others'
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/vendors/additional-info/${encodeURIComponent(vendorCode)}`);
        if (res.ok) {
          const existing = await res.json();
          const keys = existing ? Object.keys(existing).filter((k) => k !== '_id' && k !== 'vendorCode' && k !== 'created_at' && k !== 'updated_at') : [];
          if (existing && keys.length > 0) {
            setData(prev => ({
              ...prev,
              ...existing,
              companyTypes: Array.isArray(existing.companyTypes) ? existing.companyTypes : [],
              numEmployees: existing.numEmployees ?? '',
              numTechnicalStaff: existing.numTechnicalStaff ?? '',
              numSkilledLabor: existing.numSkilledLabor ?? '',
              numUnskilledLabor: existing.numUnskilledLabor ?? '',
              annualTurnoverAvgSAR: existing.annualTurnoverAvgSAR ?? '',
              totalAreaSqm: existing.totalAreaSqm ?? '',
              financialReferences: existing.financialReferences?.length ? existing.financialReferences : prev.financialReferences,
              clientReferences: existing.clientReferences?.length ? existing.clientReferences : prev.clientReferences,
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    };
    if (vendorCode) load();
  }, [vendorCode]);

  const toggleCompanyType = (value) => {
    setData(d => {
      const exists = d.companyTypes.includes(value);
      const companyTypes = exists ? d.companyTypes.filter(v => v !== value) : [...d.companyTypes, value];
      return { ...d, companyTypes };
    });
  };

  const updateField = (field, value) => setData(d => ({ ...d, [field]: value }));

  const updateArrayItem = (field, idx, key, value) => {
    setData(d => {
      const arr = [...d[field]];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...d, [field]: arr };
    });
  };

  const addArrayItem = (field, empty) => setData(d => ({ ...d, [field]: [...d[field], empty] }));
  const removeArrayItem = (field, idx) => setData(d => ({ ...d, [field]: d[field].filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/additional-info/${encodeURIComponent(vendorCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          numEmployees: Number(data.numEmployees) || 0,
          numTechnicalStaff: Number(data.numTechnicalStaff) || 0,
          numSkilledLabor: Number(data.numSkilledLabor) || 0,
          numUnskilledLabor: Number(data.numUnskilledLabor) || 0,
          annualTurnoverAvgSAR: Number(data.annualTurnoverAvgSAR) || 0,
          totalAreaSqm: Number(data.totalAreaSqm) || 0,
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {companyTypeOptions.map(opt => (
            <label key={opt} className="inline-flex items-center space-x-2 p-2 border rounded-md">
              <input type="checkbox" checked={data.companyTypes.includes(opt)} onChange={() => toggleCompanyType(opt)} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Year Established</label>
        <input type="number" value={data.yearEstablished} onChange={e => updateField('yearEstablished', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 2005" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Legal Type</label>
        <select value={data.companyLegalType} onChange={e => updateField('companyLegalType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          <option value="">Select type...</option>
          {legalTypeOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
        {data.companyLegalType === 'others' && (
          <input type="text" value={data.companyLegalTypeOther} onChange={e => updateField('companyLegalTypeOther', e.target.value)} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Please specify" />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Employees</label>
          <input type="number" value={data.numEmployees} onChange={e => updateField('numEmployees', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Technical/Engineering Staff</label>
          <input type="number" value={data.numTechnicalStaff} onChange={e => updateField('numTechnicalStaff', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Skilled Labor</label>
          <input type="number" value={data.numSkilledLabor} onChange={e => updateField('numSkilledLabor', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Unskilled Labor</label>
          <input type="number" value={data.numUnskilledLabor} onChange={e => updateField('numUnskilledLabor', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Turnover in SAR (Last 3 years average)</label>
        <input type="number" value={data.annualTurnoverAvgSAR} onChange={e => updateField('annualTurnoverAvgSAR', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 1000000" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Financial References</label>
        <div className="space-y-3">
          {data.financialReferences.map((ref, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input className="px-3 py-2 border rounded-md" placeholder="Bank name" value={ref.bankName} onChange={e => updateArrayItem('financialReferences', idx, 'bankName', e.target.value)} />
              <input className="px-3 py-2 border rounded-md" placeholder="Contact" value={ref.contact} onChange={e => updateArrayItem('financialReferences', idx, 'contact', e.target.value)} />
              <input className="px-3 py-2 border rounded-md" placeholder="Mobile" value={ref.mobile} onChange={e => updateArrayItem('financialReferences', idx, 'mobile', e.target.value)} />
              <div className="flex space-x-2">
                <input className="flex-1 px-3 py-2 border rounded-md" placeholder="Email" value={ref.email} onChange={e => updateArrayItem('financialReferences', idx, 'email', e.target.value)} />
                {data.financialReferences.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('financialReferences', idx)} className="px-2 py-2 text-xs bg-red-100 text-red-700 rounded">Remove</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem('financialReferences', { bankName: '', contact: '', mobile: '', email: '' })} className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded">+ Add reference</button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client References</label>
        <div className="space-y-3">
          {data.clientReferences.map((ref, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input className="px-3 py-2 border rounded-md" placeholder="Company name" value={ref.companyName} onChange={e => updateArrayItem('clientReferences', idx, 'companyName', e.target.value)} />
              <input className="px-3 py-2 border rounded-md" placeholder="Contact" value={ref.contact} onChange={e => updateArrayItem('clientReferences', idx, 'contact', e.target.value)} />
              <input className="px-3 py-2 border rounded-md" placeholder="Mobile" value={ref.mobile} onChange={e => updateArrayItem('clientReferences', idx, 'mobile', e.target.value)} />
              <div className="flex space-x-2">
                <input className="flex-1 px-3 py-2 border rounded-md" placeholder="Email" value={ref.email} onChange={e => updateArrayItem('clientReferences', idx, 'email', e.target.value)} />
                {data.clientReferences.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('clientReferences', idx)} className="px-2 py-2 text-xs bg-red-100 text-red-700 rounded">Remove</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem('clientReferences', { companyName: '', contact: '', mobile: '', email: '' })} className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded">+ Add reference</button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Total Area including Fab Shop (SQM)</label>
        <input type="number" value={data.totalAreaSqm} onChange={e => updateField('totalAreaSqm', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea value={data.remarks} onChange={e => updateField('remarks', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="w-full sm:w-auto py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default VendorAdditionalInfoForm;


