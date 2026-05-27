import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../Vendors.module.css';

const emptyForm = {
  vendorname: '',
  countrycode: '',
  city: '',
  address1: '',
  address2: '',
  pobox: '',
  zipcode: '',
  telephone1: '',
  telephone2: '',
  salesname: '',
  salesemail: '',
  salesmobile: '',
  fax: '',
  companyregistrationnumber: '',
  companyemail: '',
  vendorcode: '',
  companywebsite: '',
};

function vendorToForm(vendor) {
  return {
    vendorname: vendor.vendorname || '',
    countrycode: vendor.address?.countrycode || '',
    city: vendor.address?.city || '',
    address1: vendor.address?.address1 || '',
    address2: vendor.address?.address2 || '',
    pobox: vendor.address?.pobox || '',
    zipcode: vendor.address?.zipcode || '',
    telephone1: vendor.contact?.telephone1 || '',
    telephone2: vendor.contact?.telephone2 || '',
    salesname: vendor.contact?.salesname || '',
    salesemail: vendor.contact?.salesemail || '',
    salesmobile: vendor.contact?.salesmobile || '',
    fax: vendor.contact?.fax || '',
    companyregistrationnumber: vendor.companyregistrationnumber || '',
    companyemail: vendor.companyemail || '',
    vendorcode: vendor.vendorcode || '',
    companywebsite: vendor.companywebsite || '',
  };
}

export default function EditVendorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState(emptyForm);
  const [vendorName, setVendorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !router.isReady) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/nonsapvendors/${encodeURIComponent(id)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load vendor');
        }
        const vendor = await res.json();
        if (cancelled) return;
        setVendorName(vendor.vendorname || '');
        setFormData(vendorToForm(vendor));
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, router.isReady]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/nonsapvendors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, ...formData }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      try {
        if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
          window.opener.location.reload();
        }
      } catch (_) {
        /* ignore cross-origin */
      }
      router.push('/vendors');
    } catch (error) {
      alert(error.message || 'Error saving vendor');
    } finally {
      setSaving(false);
    }
  };

  if (!router.isReady || loading) {
    return (
      <div className={styles.container}>
        <p className={styles.listMeta}>Loading vendor…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <p className={styles.listMeta} style={{ color: '#c00' }}>
          {loadError}
        </p>
        <button type="button" className={styles.cancelButton} onClick={() => router.push('/vendors')}>
          Back to vendors
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.editForm}>
        <h3 className="text-lg font-bold text-sky-800">Edit Vendor {vendorName}</h3>

        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Company Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Vendor Name</label>
                <input
                  type="text"
                  value={formData.vendorname}
                  onChange={(e) => setFormData({ ...formData, vendorname: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Country Code</label>
                <input
                  type="text"
                  value={formData.countrycode}
                  onChange={(e) => setFormData({ ...formData, countrycode: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Address 1</label>
                <input
                  type="text"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Address 2</label>
                <input
                  type="text"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Pobox</label>
                <input
                  type="text"
                  value={formData.pobox}
                  onChange={(e) => setFormData({ ...formData, pobox: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Zipcode</label>
                <input
                  type="text"
                  value={formData.zipcode}
                  onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Contact Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Telephone 1</label>
                <input
                  type="text"
                  value={formData.telephone1}
                  onChange={(e) => setFormData({ ...formData, telephone1: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Telephone 2</label>
                <input
                  type="text"
                  value={formData.telephone2}
                  onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Fax</label>
                <input
                  type="text"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Sales Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Sales Name</label>
                <input
                  type="text"
                  value={formData.salesname}
                  onChange={(e) => setFormData({ ...formData, salesname: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Sales Email</label>
                <input
                  type="text"
                  value={formData.salesemail}
                  onChange={(e) => setFormData({ ...formData, salesemail: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Sales Mobile</label>
                <input
                  type="text"
                  value={formData.salesmobile}
                  onChange={(e) => setFormData({ ...formData, salesmobile: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Company Registration Number</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Company Registration Number</label>
                <input
                  type="text"
                  value={formData.companyregistrationnumber}
                  onChange={(e) =>
                    setFormData({ ...formData, companyregistrationnumber: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Company Email</label>
                <input
                  type="text"
                  value={formData.companyemail}
                  onChange={(e) => setFormData({ ...formData, companyemail: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Company Website</label>
                <input
                  type="text"
                  value={formData.companywebsite}
                  onChange={(e) => setFormData({ ...formData, companywebsite: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>SAP vendor code (optional)</label>
                <input
                  type="text"
                  value={formData.vendorcode}
                  onChange={(e) => setFormData({ ...formData, vendorcode: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/vendors')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
