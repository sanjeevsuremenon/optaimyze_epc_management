import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './Vendors.module.css';

export default function NewVendorPage() {
  const router = useRouter();
  const [matchingVendors, setMatchingVendors] = useState([]);
  const [formData, setFormData] = useState({
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
    companywebsite: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const vendorData = {
        vendorName: formData.vendorname,
        taxnumber: "NA",
        registrationnumber: formData.companyregistrationnumber,
        email: formData.companyemail,
        webaddress: formData.companywebsite,
        vendorCity: formData.city,
        vendorCountry: formData.countrycode,
        address1: formData.address1,
        address2: formData.address2,
        pobox: formData.pobox,
        zipcode: formData.zipcode,
        telephone1: formData.telephone1,
        telephone2: formData.telephone2,
        salesperson: formData.salesname,
        salesemail: formData.salesemail,
        salesmobile: formData.salesmobile,
        faxnumber: formData.fax
      };

      console.log('Sending vendor data:', vendorData);

      const response = await fetch('/api/nonsapvendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create vendor');
      }

      const result = await response.json();
      console.log('Server response:', result);

      try {
        if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
          window.opener.location.reload();
        }
      } catch (_) {
        /* ignore cross-origin */
      }
      router.push('/vendors');
    } catch (error) {
      console.error('Error creating vendor:', error);
      alert('Error creating vendor: ' + error.message);
    }
  };

  const handleVendorNameChange = async (e) => {
    const value = e.target.value;
    setFormData({ ...formData, vendorname: value });
    
    if (value.length >= 4) {
      try {
        const response = await fetch(
          `/api/nonsapvendors?search=${encodeURIComponent(value)}&limit=50&skip=0`
        );
        if (response.ok) {
          const data = await response.json();
          setMatchingVendors(data.vendors || data);
        }
      } catch (error) {
        console.error('Error searching vendors:', error);
      }
    } else {
      setMatchingVendors([]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.editForm}>
        <h3 className="text-lg font-bold text-sky-800">Add New Vendor</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Company Information Group */}
          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Company Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Vendor Name</label>
                <input
                  type="text"
                  placeholder="Enter vendor name"
                  value={formData.vendorname}
                  onChange={handleVendorNameChange}
                  className={styles.input}
                  required
                />
                {matchingVendors.length > 0 && (
                  <div className={styles.matchingVendors}>
                    <h4 className={styles.matchingVendorsTitle}>Matching Vendors:</h4>
                    <ul className={styles.matchingVendorsList}>
                      {matchingVendors.map((vendor) => (
                        <li key={vendor._id} className={styles.matchingVendorItem}>
                          {vendor.vendorname}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className={styles.formField}>
                <label className={styles.label}>Country Code</label>
                <input
                  type="text"
                  placeholder="e.g., UAE, USA"
                  value={formData.countrycode}
                  onChange={(e) => setFormData({ ...formData, countrycode: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.label}>City</label>
                <input
                  type="text"
                  placeholder="Enter city name"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.label}>Address 1</label>
                <input
                  type="text"
                  placeholder="Enter street address"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.label}>Address 2</label>
                <input
                  type="text"
                  placeholder="Additional address details (optional)"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Contact Information Group */}
          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Contact Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Telephone 1</label>
                <input 
                  type="text" 
                  placeholder="Primary contact number"
                  value={formData.telephone1} 
                  onChange={(e) => setFormData({ ...formData, telephone1: e.target.value })} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Telephone 2</label>
                <input 
                  type="text" 
                  placeholder="Secondary contact number (optional)"
                  value={formData.telephone2} 
                  onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Fax</label>
                <input type="text" value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Pobox</label>
                <input type="text" value={formData.pobox} onChange={(e) => setFormData({ ...formData, pobox: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Zipcode</label>
                <input type="text" value={formData.zipcode} onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })} className={styles.input} />
              </div>
            </div>
          </div>

          {/* Sales Information Group */}
          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Sales Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Sales Name</label>
                <input 
                  type="text" 
                  placeholder="Enter sales representative name"
                  value={formData.salesname} 
                  onChange={(e) => setFormData({ ...formData, salesname: e.target.value })} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Sales Email</label>
                <input 
                  type="email" 
                  placeholder="Enter sales email address"
                  value={formData.salesemail} 
                  onChange={(e) => setFormData({ ...formData, salesemail: e.target.value })} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Sales Mobile</label>
                <input 
                  type="text" 
                  placeholder="Enter sales mobile number"
                  value={formData.salesmobile} 
                  onChange={(e) => setFormData({ ...formData, salesmobile: e.target.value })} 
                  className={styles.input} 
                />
              </div>
            </div>
          </div>
          {/* Company registration number */}
          <div className={styles.formGroup}>
            <h4 className={styles.formGroupTitle}>Company Registration Number</h4>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Vendor Code</label>
                <input type="text" value={formData.vendorcode} onChange={(e) => setFormData({ ...formData, vendorcode: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Company Registration Number</label>
                <input type="text" value={formData.companyregistrationnumber} onChange={(e) => setFormData({ ...formData, companyregistrationnumber: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Company Email</label>
                <input type="text" value={formData.companyemail} onChange={(e) => setFormData({ ...formData, companyemail: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Company Website</label>
                <input type="text" value={formData.companywebsite} onChange={(e) => setFormData({ ...formData, companywebsite: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Tax Number</label>
                <input type="text" value={formData.taxnumber} onChange={(e) => setFormData({ ...formData, taxnumber: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Vendor Code</label>
                <input type="text" value={formData.vendorcode} onChange={(e) => setFormData({ ...formData, vendorcode: e.target.value })} className={styles.input} />
              </div>

            </div>
          </div>

          <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="submit" className={styles.saveButton}>
              Save Vendor
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