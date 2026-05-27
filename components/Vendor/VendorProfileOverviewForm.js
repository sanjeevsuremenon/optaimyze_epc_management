import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Form for vendorsdata / overview API (Mongo hyphen keys: vendor-code, vendor-name, website, contact-info, services-and-materials).
 */
export default function VendorProfileOverviewForm({
  vendorCode,
  vendorName,
  onSaved,
  onCancel,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [website, setWebsite] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [servicesAndMaterials, setServicesAndMaterials] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/vendors/overview/${encodeURIComponent(vendorCode)}`);
        if (res.ok) {
          const doc = await res.json();
          if (doc && typeof doc === 'object' && doc['vendor-code'] != null) {
            setWebsite(doc.website || '');
            setContactInfo(doc['contact-info'] || '');
            setServicesAndMaterials(doc['services-and-materials'] || '');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    if (vendorCode) load();
  }, [vendorCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/overview/${encodeURIComponent(vendorCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'vendor-name': vendorName || '',
          website,
          'contact-info': contactInfo,
          'services-and-materials': servicesAndMaterials,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to save');
      }
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-2 text-gray-600">Loading…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contact information</label>
        <textarea
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          rows={4}
          placeholder="Address, phone, email, etc."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Services and materials</label>
        <textarea
          value={servicesAndMaterials}
          onChange={(e) => setServicesAndMaterials(e.target.value)}
          rows={4}
          placeholder="Brief description of offerings"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
