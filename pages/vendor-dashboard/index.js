import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useDebounce from '../../lib/useDebounce';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VendorAdditionalInfoForm from '../../components/Vendor/VendorAdditionalInfoForm';
import VendorProfileOverviewForm from '../../components/Vendor/VendorProfileOverviewForm';
import VendorGroupMapping from '../../components/VendorGroupMapping';
import { FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi';
import POCommentModal from '../../components/PO/POCommentModal';
import moment from 'moment';

const SERVICE_OVERVIEW_CARD_STYLES = [
  'bg-violet-50 border-violet-200/90 text-violet-950 shadow-[0_8px_24px_rgba(124,58,237,0.12)]',
  'bg-sky-50 border-sky-200/90 text-sky-950 shadow-[0_8px_24px_rgba(14,165,233,0.12)]',
  'bg-amber-50 border-amber-200/90 text-amber-950 shadow-[0_8px_24px_rgba(245,158,11,0.12)]',
  'bg-emerald-50 border-emerald-200/90 text-emerald-950 shadow-[0_8px_24px_rgba(16,185,129,0.12)]',
  'bg-rose-50 border-rose-200/90 text-rose-950 shadow-[0_8px_24px_rgba(244,63,94,0.12)]',
  'bg-cyan-50 border-cyan-200/90 text-cyan-950 shadow-[0_8px_24px_rgba(6,182,212,0.12)]',
  'bg-fuchsia-50 border-fuchsia-200/90 text-fuchsia-950 shadow-[0_8px_24px_rgba(217,70,239,0.12)]',
  'bg-teal-50 border-teal-200/90 text-teal-950 shadow-[0_8px_24px_rgba(20,184,166,0.12)]',
];

function getContactSegmentType(segment) {
  const s = String(segment).trim();
  if (!s) return 'text';
  if (/\S+@\S+\.\S+/.test(s)) return 'email';
  const digits = s.replace(/\D/g, '');
  if (s.includes('+') && digits.length >= 8) return 'phone';
  if (digits.length >= 9 && digits.length >= s.replace(/\s/g, '').length * 0.35) return 'phone';
  return 'text';
}

function splitContactSegments(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const bySemi = raw.split(/;|\n/).map((x) => x.trim()).filter(Boolean);
  if (bySemi.length > 1) return bySemi;
  return raw.trim() ? [raw.trim()] : [];
}

function splitServicesList(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function VendorProfileOverviewDisplay({ vendorOverview }) {
  const recordName = vendorOverview['vendor-name'] || vendorOverview.vendorName || 'N/A';
  const website = vendorOverview.website;
  const contactRaw =
    vendorOverview['contact-info'] ||
    vendorOverview.contactInfo ||
    vendorOverview.contact_info ||
    '';
  const servicesRaw =
    vendorOverview['services-and-materials'] ||
    vendorOverview.servicesAndMaterials ||
    vendorOverview.services_and_materials ||
    '';

  const contactParts = splitContactSegments(contactRaw);
  const serviceItems = splitServicesList(servicesRaw);

  let otherContactLine = 0;
  const contactLineStyles = contactParts.map((part) => {
    const kind = getContactSegmentType(part);
    if (kind === 'email') return 'text-emerald-400 font-semibold';
    if (kind === 'phone') return 'text-amber-800 font-semibold';
    const cls = otherContactLine % 2 === 0 ? 'text-app-accent font-medium' : 'text-app-text font-medium';
    otherContactLine += 1;
    return cls;
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">Vendor name</span>
        <p className="mt-1 text-[0.825rem] md:text-[0.99rem] font-bold text-app-accent leading-snug tracking-[0.1em] md:tracking-[0.12em]">
          {recordName}
        </p>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">Website</span>
        <div className="mt-1 text-sm">
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline break-all"
            >
              {website}
            </a>
          ) : (
            <span className="text-app-text-muted">N/A</span>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-app-text-muted mb-2">Contact information</h4>
        {contactParts.length ? (
          <ul className="flex flex-col gap-1.5">
            {contactParts.map((part, idx) => {
              const kind = getContactSegmentType(part);
              const cls = `text-sm leading-relaxed ${contactLineStyles[idx]}`;
              return (
                <li key={idx} className={cls}>
                  {kind === 'email' && /\S+@\S+\.\S+/.test(part) ? (
                    <a href={`mailto:${part.replace(/^mailto:/i, '')}`} className="hover:underline">
                      {part}
                    </a>
                  ) : kind === 'phone' ? (
                    <a href={`tel:${part.replace(/\s/g, '')}`} className="hover:underline">
                      {part}
                    </a>
                  ) : (
                    part
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-app-text-muted text-sm">N/A</p>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-app-text-muted mb-3">Services and materials</h4>
        {serviceItems.length ? (
          <div className="flex flex-wrap gap-3">
            {serviceItems.map((item, idx) => {
              const styleClass = SERVICE_OVERVIEW_CARD_STYLES[idx % SERVICE_OVERVIEW_CARD_STYLES.length];
              return (
                <div
                  key={`${idx}-${item.slice(0, 24)}`}
                  className={`inline-flex max-w-full md:max-w-[calc(50%-0.375rem)] lg:max-w-[calc(33.333%-0.5rem)] px-4 py-3 rounded-2xl border text-sm font-medium leading-snug transition-transform duration-200 hover:-translate-y-0.5 ${styleClass}`}
                >
                  {item}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-app-text-muted text-sm">N/A</p>
        )}
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadedDocsLoading, setUploadedDocsLoading] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [additionalInfoLoading, setAdditionalInfoLoading] = useState(false);
  const [editingAdditionalInfo, setEditingAdditionalInfo] = useState(false);
  const [vendorFeedback, setVendorFeedback] = useState([]);
  const [vendorFeedbackLoading, setVendorFeedbackLoading] = useState(false);
  const [editingGroupMappings, setEditingGroupMappings] = useState(false);
  const [vendorOverview, setVendorOverview] = useState(null);
  const [vendorOverviewLoading, setVendorOverviewLoading] = useState(false);
  const [editingVendorOverview, setEditingVendorOverview] = useState(false);
  
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPoNumber, setSelectedPoNumber] = useState(null);

  const handleOpenComment = (poNumber, e) => {
    e.stopPropagation();
    setSelectedPoNumber(poNumber);
    setIsCommentModalOpen(true);
  };
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setEditingAdditionalInfo(false);
    setEditingGroupMappings(false);
    setEditingVendorOverview(false);
  }, [selectedVendor?.vendorcode]);

  // Handle vendorcode from URL
  useEffect(() => {
    if (router.isReady && router.query.vendorcode) {
      const vendorcodeFromQuery = String(router.query.vendorcode);
      const searchVendors = async () => {
        setIsLoading(true);
        try {
          // Use the enhanced search API to try to find the vendor record
          const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(vendorcodeFromQuery)}`);
          const data = await response.json();
          // Find exact match
          const match = Array.isArray(data) ? data.find(v => String(v.vendorcode) === vendorcodeFromQuery || String(v['vendor-code']) === vendorcodeFromQuery) : null;
          
          if (match) {
            handleVendorSelect(match);
          } else {
            // Fallback: If not found in search, try to construct a dummy vendor object
            // This is useful if the search API fails but the dashboard API still has it.
            const fallbackVendor = { vendorcode: vendorcodeFromQuery, vendorname: 'Vendor', source: 'vendors' };
            handleVendorSelect(fallbackVendor);
          }
        } catch (error) {
          console.error('Error loading vendor from query:', error);
          // Fallback on error
          handleVendorSelect({ vendorcode: vendorcodeFromQuery, vendorname: 'Vendor', source: 'vendors' });
        }
      };
      
      searchVendors();
    }
  }, [router.isReady, router.query.vendorcode]);

  // Search for vendors
  useEffect(() => {
    const searchVendors = async () => {
      if (debouncedSearchTerm.length >= 3) {
        try {
          const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(debouncedSearchTerm)}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error('Search error:', error);
          toast.error('Failed to search vendors');
        }
      } else {
        setSearchResults([]);
      }
    };

    searchVendors();
  }, [debouncedSearchTerm]);

  // Helper to generate vendor code from name (first 5 + last 5)
  const generateCodeFromName = (name) => {
    if (!name || typeof name !== 'string') return 'NA';
    if (name.length < 5) return name;
    const first = name.substring(0, 5);
    const last = name.substring(name.length - 5);
    return first + last;
  };

  // Load vendor dashboard data
  const loadVendorData = async (vendorcode, vendorName, source) => {
    setIsLoading(true);
    try {
      const url = new URL(`/api/vendors/dashboard/${vendorcode}`, window.location.origin);
      if (vendorName) url.searchParams.set('vendorName', vendorName);
      if (source) url.searchParams.set('source', source);
      const response = await fetch(url.toString());
      const data = await response.json();
      console.log('Vendor dashboard data loaded:', data);
      console.log('Evaluation data:', data.evaluation);
      console.log('Evaluation marks:', data.evaluation?.marks);
      console.log('Evaluation data object:', data.evaluation?.data);
      setVendorData(data);
      setShowDashboard(true);
      // Determine effective code for subsequent calls
      const effectiveCode = vendorcode;
      // Trigger OpenAI extract and save to vendorextracts (fire-and-forget)
      fetch('/api/vendors/extract-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorcode: effectiveCode,
          vendorName: vendorName || data?.vendor?.vendorname,
          source: source || data?.vendor?.source
        })
      }).catch(err => console.error('Vendor extract-openai failed:', err));
      // Load uploaded documents always
      loadUploadedDocuments(effectiveCode);
      // Only load additional info and feedback for vendors that are not registeredvendors with NA code
      const isRegisteredNoCode = data?.vendor?.source === 'registeredvendors' && (!data?.vendor?.vendorcode || data?.vendor?.vendorcode === 'NA');
      if (!isRegisteredNoCode) {
        loadAdditionalInfo(effectiveCode);
        loadVendorOverview(effectiveCode);
        loadVendorFeedback(effectiveCode);
      } else {
        setVendorOverview(null);
        setVendorOverviewLoading(false);
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast.error('Failed to load vendor data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUploadedDocuments = async (vendorcode) => {
    setUploadedDocsLoading(true);
    try {
      const res = await fetch(`/api/vendors/documents/${vendorcode}`);
      if (!res.ok) throw new Error('Failed to load uploaded documents');
      const docs = await res.json();
      setUploadedDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Error loading uploaded documents:', err);
      setUploadedDocuments([]);
    } finally {
      setUploadedDocsLoading(false);
    }
  };

  const loadAdditionalInfo = async (vendorcode) => {
    setAdditionalInfoLoading(true);
    try {
      const res = await fetch(`/api/vendors/additional-info/${encodeURIComponent(vendorcode)}`);
      if (!res.ok) throw new Error('Failed to load additional info');
      const info = await res.json();
      setAdditionalInfo(info && Object.keys(info).length ? info : null);
    } catch (err) {
      console.error('Error loading additional info:', err);
      setAdditionalInfo(null);
    } finally {
      setAdditionalInfoLoading(false);
    }
  };

  const loadVendorOverview = async (vendorcode) => {
    setVendorOverviewLoading(true);
    try {
      const res = await fetch(`/api/vendors/overview/${encodeURIComponent(vendorcode)}`);
      if (!res.ok) throw new Error('Failed to load vendor overview');
      const doc = await res.json();
      const codeVal = doc?.['vendor-code'] ?? doc?.vendorCode;
      const hasRecord =
        doc &&
        typeof doc === 'object' &&
        codeVal != null &&
        String(codeVal).trim() !== '';
      setVendorOverview(hasRecord ? doc : null);
    } catch (err) {
      console.error('Error loading vendor overview:', err);
      setVendorOverview(null);
    } finally {
      setVendorOverviewLoading(false);
    }
  };

  const loadVendorFeedback = async (vendorcode) => {
    setVendorFeedbackLoading(true);
    try {
      const res = await fetch(`/api/vendor-feedback`);
      if (!res.ok) throw new Error('Failed to load vendor feedback');
      const allFeedback = await res.json();
      // Filter feedback by vendor code
      const filteredFeedback = allFeedback.filter(feedback => 
        feedback.vendorCode && feedback.vendorCode.toLowerCase() === vendorcode.toLowerCase()
      );
      setVendorFeedback(filteredFeedback);
    } catch (err) {
      console.error('Error loading vendor feedback:', err);
      setVendorFeedback([]);
    } finally {
      setVendorFeedbackLoading(false);
    }
  };

  const handleVendorSelect = (vendor) => {
    // For registeredvendors with NA code, generate code from name for downstream data
    const isRegistered = vendor?.source === 'registeredvendors';
    const hasNoCode = !vendor?.vendorcode || vendor.vendorcode === 'NA';
    const generatedCode = isRegistered && hasNoCode ? generateCodeFromName(vendor.vendorname) : vendor.vendorcode;

    // Update selected vendor with effective code (do not persist anywhere).
    // Empty vendorCode when saving group maps uses unregisteredvendorgroupmap (see VendorGroupMapping).
    const usesUnregisteredGroupMap = isRegistered && hasNoCode;
    setSelectedVendor({ ...vendor, vendorcode: generatedCode, usesUnregisteredGroupMap });
    // Pass vendorName and source so API can resolve base vendor record correctly
    loadVendorData(generatedCode, vendor.vendorname, vendor.source);
  };

  const handleContactEdit = () => {
    setEditingContact(true);
  };

  const handleContactSave = async (contactData) => {
    try {
      // SAP vendors (source: vendors) live in `vendors`; saves were incorrectly sent only to
      // `registeredvendors` by name, so nothing matched and the UI never changed.
      const isSapVendor = selectedVendor.source === 'vendors';
      const url = isSapVendor
        ? `/api/vendors/update-contact/${encodeURIComponent(selectedVendor.vendorcode)}`
        : `/api/registeredvendors/update/${encodeURIComponent(selectedVendor.vendorname)}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactData,
          username: 'admin'
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update contact details');
      }

      toast.success('Contact details updated successfully');
      setEditingContact(false);
      loadVendorData(
        selectedVendor.vendorcode,
        selectedVendor.vendorname,
        selectedVendor.source
      );
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error(error.message || 'Failed to update contact details');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    
    <div className="min-h-screen p-6 bg-app-bg" style={{
      backgroundImage: `
        radial-gradient(circle at 0 0, rgba(59,130,246,0.16) 0, transparent 55%),
        radial-gradient(circle at 100% 0, rgba(236,72,153,0.12) 0, transparent 55%),
        radial-gradient(circle at 50% 120%, rgba(16,185,129,0.12) 0, transparent 60%)
      `,
      backgroundAttachment: 'fixed',
      backgroundSize: '120% 120%'
    }}>
          <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-app-text mb-2 drop-shadow-sm">
          Vendor Dashboard
        </h1>
        <p className="text-app-text-muted text-sm md:text-base">
          Search and manage vendor information, purchase orders, and evaluations
        </p>
      </div>
      <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Search Section */}
      <div
        className="bg-app-surface/80 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_18px_45px_rgba(0,0,0,0.4)] p-6 mb-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(0,0,0,0.6)]"
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search vendors (minimum 3 characters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-app-border rounded-xl bg-app-surface/80 shadow-inner focus:ring-2 focus:ring-app-accent focus:border-app-accent text-base md:text-lg placeholder:text-app-text-muted"
          />
          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <p className="text-sm text-red-500 mt-2">Please enter at least 3 characters to search</p>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-semibold text-app-text-secondary">Search Results:</h3>
            {searchResults.map((vendor, index) => (
              <div
                key={index}
                onClick={() => handleVendorSelect(vendor)}
                className="p-4 rounded-2xl border border-app-border bg-app-surface/90 shadow-[0_10px_25px_rgba(15,23,42,0.12)] hover:bg-cyan-900/30 hover:border-cyan-800 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(37,99,235,0.35)]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-app-text">{vendor.vendorname}</h4>
                    <p className="text-sm text-app-text-muted">Code: {vendor.vendorcode}</p>
                    <p className="text-xs text-app-text-muted">Source: {vendor.source}</p>
                  </div>
                  <span className="text-xs bg-cyan-900/50 text-app-accent px-2 py-1 rounded">
                    Click to view details
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent"></div>
        </div>
      )}

      {/* Dashboard Section */}
      {showDashboard && vendorData && selectedVendor && vendorData.vendor && (
        <div className="space-y-6">
          {/** Determine if vendor is from registeredvendors without a valid code **/}
          {(() => { return null; })()}
          {/** Helper flag within render scope **/}
          {(() => { return null; })()}
          {/** Compute flag for conditional rendering **/}
          {(() => { return null; })()}
          {/** Using inline const via IIFE not possible in JSX; use simple variable assignment before return instead. **/}
          {/** We will derive the flag below for readability **/}
          {(() => { return null; })()}
          {/**/}
          {/* Vendor Header */}
          <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-app-text tracking-tight">{vendorData.vendor?.vendorname || 'N/A'}</h2>
                <p className="text-app-text-muted text-sm md:text-base">Vendor Code: {vendorData.vendor?.vendorcode || 'N/A'}</p>
                <p className="text-xs md:text-sm text-app-text-muted mt-1">Source: {vendorData.vendor?.source || 'N/A'}</p>
              </div>
              <button
                onClick={() => setShowDashboard(false)}
                className="text-app-text-muted hover:text-app-text-muted transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

              {/* Vendor profile overview (Mongo: vendorsdata, hyphen field names) */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="bg-gradient-to-br from-slate-900 via-white/95 to-slate-800 backdrop-blur-sm rounded-2xl border border-cyan-900/50 shadow-[0_20px_55px_rgba(6,182,212,0.1)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(6,182,212,0.2)]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-xl font-bold text-app-text tracking-tight bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                  Vendor profile overview
                </h3>
                {!editingVendorOverview && (
                  <div className="flex items-center gap-2">
                    {vendorOverview ? (
                      <button
                        type="button"
                        onClick={() => setEditingVendorOverview(true)}
                        className="px-4 py-2 bg-app-accent text-white rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_25px_rgba(6,182,212,0.3)] hover:bg-app-accent hover:-translate-y-0.5 transition-all"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingVendorOverview(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:bg-emerald-500 hover:-translate-y-0.5 transition-all"
                        title="Add vendor profile overview"
                      >
                        <span className="text-lg leading-none font-bold">+</span>
                        Add overview
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-app-text-muted mb-4">
                Public-style summary: website, contact details, and services or materials.
              </p>
              <div className="bg-app-surface/95 rounded-2xl border border-blue-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.2)] px-6 py-5 md:px-8 md:py-6">
                {editingVendorOverview ? (
                  <VendorProfileOverviewForm
                    key={`overview-${selectedVendor.vendorcode}`}
                    vendorCode={selectedVendor.vendorcode}
                    vendorName={selectedVendor.vendorname || vendorData.vendor?.vendorname || ''}
                    onCancel={() => setEditingVendorOverview(false)}
                    onSaved={() => {
                      setEditingVendorOverview(false);
                      loadVendorOverview(selectedVendor.vendorcode);
                      toast.success('Vendor profile overview saved');
                    }}
                  />
                ) : vendorOverviewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
                    <span className="ml-2 text-app-text-muted">Loading overview…</span>
                  </div>
                ) : vendorOverview ? (
                  <VendorProfileOverviewDisplay vendorOverview={vendorOverview} />
                ) : (
                  <p className="text-app-text-muted text-center py-6">
                    No profile overview yet. Use <span className="font-medium text-app-text-secondary">+ Add overview</span> to create a record for this vendor code.
                  </p>
                )}
              </div>
            </div>
          )}

            {/* Quick Stats */}
            {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 p-4 rounded-2xl shadow-[0_14px_35px_rgba(6,182,212,0.15)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(6,182,212,0.25)]">
                  <h3 className="text-sm font-medium text-app-accent">Total PO Value</h3>
                  <p className="text-2xl font-bold text-app-text">
                    {formatCurrency(vendorData.poSummary?.totalValue || 0)}
                  </p>
                </div>
              <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 p-4 rounded-2xl shadow-[0_14px_35px_rgba(16,185,129,0.15)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(16,185,129,0.25)]">
                  <h3 className="text-sm font-medium text-emerald-400">Number of POs</h3>
                  <p className="text-2xl font-bold text-emerald-100">{vendorData.poSummary?.poCount || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Material & service groups (vendorgroupmap / unregisteredvendorgroupmap) */}
          <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-app-text tracking-tight">Material &amp; service groups</h3>
              {!editingGroupMappings && (
                <button
                  type="button"
                  onClick={() => setEditingGroupMappings(true)}
                  className="px-4 py-2 bg-app-accent text-white rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_25px_rgba(6,182,212,0.3)] hover:bg-app-accent hover:-translate-y-0.5 transition-all"
                >
                  Edit groups
                </button>
              )}
            </div>
            <p className="text-sm text-app-text-muted mb-4">
              Subgroups mapped to this vendor in{' '}
              {vendorData.groupMappingsSource === 'unregistered'
                ? 'unregistered vendor group map'
                : 'vendor group map'}
              . Use edit to add or remove mappings.
            </p>
            {editingGroupMappings ? (
              <div className="bg-app-surface/90 rounded-2xl border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-2 py-2 md:px-4">
                <VendorGroupMapping
                  key={`vgm-${selectedVendor.vendorcode}-${selectedVendor.vendorname}`}
                  vendorCode={selectedVendor.usesUnregisteredGroupMap ? '' : selectedVendor.vendorcode}
                  vendorName={selectedVendor.vendorname}
                  onSaveSuccess={() => {
                    setEditingGroupMappings(false);
                    loadVendorData(
                      selectedVendor.vendorcode,
                      selectedVendor.vendorname,
                      selectedVendor.source
                    );
                    toast.success('Material & service group mappings saved');
                  }}
                />
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => setEditingGroupMappings(false)}
                    className="px-4 py-2 border border-slate-600 text-app-text-secondary rounded-lg text-sm font-medium hover:bg-app-surface"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-app-surface/90 rounded-2xl border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-5">
                {vendorData.groupMappings?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vendorData.groupMappings.map((m, idx) => {
                      const bgClass = idx % 2 === 0 ? "bg-app-bg/60 hover:bg-app-bg/90" : "bg-app-surface-muted hover:bg-app-surface/70";
                      return (
                        <div
                          key={`${m.subgroupId}-${m.mappingId}`}
                          className={`px-4 py-3 rounded-xl border border-slate-850/60 flex flex-col gap-1 transition-all ${bgClass}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-app-accent uppercase tracking-widest leading-none">
                              {m.groupName}
                            </span>
                            {m.isService ? (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950 border border-violet-800/30 px-1.5 py-0.5 rounded">
                                Service
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800/30 px-1.5 py-0.5 rounded">
                                Material
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-app-text leading-normal">
                            {m.subgroupName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-app-text-muted text-center py-6 text-xs">
                    No material or service groups mapped yet. Click <span className="font-medium text-app-text-secondary">Edit groups</span> to add mappings.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Vendor Details */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <h3 className="text-xl font-semibold text-app-text mb-4 tracking-tight">Vendor Details</h3>
              <div className="bg-app-surface/90 rounded-2xl border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-5 md:px-8 md:py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Company Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Registration Number:</span> {vendorData.vendor.companyregistrationnumber || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {vendorData.vendor.companyemail || 'N/A'}</p>
                      <p><span className="font-medium">Website:</span> {vendorData.vendor.companywebsite || 'N/A'}</p>
                      <p><span className="font-medium">Tax Number:</span> {vendorData.vendor.taxnumber || 'N/A'}</p>
                      <p><span className="font-medium">VAT Number:</span> {vendorData.vendor.vatnumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Address</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">City:</span> {vendorData.vendor.address?.city || 'N/A'}</p>
                      <p><span className="font-medium">Country:</span> {vendorData.vendor.address?.countrycode || 'N/A'}</p>
                      <p><span className="font-medium">Street:</span> {vendorData.vendor.address?.street || 'N/A'}</p>
                      <p><span className="font-medium">Address 1:</span> {vendorData.vendor.address?.address1 || 'N/A'}</p>
                      <p><span className="font-medium">Address 2:</span> {vendorData.vendor.address?.address2 || 'N/A'}</p>
                      <p><span className="font-medium">P.O. Box:</span> {vendorData.vendor.address?.pobox || 'N/A'}</p>
                      <p><span className="font-medium">Zip Code:</span> {vendorData.vendor.address?.zipcode || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">System Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Created Date:</span> {vendorData.vendor.created_date ? formatDate(vendorData.vendor.created_date) : 'N/A'}</p>
                      <p><span className="font-medium">Created By:</span> {vendorData.vendor.created_by || 'N/A'}</p>
                      <p><span className="font-medium">Data Source:</span> {vendorData.vendor.source || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* Contact Details */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-app-text tracking-tight">Contact Details</h3>
                <button
                  onClick={handleContactEdit}
                  className="px-4 py-2 bg-app-accent text-white rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_25px_rgba(6,182,212,0.3)] hover:bg-app-accent hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(6,182,212,0.4)] transition-all"
                >
                  Edit Contact
                </button>
              </div>
              
              <div className="bg-app-surface/90 rounded-2xl border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-5 md:px-8 md:py-6">
                {editingContact ? (
                  <ContactEditForm
                    contact={vendorData.vendor?.contact || {}}
                    onSave={handleContactSave}
                    onCancel={() => setEditingContact(false)}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Phone & Fax</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Telephone 1:</span> {vendorData.vendor?.contact?.telephone1 || vendorData.vendor?.contact?.telelphone1 || 'N/A'}</p>
                        <p><span className="font-medium">Telephone 2:</span> {vendorData.vendor?.contact?.telephone2 || 'N/A'}</p>
                        <p><span className="font-medium">Fax:</span> {vendorData.vendor?.contact?.fax || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Sales Contact</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Sales Name:</span> {vendorData.vendor?.contact?.salesname || 'N/A'}</p>
                        <p><span className="font-medium">Sales Email:</span> {vendorData.vendor?.contact?.salesemail || 'N/A'}</p>
                        <p><span className="font-medium">Sales Mobile:</span> {vendorData.vendor?.contact?.salesmobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendor Evaluation */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <VendorEvaluationSection evaluation={vendorData.evaluation} vendorcode={vendorData.vendor?.vendorcode} />
          )}

          

          {/* Vendor Uploaded Documents (from /vendordocupload) */}
          <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
            <h3 className="text-xl font-semibold text-app-text mb-4 tracking-tight">Vendor Uploaded Documents</h3>
            {uploadedDocsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                <span className="ml-2 text-app-text-muted">Loading documents...</span>
              </div>
            ) : uploadedDocuments.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {uploadedDocuments.map((document) => (
                  <div key={document._id} className="bg-app-surface-muted border border-app-border rounded-2xl p-3 shadow-[0_8px_22px_rgba(15,23,42,0.1)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.2)] transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-app-text truncate">{document.filename}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">{document.documentType}</span>
                        </div>
                        {document.description && (
                          <p className="text-xs text-app-text-muted mb-1">{document.description}</p>
                        )}
                        <div className="text-xs text-app-text-muted">Uploaded by {document.uploadedBy} on {new Date(document.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <a href={`/${selectedVendor.vendorcode}/${document.filename}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full shadow hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(6,182,212,0.4)] transition-all">View</a>
                        <a href={`/${selectedVendor.vendorcode}/${document.filename}`} download={document.originalName || document.filename} className="px-2 py-1 text-xs bg-emerald-500 text-white rounded-full shadow hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(16,185,129,0.6)] transition-all">Download</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-app-text-muted text-center py-8">No uploaded documents found</p>
            )}
          </div>

          {/* Additional Company Information */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-xl font-semibold text-app-text tracking-tight">Additional Company Information</h3>
                {!editingAdditionalInfo && (
                  <div className="flex items-center gap-2">
                    {additionalInfo ? (
                      <button
                        type="button"
                        onClick={() => setEditingAdditionalInfo(true)}
                        className="px-4 py-2 bg-app-accent text-white rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_25px_rgba(6,182,212,0.3)] hover:bg-app-accent hover:-translate-y-0.5 transition-all"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingAdditionalInfo(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:bg-emerald-500 hover:-translate-y-0.5 transition-all"
                        title="Add company information"
                      >
                        <span className="text-lg leading-none font-bold">+</span>
                        Add information
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-app-surface/90 rounded-2xl border border-app-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-5 md:px-8 md:py-6">
                {editingAdditionalInfo ? (
                  <VendorAdditionalInfoForm
                    key={`addinfo-${selectedVendor.vendorcode}`}
                    vendorCode={selectedVendor.vendorcode}
                    onCancel={() => setEditingAdditionalInfo(false)}
                    onSaved={() => {
                      setEditingAdditionalInfo(false);
                      loadAdditionalInfo(selectedVendor.vendorcode);
                      toast.success('Additional company information saved');
                    }}
                  />
                ) : additionalInfoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                    <span className="ml-2 text-app-text-muted">Loading information...</span>
                  </div>
                ) : additionalInfo ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-medium text-app-text">Company Type:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {additionalInfo.companyTypes?.length ? (
                          additionalInfo.companyTypes.map((t, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-app-text rounded-full text-xs">{t}</span>
                          ))
                        ) : (
                          <span className="text-app-text-muted">N/A</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p><span className="font-medium text-app-text">Year Established:</span> {additionalInfo.yearEstablished || 'N/A'}</p>
                      <p><span className="font-medium text-app-text">Company Legal Type:</span> {additionalInfo.companyLegalType || 'N/A'}{additionalInfo.companyLegalType === 'others' && additionalInfo.companyLegalTypeOther ? ` - ${additionalInfo.companyLegalTypeOther}` : ''}</p>
                      <p><span className="font-medium text-app-text">Employees:</span> {additionalInfo.numEmployees ?? 'N/A'}</p>
                      <p><span className="font-medium text-app-text">Technical/Engineering Staff:</span> {additionalInfo.numTechnicalStaff ?? 'N/A'}</p>
                      <p><span className="font-medium text-app-text">Skilled Labor:</span> {additionalInfo.numSkilledLabor ?? 'N/A'}</p>
                      <p><span className="font-medium text-app-text">Unskilled Labor:</span> {additionalInfo.numUnskilledLabor ?? 'N/A'}</p>
                      <p><span className="font-medium text-app-text">Annual Turnover Avg (SAR):</span> {additionalInfo.annualTurnoverAvgSAR ?? 'N/A'}</p>
                      <p><span className="font-medium text-app-text">Total Area (SQM):</span> {additionalInfo.totalAreaSqm ?? 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Financial References</h4>
                      {additionalInfo.financialReferences?.length ? (
                        <div className="space-y-2">
                          {additionalInfo.financialReferences.map((ref, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                              <div><span className="font-medium">Bank:</span> {ref.bankName || 'N/A'}</div>
                              <div><span className="font-medium">Contact:</span> {ref.contact || 'N/A'}</div>
                              <div><span className="font-medium">Mobile:</span> {ref.mobile || 'N/A'}</div>
                              <div><span className="font-medium">Email:</span> {ref.email || 'N/A'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-app-text-muted">No financial references</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Client References</h4>
                      {additionalInfo.clientReferences?.length ? (
                        <div className="space-y-2">
                          {additionalInfo.clientReferences.map((ref, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                              <div><span className="font-medium">Company:</span> {ref.companyName || 'N/A'}</div>
                              <div><span className="font-medium">Contact:</span> {ref.contact || 'N/A'}</div>
                              <div><span className="font-medium">Mobile:</span> {ref.mobile || 'N/A'}</div>
                              <div><span className="font-medium">Email:</span> {ref.email || 'N/A'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-app-text-muted">No client references</p>
                      )}
                    </div>
                    {additionalInfo.remarks ? (
                      <div>
                        <h4 className="font-semibold text-app-text mb-2 text-sm uppercase tracking-wide">Remarks</h4>
                        <p className="text-app-text">{additionalInfo.remarks}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-app-text-muted text-center py-6">No additional information yet. Use <span className="font-medium text-app-text-secondary">+ Add information</span> above to create a record.</p>
                )}
              </div>
            </div>
          )}

          {/* Vendor Feedback (read-only) */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <h3 className="text-xl font-semibold text-app-text mb-4 tracking-tight">User Feedback</h3>
              {vendorFeedbackLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  <span className="ml-2 text-app-text-muted">Loading feedback...</span>
                </div>
              ) : vendorFeedback.length > 0 ? (
                <div className="space-y-4">
                  {vendorFeedback.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="bg-app-surface-muted border border-app-border rounded-2xl p-4 shadow-[0_10px_26px_rgba(15,23,42,0.12)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition-shadow duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {feedback.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800">
                              {feedback.username}
                            </span>
                            <div className="text-xs text-app-text-muted">
                              {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {feedback.vendorName && (
                        <div className="mb-3 p-2 bg-blue-50/80 rounded-xl border border-cyan-800">
                          <div className="text-sm text-app-accent">
                            <span className="font-medium">Vendor:</span> {feedback.vendorName}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-app-text-secondary text-sm leading-relaxed">
                        {feedback.comment}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-app-text-muted text-center py-8">No feedback available for this vendor</p>
              )}
            </div>
          )}          {/* Purchase Orders */}
          {!(vendorData.vendor?.source === 'registeredvendors' && (!vendorData.vendor?.vendorcode || vendorData.vendor?.vendorcode === 'NA')) && (
            <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <h3 className="text-xl font-semibold text-app-text mb-4 tracking-tight">Purchase Orders</h3>
              {vendorData.poSummary?.poList?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-app-bg border-b border-app-border">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider">Date</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">Value (SAR)</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">Balance</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-center">Status</th>
                        <th className="px-5 py-4 text-xs font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/60 bg-app-surface">
                      {vendorData.poSummary?.poList?.map((po, index) => {
                        const hasPendingValue = po.balgrval && po.balgrval > 0;
                        const rowClass = hasPendingValue 
                          ? 'bg-rose-950/10 hover:bg-rose-950/20 border-l-2 border-l-rose-500' 
                          : 'hover:bg-app-surface/40 border-l-2 border-l-transparent';
                        return (
                          <tr key={index} className={`transition-colors group ${rowClass}`}>
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-app-accent">
                              {po.ponum}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-app-text-secondary">
                              {po.podate ? moment(po.podate).format('MMM D, YYYY') : '—'}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-app-text-secondary text-right">
                              {po.poval ? po.poval.toLocaleString() : '0'}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-app-text-muted text-right">
                              {po.balgrval ? po.balgrval.toLocaleString() : '0'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${po.balgrval === 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                                {po.balgrval === 0 ? 'Complete' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/openpurchaseorders1/schedule/${po.ponum}`, '_blank'); }}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-violet-600 border border-app-border hover:border-violet-500 text-app-text-secondary hover:text-app-text rounded text-[10px] font-semibold transition-all shadow-sm"
                                  title="Update Schedule"
                                >
                                  <FiCalendar size={11} /> Schedule
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenComment(po.ponum, e)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-blue-600 border border-app-border hover:border-blue-500 text-app-text-secondary hover:text-white rounded text-[10px] font-semibold transition-all shadow-sm"
                                  title="View/Add Comments"
                                >
                                  <FiMessageSquare size={11} /> Comment
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/openpurchaseorders1/view/${po.ponum}`, '_blank'); }}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-app-accent border border-app-border hover:border-app-accent text-app-text-secondary hover:text-white rounded text-[10px] font-semibold transition-all shadow-sm"
                                  title="View PO Details & Timeline"
                                >
                                  <FiEye size={11} /> View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-app-text-muted text-center py-8">No purchase orders found for this vendor</p>
              )}
            </div>
          )}

          <POCommentModal
            isOpen={isCommentModalOpen}
            onClose={() => {
              setIsCommentModalOpen(false);
              setSelectedPoNumber(null);
            }}
            poNumber={selectedPoNumber}
          />
        </div>
      )}
    
    </div>
    </div>
  );
}

// Contact Edit Form Component
function ContactEditForm({ contact, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    telephone1: contact?.telephone1 || '',
    telephone2: contact?.telephone2 || '',
    fax: contact?.fax || '',
    salesname: contact?.salesname || '',
    salesemail: contact?.salesemail || '',
    salesmobile: contact?.salesmobile || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-app-text-secondary mb-1">Telephone 1</label>
          <input
            type="text"
            value={formData.telephone1}
            onChange={(e) => setFormData({...formData, telephone1: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-accent focus:border-app-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text-secondary mb-1">Telephone 2</label>
          <input
            type="text"
            value={formData.telephone2}
            onChange={(e) => setFormData({...formData, telephone2: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-accent focus:border-app-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text-secondary mb-1">Fax</label>
          <input
            type="text"
            value={formData.fax}
            onChange={(e) => setFormData({...formData, fax: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-accent focus:border-app-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text-secondary mb-1">Sales Name</label>
          <input
            type="text"
            value={formData.salesname}
            onChange={(e) => setFormData({...formData, salesname: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-accent focus:border-app-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text-secondary mb-1">Sales Email</label>
          <input
            type="email"
            value={formData.salesemail}
            onChange={(e) => setFormData({...formData, salesemail: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-accent focus:border-app-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text-secondary mb-1">Sales Mobile</label>
          <input
            type="text"
            value={formData.salesmobile}
            onChange={(e) => setFormData({...formData, salesmobile: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-app-accent focus:border-app-accent"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-app-text-secondary rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-app-accent"
        >
          Save Changes
        </button>
      </div>
    </form>
    
  );
}

// Vendor Evaluation Section Component
function VendorEvaluationSection({ evaluation, vendorcode }) {
  if (!evaluation || (!evaluation.marks && !evaluation.fixed)) {
    return (
      <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-app-text tracking-tight">Vendor Evaluation</h3>
          {vendorcode && (
            <Link href={`/vendorevaluation/webformat/${vendorcode}`} className="text-xs font-bold text-app-accent hover:text-app-accent hover:underline flex items-center gap-1">
              View Full Evaluation →
            </Link>
          )}
        </div>
        <p className="text-app-text-muted text-center py-8">No evaluation data available for this vendor</p>
      </div>
    );
  }

  const evalmarks = evaluation.marks || {};
  const evalmarks2 = evaluation.fixed || {};
  
  const fixedscoretext = [
    "Quote submission",
    "Payment terms", 
    "Quality assurance",
    "Technical clarity",
    "Salesman interaction",
  ];

  return (
    <div className="bg-app-surface/90 backdrop-blur-sm rounded-2xl border border-app-border shadow-[0_20px_55px_rgba(15,23,42,0.22)] p-6 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-app-text tracking-tight">Vendor Evaluation</h3>
        {vendorcode && (
          <Link href={`/vendorevaluation/webformat/${vendorcode}`} className="text-xs font-bold text-app-accent hover:text-app-accent hover:underline flex items-center gap-1">
            View Full Evaluation →
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Scores Card */}
        <div className="bg-gradient-to-br from-cyan-950/40 to-blue-100 rounded-2xl p-6 shadow-[0_16px_40px_rgba(6,182,212,0.15)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,99,235,0.5)]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.1) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-app-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-app-text">Summary Scores</h4>
          </div>
          <div className="space-y-3">
            <div className="bg-app-surface rounded-lg p-3 shadow-sm">
              <div className="text-xs text-app-accent font-medium">Fixed Score</div>
              <div className="text-sm font-bold text-app-text">
                {evalmarks?.finalfixedscore?.$numberDecimal || evalmarks?.finalfixedscore || 'N/A'}
              </div>
            </div>
            {evalmarks.finalscore2022 && (
              <div className="bg-app-surface rounded-lg p-3 shadow-sm">
                <div className="text-xs text-emerald-400 font-medium">2022 Score</div>
                <div className="text-sm font-bold text-emerald-100">{evalmarks.finalscore2022.toFixed(2)}</div>
              </div>
            )}
            {evalmarks.finalscore2023 && (
              <div className="bg-app-surface rounded-lg p-3 shadow-sm">
                <div className="text-xs text-teal-600 font-medium">2023 Score</div>
                <div className="text-sm font-bold text-teal-900">{evalmarks.finalscore2023.toFixed(2)}</div>
              </div>
            )}
            {evalmarks.finalscore2024 && (
              <div className="bg-app-surface rounded-lg p-3 shadow-sm">
                <div className="text-xs text-emerald-600 font-medium">2024 Score</div>
                <div className="text-sm font-bold text-emerald-900">{evalmarks.finalscore2024.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Past Scores Card */}
        {evalmarks2?.past && evalmarks2.past.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-950/40 to-green-100 rounded-2xl p-6 shadow-[0_16px_40px_rgba(22,163,74,0.32)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(22,163,74,0.5)]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-app-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-emerald-100">Past Scores</h4>
            </div>
            <div className="space-y-2">
              {evalmarks2.past.map((past, index) =>
                past.pastyearscore > 0 ? (
                  <div key={index} className="bg-app-surface rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">Year {past.pastyear}</span>
                      <span className="text-sm font-bold text-emerald-100">{past.pastyearscore}</span>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Fixed Score Basis Card */}
        {evalmarks2?.fixedevalyear1?.fixedeval && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-[0_16px_40px_rgba(147,51,234,0.34)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(147,51,234,0.54)]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(168, 85, 247, 0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-300 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-app-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-purple-900">Fixed Score Basis</h4>
            </div>
            <div className="space-y-2">
              {evalmarks2.fixedevalyear1.fixedeval.map((fixed, index) => (
                <div key={index} className="bg-app-surface rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-sky-400">{fixedscoretext[index]}</span>
                    <span className="text-[16px] italic font-bold text-sky-500">{fixed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PO Scoring 2022 Card */}
        {evalmarks2?.powiseevalyear1?.powiserating && evalmarks2.powiseevalyear1.powiserating.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-[0_16px_40px_rgba(234,88,12,0.34)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(234,88,12,0.54)]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-app-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-orange-900">PO Scoring 2022</h4>
            </div>
            <div className="space-y-2">
              {evalmarks2.powiseevalyear1.powiserating.map((po, index) => (
                <div key={index} className="bg-app-surface rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-700">{po.ponumber}</span>
                    <span className="text-sm font-bold text-orange-900">{po.povalue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PO Scoring 2023 Card */}
        {evalmarks2?.powiseevalyear2?.powiserating && evalmarks2.powiseevalyear2.powiserating.length > 0 && (
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 shadow-[0_16px_40px_rgba(8,145,178,0.34)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(8,145,178,0.54)]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-app-accent rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-app-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-cyan-900">PO Scoring 2023</h4>
            </div>
            <div className="space-y-2">
              {evalmarks2.powiseevalyear2.powiserating.map((po, index) => (
                <div key={index} className="bg-app-surface rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-cyan-700">{po.ponumber}</span>
                    <span className="text-sm font-bold text-cyan-900">{po.povalue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PO Scoring 2024 Card */}
        {evalmarks2?.powiseevalyear3?.powiserating && evalmarks2.powiseevalyear3.powiserating.length > 0 && (
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 shadow-[0_16px_40px_rgba(219,39,119,0.34)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(219,39,119,0.54)]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(236, 72, 153, 0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-app-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-pink-900">PO Scoring 2024</h4>
            </div>
            <div className="space-y-2">
              {evalmarks2.powiseevalyear3.powiserating.map((po, index) => (
                <div key={index} className="bg-app-surface rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-pink-700">{po.ponumber}</span>
                    <span className="text-sm font-bold text-pink-900">{po.povalue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
