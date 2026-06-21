import { useState, useEffect, useCallback } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-toastify';
import VendorFeedbackRatingCard from '../../components/VendorFeedbackRatingCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faSearch, faStar, faTimesCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { computeCategoryOverall, computeFeedbackOverall } from '../../lib/vendorFeedbackRatingConfig';

const TIER_OPTIONS = [
  { value: '', label: 'Select tier...' },
  { value: 'top tier', label: 'Top tier' },
  { value: 'middle tier', label: 'Middle tier' },
  { value: 'lower tier', label: 'Lower tier' },
];

const VENDOR_FEEDBACK_DEBOUNCE_MS = 400;
const MIN_VENDOR_SEARCH_LENGTH = 4;

export default function VendorFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    comment: '',
    vendorCode: '',
    vendorName: ''
  });
  
  // Vendor search states (for Add Feedback form)
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState([]);
  const [vendorSearchLoading, setVendorSearchLoading] = useState(false);
  const [showVendorResults, setShowVendorResults] = useState(false);
  
  // Feedback search state
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState('');

  // --- Give feedback for a specific vendor (top section) ---
  const [vendorFeedbackSearchTerm, setVendorFeedbackSearchTerm] = useState('');
  const [vendorFeedbackResults, setVendorFeedbackResults] = useState([]);
  const [vendorFeedbackSearchLoading, setVendorFeedbackSearchLoading] = useState(false);
  const [selectedVendorForFeedback, setSelectedVendorForFeedback] = useState(null); // { vendorCode, vendorName }
  const [subgroups, setSubgroups] = useState([]);
  const [materialFeedbacks, setMaterialFeedbacks] = useState([]);
  const [materialAverageRating, setMaterialAverageRating] = useState(0);
  const [materialTierVotes, setMaterialTierVotes] = useState({ top: 0, middle: 0, lower: 0 });
  const [materialFeedbackLoading, setMaterialFeedbackLoading] = useState(false);
  const [materialSaving, setMaterialSaving] = useState(false);
  const [tier, setTier] = useState('');
  const [ratingMaterials, setRatingMaterials] = useState({});
  const [ratingServices, setRatingServices] = useState({});
  const [comment, setComment] = useState('');
  const [fillMaterialsAnyway, setFillMaterialsAnyway] = useState(false);
  const [fillServicesAnyway, setFillServicesAnyway] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  // Fetch feedbacks on component mount
  useEffect(() => {
    if (session) {
      fetchFeedbacks();
    }
  }, [session]);

  // Debounced vendor search for "Give feedback" (min 4 chars)
  useEffect(() => {
    if (vendorFeedbackSearchTerm.trim().length < MIN_VENDOR_SEARCH_LENGTH) {
      setVendorFeedbackResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const term = vendorFeedbackSearchTerm.trim();
      setVendorFeedbackSearchLoading(true);
      try {
        const res = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(term)}`);
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.results) ? data.results : data && Array.isArray(data.data) ? data.data : []);
        setVendorFeedbackResults(list);
      } catch (err) {
        console.error('Error searching vendors:', err);
        setVendorFeedbackResults([]);
      }
      setVendorFeedbackSearchLoading(false);
    }, VENDOR_FEEDBACK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [vendorFeedbackSearchTerm]);

  // When a vendor is selected for feedback, fetch subgroups and material feedback
  const selectedCode = selectedVendorForFeedback?.vendorCode;
  useEffect(() => {
    if (!selectedCode) return;
    setFillMaterialsAnyway(false);
    setFillServicesAnyway(false);
    const fetchSubgroups = async () => {
      try {
        const res = await fetch(`/api/vendorgroupmap/subgroups-by-vendor?vendorCode=${encodeURIComponent(selectedCode)}`);
        if (res.ok) {
          const data = await res.json();
          setSubgroups(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching subgroups:', err);
      }
    };
    const fetchMaterialFeedback = async () => {
      try {
        setMaterialFeedbackLoading(true);
        const res = await fetch(`/api/vendor-feedback/material?vendorCode=${encodeURIComponent(selectedCode)}`);
        if (res.ok) {
          const data = await res.json();
          setMaterialFeedbacks(data.feedbacks || []);
          setMaterialAverageRating(data.averageRating ?? 0);
          setMaterialTierVotes(data.tierVotes || { top: 0, middle: 0, lower: 0 });
        }
      } catch (err) {
        console.error('Error fetching material feedback:', err);
      } finally {
        setMaterialFeedbackLoading(false);
      }
    };
    fetchSubgroups();
    fetchMaterialFeedback();
  }, [selectedCode]);

  const hasService = subgroups.some((sg) => sg.isService === true);
  const hasMaterial = subgroups.some((sg) => sg.isService === false || !sg.isService);

  // Services is greyed out if vendor has NO service groups mapped
  const isServiceDisabled = subgroups.length > 0 ? !hasService : true;

  // Materials is greyed out if vendor has ONLY service subgroups mapped (and no material subgroups)
  const isMaterialDisabled = subgroups.length > 0 ? (hasService && !hasMaterial) : false;

  const currentUserId = session?.user?.email || session?.user?.id || '';
  const userHasAlreadySubmitted = Boolean(
    selectedVendorForFeedback &&
    currentUserId &&
    materialFeedbacks.some((f) => (f.userId || '').toString() === currentUserId.toString())
  );

  const handleSaveMaterialFeedback = useCallback(async () => {
    if (!selectedVendorForFeedback || !session) return;
    setMaterialSaving(true);

    // Apply grayout logic: if a section is disabled and user hasn't checked 'fill anyway', do not save those ratings
    const finalRatingMaterials = (isMaterialDisabled && !fillMaterialsAnyway) ? {} : ratingMaterials;
    const finalRatingServices = (isServiceDisabled && !fillServicesAnyway) ? {} : ratingServices;

    try {
      const res = await fetch('/api/vendor-feedback/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vendorCode: selectedVendorForFeedback.vendorCode,
          vendorName: selectedVendorForFeedback.vendorName || '',
          tier: tier || undefined,
          ratingMaterials: Object.keys(finalRatingMaterials).length ? finalRatingMaterials : undefined,
          ratingServices: Object.keys(finalRatingServices).length ? finalRatingServices : undefined,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      setTier('');
      setRatingMaterials({});
      setRatingServices({});
      setComment('');
      setFillMaterialsAnyway(false);
      setFillServicesAnyway(false);
      toast.success('Feedback saved successfully!', { position: 'top-right', autoClose: 3000 });
      const refetch = await fetch(`/api/vendor-feedback/material?vendorCode=${encodeURIComponent(selectedVendorForFeedback.vendorCode)}`);
      if (refetch.ok) {
        const data = await refetch.json();
        setMaterialFeedbacks(data.feedbacks || []);
        setMaterialAverageRating(data.averageRating ?? 0);
        setMaterialTierVotes(data.tierVotes || { top: 0, middle: 0, lower: 0 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save feedback', { position: 'top-right', autoClose: 4000 });
    } finally {
      setMaterialSaving(false);
    }
  }, [selectedVendorForFeedback, session, tier, ratingMaterials, ratingServices, comment, isMaterialDisabled, isServiceDisabled, fillMaterialsAnyway, fillServicesAnyway]);

  const clearSelectedVendorForFeedback = useCallback(() => {
    setSelectedVendorForFeedback(null);
    setVendorFeedbackSearchTerm('');
    setVendorFeedbackResults([]);
    setSubgroups([]);
    setMaterialFeedbacks([]);
    setTier('');
    setRatingMaterials({});
    setRatingServices({});
    setComment('');
    setFillMaterialsAnyway(false);
    setFillServicesAnyway(false);
  }, []);

  // Fetch vendors based on search term (for Add Feedback form)
  useEffect(() => {
    const fetchVendors = async () => {
      if (!searchTerm) {
        setVendors([]);
        setShowVendorResults(false);
        return;
      }
      setVendorSearchLoading(true);
      try {
        const response = await fetch(`/api/vendors?str=${searchTerm}`);
        const data = await response.json();
        setVendors(data);
        setShowVendorResults(true);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
        setShowVendorResults(false);
      }
      setVendorSearchLoading(false);
    };

    const debounceTimer = setTimeout(fetchVendors, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch('/api/vendor-feedback', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      } else {
        console.error('Failed to fetch feedbacks:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.comment.trim()) return;

    if (!session) {
      alert('Please log in to submit feedback');
      return;
    }

    try {
      const url = editingId ? `/api/vendor-feedback/${editingId}` : '/api/vendor-feedback';
      const method = editingId ? 'PUT' : 'POST';
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          username: session.user.name || session.user.email,
          userId: session.user.email
        }),
      });

      if (response.ok) {
        setFormData({ comment: '', vendorCode: '', vendorName: '' });
        setSearchTerm("");
        setVendors([]);
        setShowVendorResults(false);
        setShowForm(false);
        setEditingId(null);
        fetchFeedbacks();
      } else {
        const errorData = await response.json();
        alert(`Failed to save feedback: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Error saving feedback. Please try again.');
    }
  };

  const handleEdit = (feedback) => {
    setFormData({
      comment: feedback.comment,
      vendorCode: feedback.vendorCode || '',
      vendorName: feedback.vendorName || ''
    });
    setEditingId(feedback._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch(`/api/vendor-feedback/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const handleCancel = () => {
    setFormData({ comment: '', vendorCode: '', vendorName: '' });
    setSearchTerm("");
    setVendors([]);
    setShowVendorResults(false);
    setShowForm(false);
    setEditingId(null);
  };

  const handleVendorSelect = (vendor) => {
    setFormData({
      ...formData,
      vendorCode: vendor["vendor-code"],
      vendorName: vendor["vendor-name"]
    });
    setSearchTerm("");
    setVendors([]);
    setShowVendorResults(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!feedbackSearchTerm) return true;
    const searchLower = feedbackSearchTerm.toLowerCase();
    return (
      feedback.comment?.toLowerCase().includes(searchLower) ||
      feedback.vendorCode?.toLowerCase().includes(searchLower) ||
      feedback.vendorName?.toLowerCase().includes(searchLower) ||
      feedback.username?.toLowerCase().includes(searchLower)
    );
  });

  if (status === 'loading') {
    return <div className="app-page min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-app-bg text-app-text">
      <Head>
        <title>Vendor Feedback - OPTAIMYZE Portal</title>
        <meta name="description" content="User feedback on vendors" />
      </Head>
      
      <div className="flex-1">
        <div className="flex flex-col">
          {/* Redesigned Header aligned with global style */}
          <div className="flex-shrink-0 bg-app-surface border-b border-app-border px-4 py-4 shrink-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-app-text flex items-center gap-2">
                  Vendor Feedback
                </h1>
                <p className="text-xs text-app-text-muted mt-1">Submit and view subjective vendor evaluations and ratings</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-6 pb-16 mb-24 w-full flex flex-col gap-6">

              {/* Redesigned search & submit panel */}
              <div className="mb-4 p-6 bg-app-surface border border-app-border rounded-2xl shadow-xl">
                <h2 className="text-base font-bold text-app-text mb-2">Give feedback for a vendor</h2>
                <p className="text-xs text-app-text-muted mb-4">Search by vendor name (minimum 4 characters), then select a vendor to add tier, rating and comments.</p>
                <div className="relative max-w-xl">
                  <input
                    type="text"
                    value={vendorFeedbackSearchTerm}
                    onChange={(e) => setVendorFeedbackSearchTerm(e.target.value)}
                    placeholder="Type vendor name (min 4 characters)..."
                    className="w-full px-3 py-2 pl-10 pr-4 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent text-app-text text-sm focus:ring-1 focus:ring-app-accent"
                  />
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
                  {vendorFeedbackSearchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-app-accent" />
                    </div>
                  )}
                </div>
                {vendorFeedbackSearchTerm.trim().length > 0 && vendorFeedbackSearchTerm.trim().length < MIN_VENDOR_SEARCH_LENGTH && (
                  <p className="mt-2 text-xs text-amber-500 font-semibold">Type at least {MIN_VENDOR_SEARCH_LENGTH} characters to search.</p>
                )}
                {vendorFeedbackResults.length > 0 && !selectedVendorForFeedback && (
                  <div
                    className="mt-2 bg-app-surface border border-app-border rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 relative custom-scrollbar divide-y divide-slate-850"
                    role="listbox"
                    aria-label="Vendor search results"
                  >
                    {vendorFeedbackResults.map((v, idx) => {
                      const code = v.vendorcode ?? v['vendor-code'];
                      const name = v.vendorname ?? v['vendor-name'];
                      return (
                        <div
                          key={code ? `${code}-${idx}` : idx}
                          role="option"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedVendorForFeedback({ vendorCode: code, vendorName: name });
                              setVendorFeedbackResults([]);
                              setVendorFeedbackSearchTerm('');
                            }
                          }}
                          onClick={() => {
                            setSelectedVendorForFeedback({ vendorCode: code, vendorName: name });
                            setVendorFeedbackResults([]);
                            setVendorFeedbackSearchTerm('');
                          }}
                          className="px-4 py-3 hover:bg-app-surface/80 cursor-pointer focus:bg-app-surface/80 outline-none text-left"
                        >
                          <div className="font-bold text-app-text text-sm">{name || '—'}</div>
                          <div className="text-xs text-app-text-muted mt-0.5">Code: {code || '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {vendorFeedbackResults.length === 0 && vendorFeedbackSearchTerm.trim().length >= MIN_VENDOR_SEARCH_LENGTH && !vendorFeedbackSearchLoading && !selectedVendorForFeedback && (
                  <div className="mt-2 bg-app-bg border border-slate-850 rounded-lg p-4 text-center text-app-text-muted text-xs">
                    No vendors found. Try a different name.
                  </div>
                )}

                {/* Selected vendor feedback panel (tier, stars, comment, save, summary) */}
                {selectedVendorForFeedback && (
                  <div className="mt-6 pt-6 border-t border-app-border">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-base font-bold text-app-text">Feedback for: {selectedVendorForFeedback.vendorName || selectedVendorForFeedback.vendorCode}</h3>
                      <button
                        type="button"
                        onClick={clearSelectedVendorForFeedback}
                        className="text-app-text-muted hover:text-app-text flex items-center gap-1 text-xs font-semibold"
                        title="Choose different vendor"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} /> Choose different vendor
                      </button>
                    </div>
                    <div className="flex flex-col gap-4 w-full mb-5">
                      <div className="bg-app-bg rounded-lg px-3 py-1.5 border border-slate-850 self-start text-xs text-app-text-muted">
                        <span className="font-bold text-app-text-muted uppercase tracking-wider text-[10px]">Vendor Code:</span> <span className="font-bold text-app-accent ml-1">{selectedVendorForFeedback.vendorCode}</span>
                      </div>
                      
                      {subgroups.length > 0 && (
                        <div className="w-full">
                          <span className="block text-[10px] text-app-text-muted font-bold uppercase tracking-wider mb-2">Subgroups Mapped ({subgroups.length})</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                            {subgroups.map((sg, idx) => {
                              // Alternate colors based on index for contrast
                              const bgClass = idx % 2 === 0 ? "bg-app-bg/60 hover:bg-app-bg/90" : "bg-app-surface-muted hover:bg-app-surface/70";
                              return (
                                <div 
                                  key={idx}
                                  className={`px-4 py-2.5 rounded-xl border border-slate-850/70 flex flex-col gap-1 transition-all ${bgClass}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-app-accent uppercase tracking-widest leading-none">{sg.groupName}</span>
                                    {sg.isService ? (
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950 border border-violet-850/30 px-1.5 py-0.5 rounded">
                                        Service
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-850/30 px-1.5 py-0.5 rounded">
                                        Material
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-app-text font-semibold text-xs leading-normal">{sg.subgroupName}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {userHasAlreadySubmitted && (
                        <p className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs leading-normal">
                          You have already submitted feedback for this vendor. You cannot submit again.
                        </p>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1">Tier</label>
                        <select
                          value={tier}
                          onChange={(e) => setTier(e.target.value)}
                          disabled={userHasAlreadySubmitted}
                          className="w-full max-w-xs px-3 py-1.5 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent text-app-text text-xs focus:ring-1 focus:ring-app-accent"
                        >
                          {TIER_OPTIONS.map((opt) => (
                            <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1">Rating (1–5 stars per parameter)</label>
                        <VendorFeedbackRatingCard
                          ratingMaterials={ratingMaterials}
                          ratingServices={ratingServices}
                          onMaterialsChange={setRatingMaterials}
                          onServicesChange={setRatingServices}
                          disabled={userHasAlreadySubmitted}
                          disableMaterials={isMaterialDisabled && !fillMaterialsAnyway}
                          disableServices={isServiceDisabled && !fillServicesAnyway}
                        />
                        {/* Bypass checkboxes at the bottom of the rating form */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-3 p-3 bg-app-bg border border-slate-850 rounded-lg">
                          {isMaterialDisabled && (
                            <label className="flex items-center gap-2 text-xs font-semibold text-app-text-muted cursor-pointer hover:text-app-text-secondary transition-colors">
                              <input
                                type="checkbox"
                                checked={fillMaterialsAnyway}
                                onChange={(e) => setFillMaterialsAnyway(e.target.checked)}
                                disabled={userHasAlreadySubmitted}
                                className="rounded text-cyan-500 focus:ring-app-accent bg-app-surface border-slate-800 w-4 h-4 cursor-pointer"
                              />
                              Fill Materials anyway (bypass group mapping restriction)
                            </label>
                          )}
                          {isServiceDisabled && (
                            <label className="flex items-center gap-2 text-xs font-semibold text-app-text-muted cursor-pointer hover:text-app-text-secondary transition-colors">
                              <input
                                type="checkbox"
                                checked={fillServicesAnyway}
                                onChange={(e) => setFillServicesAnyway(e.target.checked)}
                                disabled={userHasAlreadySubmitted}
                                className="rounded text-cyan-500 focus:ring-app-accent bg-app-surface border-slate-800 w-4 h-4 cursor-pointer"
                              />
                              Fill Services anyway (bypass group mapping restriction)
                            </label>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1">Feedback (optional)</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          disabled={userHasAlreadySubmitted}
                          placeholder="Your feedback on the vendor's services..."
                          rows={3}
                          className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent text-app-text text-xs focus:ring-1 focus:ring-app-accent disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveMaterialFeedback}
                        disabled={materialSaving || userHasAlreadySubmitted}
                        className="bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 text-slate-950 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all text-xs font-bold shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 uppercase tracking-wider"
                        title={userHasAlreadySubmitted ? 'You have already submitted feedback' : ''}
                      >
                        <FontAwesomeIcon icon={faSave} />
                        {materialSaving ? 'Saving...' : userHasAlreadySubmitted ? 'Already submitted' : 'Save feedback'}
                      </button>
                    </div>

                    <hr className="my-6 border-slate-800" />
                    <h3 className="text-base font-bold text-app-text mb-3 border-b border-app-border pb-2">Feedback Summary</h3>
                    {materialFeedbackLoading ? (
                      <p className="text-xs text-app-text-muted">Loading...</p>
                    ) : (
                      <>
                        <div className="p-3.5 bg-app-bg border border-slate-850 rounded-lg mb-4 text-xs flex justify-between flex-wrap gap-4">
                          <p className="mb-0"><strong>Average rating:</strong> <span className="text-amber-400 ml-1 font-bold">{materialAverageRating > 0 ? `${materialAverageRating} / 5` : 'No ratings yet'}</span>
                            {materialFeedbacks.length > 0 && <span className="text-app-text-muted ml-2">({materialFeedbacks.length} rating{materialFeedbacks.length !== 1 ? 's' : ''})</span>}
                          </p>
                          <p className="mb-0"><strong>Tier votes:</strong> Top: {materialTierVotes.top} · Middle: {materialTierVotes.middle} · Lower: {materialTierVotes.lower}</p>
                        </div>
                        {materialFeedbacks.length === 0 ? (
                          <p className="text-xs text-app-text-muted">No feedback yet. Be the first to submit.</p>
                        ) : (
                          <div className="space-y-2">
                            {materialFeedbacks.map((f) => (
                              <div key={f._id} className="p-4 bg-app-surface-muted/80 border border-app-border rounded-xl text-xs flex flex-col gap-2">
                                <div className="flex justify-between text-app-text-muted border-b border-app-border/50 pb-1.5 font-bold">
                                  <span className="text-app-text-secondary font-bold text-xs">{f.username || 'Unknown'}</span>
                                  <span>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</span>
                                </div>
                                {f.tier && <p className="text-app-text-muted font-semibold mb-0 text-[11px] uppercase tracking-wider">Tier: {f.tier}</p>}
                                {(() => {
                                  const matO = computeCategoryOverall(f.ratingMaterials || {});
                                  const srvO = computeCategoryOverall(f.ratingServices || {});
                                  const overall = computeFeedbackOverall(matO, srvO) ?? f.starRating;
                                  if (overall == null) return null;
                                  return (
                                    <p className="text-amber-400 font-bold text-xs mb-0">
                                      Rating: {Number(overall).toFixed(1)} / 5
                                      {(matO != null || srvO != null) && (
                                        <span className="ml-2 text-app-text-muted text-[10px] font-semibold uppercase tracking-wide">
                                          {matO != null && `Materials: ${matO.toFixed(1)}`}
                                          {matO != null && srvO != null && ' · '}
                                          {srvO != null && `Services: ${srvO.toFixed(1)}`}
                                        </span>
                                      )}
                                    </p>
                                  );
                                })()}
                                {f.comment && <p className="mt-1 text-app-text-secondary whitespace-pre-wrap leading-relaxed">{f.comment}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback Form (Manual input, Edit/Add mode) */}
              {showForm && (
                <div className="mb-6 p-6 bg-app-surface border border-app-border rounded-2xl shadow-xl">
                  <h3 className="text-base font-bold mb-4 text-app-text">
                    {editingId ? 'Edit Feedback' : 'Add New Feedback'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Vendor Search Section */}
                    <div>
                      <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                        Search Vendor (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="w-full px-3 py-2 pl-10 bg-app-bg border border-app-border rounded-md focus:outline-none focus:border-app-accent text-app-text text-xs focus:ring-1 focus:ring-app-accent"
                          placeholder="Search for vendor by name..."
                        />
                        <FontAwesomeIcon 
                          icon={faSearch} 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted"
                        />
                        {vendorSearchLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-app-accent"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Vendor Search Results */}
                      {showVendorResults && vendors.length > 0 && (
                        <div className="mt-2 bg-app-surface border border-app-border rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-850">
                          {vendors.map((vendor, index) => (
                            <div
                              key={index}
                              onClick={() => handleVendorSelect(vendor)}
                              className="px-4 py-3 hover:bg-app-surface/80 cursor-pointer"
                            >
                              <div className="font-bold text-app-text text-xs">
                                {vendor["vendor-name"]}
                              </div>
                              <div className="text-[10px] text-app-text-muted mt-0.5">
                                Code: {vendor["vendor-code"]}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {showVendorResults && vendors.length === 0 && !vendorSearchLoading && searchTerm && (
                        <div className="mt-2 bg-app-bg border border-slate-850 rounded-md p-4 text-center text-app-text-muted text-xs">
                          No vendors found matching "{searchTerm}"
                        </div>
                      )}
                    </div>

                    {/* Pre-filled Vendor Information Display */}
                    {(formData.vendorCode || formData.vendorName) && (
                      <div className="bg-app-accent/10 border border-app-accent/20 rounded-md p-3.5">
                        <div className="text-xs font-bold text-app-accent uppercase tracking-wider mb-1">
                          Selected Vendor:
                        </div>
                        <div className="text-xs text-app-text-secondary leading-normal">
                          {formData.vendorName && (
                            <div><strong>Name:</strong> {formData.vendorName}</div>
                          )}
                          {formData.vendorCode && (
                            <div><strong>Code:</strong> {formData.vendorCode}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                          Vendor Code (Manual Entry)
                        </label>
                        <input
                          type="text"
                          value={formData.vendorCode}
                          onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                          className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-md focus:outline-none focus:border-app-accent text-app-text text-xs focus:ring-1 focus:ring-app-accent"
                          placeholder="Enter vendor code manually"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                          Vendor Name (Manual Entry)
                        </label>
                        <input
                          type="text"
                          value={formData.vendorName}
                          onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                          className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-md focus:outline-none focus:border-app-accent text-app-text text-xs focus:ring-1 focus:ring-app-accent"
                          placeholder="Enter vendor name manually"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                        Feedback *
                      </label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        required
                        rows={4}
                        className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-md focus:outline-none focus:border-app-accent text-app-text text-xs focus:ring-1 focus:ring-app-accent"
                        placeholder="Enter your feedback about the vendor..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-app-accent hover:bg-app-accent-hover text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md"
                      >
                        <FontAwesomeIcon icon={faSave} />
                        {editingId ? 'Update' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-app-surface hover:bg-app-surface-muted text-app-text-secondary px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border border-app-border"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Feedbacks List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center px-4 py-2 bg-app-surface border border-app-border rounded-lg shadow-md">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-app-accent mr-3"></div>
                      <span className="text-xs text-app-text-muted font-semibold">Loading feedbacks...</span>
                    </div>
                  </div>
                ) : filteredFeedbacks.length === 0 ? (
                  feedbackSearchTerm ? (
                    <div className="text-center py-12">
                      <div className="inline-block bg-app-surface border border-app-border rounded-xl shadow-lg p-8">
                        <div className="text-app-text-muted text-sm">
                          No feedbacks found matching "{feedbackSearchTerm}"
                        </div>
                      </div>
                    </div>
                  ) : null
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="w-full bg-app-surface border-l-4 border-l-cyan-500 border-y border-r border-app-border rounded-xl shadow-lg hover:shadow-xl hover:border-slate-700 transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 bg-app-accent rounded-full flex items-center justify-center text-slate-950 font-bold text-sm">
                                {feedback.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-app-text text-sm">
                                  {feedback.username}
                                </span>
                                <div className="text-[10px] text-app-text-muted">
                                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            {(feedback.vendorCode || feedback.vendorName) && (
                              <div className="mb-4 p-3 bg-app-bg rounded-lg border border-slate-850">
                                <div className="text-xs text-app-text-muted">
                                  {feedback.vendorCode && (
                                    <div className="mb-1">
                                      <span className="font-bold text-app-accent/95 text-[10px] uppercase tracking-wider">Vendor Code:</span> 
                                      <span className="ml-2 text-app-text-secondary font-semibold">{feedback.vendorCode}</span>
                                    </div>
                                  )}
                                  {feedback.vendorName && (
                                    <div>
                                      <span className="font-bold text-app-accent/95 text-[10px] uppercase tracking-wider">Vendor Name:</span> 
                                      <span className="ml-2 text-app-text-secondary font-semibold">{feedback.vendorName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-app-text-secondary leading-relaxed text-xs">
                              {feedback.comment}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(feedback)}
                              className="p-1.5 text-app-accent hover:text-app-accent hover:bg-app-surface rounded transition-all"
                              title="Edit feedback"
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(feedback._id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-app-surface rounded transition-all"
                              title="Delete feedback"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
