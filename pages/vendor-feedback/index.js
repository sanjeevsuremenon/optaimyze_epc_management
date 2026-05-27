import { useState, useEffect, useCallback } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-toastify';
import VendorFeedbackRatingCard from '../../components/VendorFeedbackRatingCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faSearch, faStar, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
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

  const currentUserId = session?.user?.email || session?.user?.id || '';
  const userHasAlreadySubmitted = Boolean(
    selectedVendorForFeedback &&
    currentUserId &&
    materialFeedbacks.some((f) => (f.userId || '').toString() === currentUserId.toString())
  );

  const handleSaveMaterialFeedback = useCallback(async () => {
    if (!selectedVendorForFeedback || !session) return;
    setMaterialSaving(true);
    try {
      const res = await fetch('/api/vendor-feedback/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vendorCode: selectedVendorForFeedback.vendorCode,
          vendorName: selectedVendorForFeedback.vendorName || '',
          tier: tier || undefined,
          ratingMaterials: Object.keys(ratingMaterials).length ? ratingMaterials : undefined,
          ratingServices: Object.keys(ratingServices).length ? ratingServices : undefined,
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
  }, [selectedVendorForFeedback, session, tier, ratingMaterials, ratingServices, comment]);

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

    // Check if session is available
    if (!session) {
      alert('Please log in to submit feedback');
      return;
    }

    console.log('Submitting feedback:', formData);
    console.log('Session:', session);

    try {
      const url = editingId ? `/api/vendor-feedback/${editingId}` : '/api/vendor-feedback';
      const method = editingId ? 'PUT' : 'POST';
      
      console.log('Making request to:', url, 'with method:', method);
      
      // Add a small delay to ensure session is ready
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

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

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
        console.error('Failed to save feedback:', response.status, errorData);
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

  // Handle vendor selection from search results
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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter feedbacks based on search term
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Head>
        <title>Vendor Feedback - OPTAIMYZE Portal</title>
        <meta name="description" content="User feedback on vendors" />
      </Head>
      
      <div className="flex-1">
        <div className="flex flex-col">
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-blue-200 px-4 py-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800">
                Vendor Feedback
              </h1>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-6 pb-16 mb-24">

              {/* --- Give feedback for a specific vendor (search + full feedback UI) --- */}
              <div className="mb-8 p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Give feedback for a vendor</h2>
                <p className="text-sm text-gray-600 mb-4">Search by vendor name (minimum 4 characters), then select a vendor to add tier, rating and comments.</p>
                <div className="relative max-w-xl">
                  <input
                    type="text"
                    value={vendorFeedbackSearchTerm}
                    onChange={(e) => setVendorFeedbackSearchTerm(e.target.value)}
                    placeholder="Type vendor name (min 4 characters)..."
                    className="w-full px-3 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {vendorFeedbackSearchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    </div>
                  )}
                </div>
                {vendorFeedbackSearchTerm.trim().length > 0 && vendorFeedbackSearchTerm.trim().length < MIN_VENDOR_SEARCH_LENGTH && (
                  <p className="mt-2 text-sm text-amber-600">Type at least {MIN_VENDOR_SEARCH_LENGTH} characters to search.</p>
                )}
                {vendorFeedbackResults.length > 0 && !selectedVendorForFeedback && (
                  <div
                    className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 relative"
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
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 focus:bg-blue-50 outline-none"
                        >
                          <div className="font-medium text-gray-900">{name || '—'}</div>
                          <div className="text-sm text-gray-600">Code: {code || '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {vendorFeedbackResults.length === 0 && vendorFeedbackSearchTerm.trim().length >= MIN_VENDOR_SEARCH_LENGTH && !vendorFeedbackSearchLoading && !selectedVendorForFeedback && (
                  <div className="mt-2 bg-white border border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
                    No vendors found. Try a different name.
                  </div>
                )}

                {/* Selected vendor feedback panel (tier, stars, comment, save, summary) */}
                {selectedVendorForFeedback && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-base font-semibold text-gray-800">Feedback for: {selectedVendorForFeedback.vendorName || selectedVendorForFeedback.vendorCode}</h3>
                      <button
                        type="button"
                        onClick={clearSelectedVendorForFeedback}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                        title="Choose different vendor"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} /> Choose different vendor
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2"><strong>Vendor code:</strong> {selectedVendorForFeedback.vendorCode}</p>
                    {subgroups.length > 0 && (
                      <p className="text-sm text-gray-600 mb-4"><strong>Subgroups mapped:</strong> {subgroups.map((sg) => `${sg.groupName} – ${sg.subgroupName}`).join('; ')}</p>
                    )}

                    <div className="space-y-4">
                      {userHasAlreadySubmitted && (
                        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                          You have already submitted feedback for this vendor. You cannot submit again.
                        </p>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                        <select
                          value={tier}
                          onChange={(e) => setTier(e.target.value)}
                          disabled={userHasAlreadySubmitted}
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {TIER_OPTIONS.map((opt) => (
                            <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1–5 stars per parameter)</label>
                        <VendorFeedbackRatingCard
                          ratingMaterials={ratingMaterials}
                          ratingServices={ratingServices}
                          onMaterialsChange={setRatingMaterials}
                          onServicesChange={setRatingServices}
                          disabled={userHasAlreadySubmitted}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          disabled={userHasAlreadySubmitted}
                          placeholder="Your feedback on the vendor's services..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveMaterialFeedback}
                        disabled={materialSaving || userHasAlreadySubmitted}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        title={userHasAlreadySubmitted ? 'You have already submitted feedback' : ''}
                      >
                        <FontAwesomeIcon icon={faSave} />
                        {materialSaving ? 'Saving...' : userHasAlreadySubmitted ? 'Already submitted' : 'Save feedback'}
                      </button>
                    </div>

                    <hr className="my-6 border-gray-200" />
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Feedback summary</h3>
                    {materialFeedbackLoading ? (
                      <p className="text-sm text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <div className="p-3 bg-gray-100 rounded-lg mb-4 text-sm">
                          <p className="mb-1"><strong>Average rating:</strong> {materialAverageRating > 0 ? `${materialAverageRating} / 5` : 'No ratings yet'}
                            {materialFeedbacks.length > 0 && <span className="text-gray-500 ml-1">({materialFeedbacks.length} rating{materialFeedbacks.length !== 1 ? 's' : ''})</span>}
                          </p>
                          <p><strong>Tier votes:</strong> Top: {materialTierVotes.top}, Middle: {materialTierVotes.middle}, Lower: {materialTierVotes.lower}</p>
                        </div>
                        {materialFeedbacks.length === 0 ? (
                          <p className="text-sm text-gray-500">No feedback yet. Be the first to submit.</p>
                        ) : (
                          <div className="space-y-2">
                            {materialFeedbacks.map((f) => (
                              <div key={f._id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                <div className="flex justify-between text-gray-600 mb-1">
                                  <span className="font-medium">{f.username || 'Unknown'}</span>
                                  <span>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</span>
                                </div>
                                {f.tier && <p className="text-gray-600">Tier: {f.tier}</p>}
                                {(() => {
                                  const matO = computeCategoryOverall(f.ratingMaterials || {});
                                  const srvO = computeCategoryOverall(f.ratingServices || {});
                                  const overall = computeFeedbackOverall(matO, srvO) ?? f.starRating;
                                  if (overall == null) return null;
                                  return (
                                    <p className="text-amber-700">
                                      Rating: {Number(overall).toFixed(1)} / 5
                                      {(matO != null || srvO != null) && (
                                        <span className="ml-1 text-gray-500 text-xs">
                                          {matO != null && `Materials: ${matO.toFixed(1)}`}
                                          {matO != null && srvO != null && ' · '}
                                          {srvO != null && `Services: ${srvO.toFixed(1)}`}
                                        </span>
                                      )}
                                    </p>
                                  );
                                })()}
                                {f.comment && <p className="mt-1 whitespace-pre-wrap">{f.comment}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback Form */}
              {showForm && (
                <div className="mb-6 p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {editingId ? 'Edit Feedback' : 'Add New Feedback'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Vendor Search Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Vendor (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Search for vendor by name..."
                        />
                        <FontAwesomeIcon 
                          icon={faSearch} 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        {vendorSearchLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Vendor Search Results */}
                      {showVendorResults && vendors.length > 0 && (
                        <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {vendors.map((vendor, index) => (
                            <div
                              key={index}
                              onClick={() => handleVendorSelect(vendor)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {vendor["vendor-name"]}
                              </div>
                              <div className="text-sm text-gray-600">
                                Code: {vendor["vendor-code"]}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {showVendorResults && vendors.length === 0 && !vendorSearchLoading && searchTerm && (
                        <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
                          No vendors found matching "{searchTerm}"
                        </div>
                      )}
                    </div>

                    {/* Pre-filled Vendor Information Display */}
                    {(formData.vendorCode || formData.vendorName) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          Selected Vendor:
                        </div>
                        <div className="text-sm text-blue-700">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Code (Manual Entry)
                        </label>
                        <input
                          type="text"
                          value={formData.vendorCode}
                          onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Enter vendor code manually"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Name (Manual Entry)
                        </label>
                        <input
                          type="text"
                          value={formData.vendorName}
                          onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Enter vendor name manually"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback *
                      </label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Enter your feedback about the vendor..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                      >
                        <FontAwesomeIcon icon={faSave} />
                        {editingId ? 'Update' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
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
                    <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                      Loading feedbacks...
                    </div>
                  </div>
                ) : filteredFeedbacks.length === 0 ? (
                  feedbackSearchTerm ? (
                    <div className="text-center py-12">
                      <div className="inline-block bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-blue-200">
                        <div className="text-gray-500 text-lg">
                          No feedbacks found matching "{feedbackSearchTerm}"
                        </div>
                      </div>
                    </div>
                  ) : null
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-l-4 border-l-blue-500 border-r-4 border-r-blue-500 border-t border-b border-blue-200 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {feedback.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-lg">
                                  {feedback.username}
                                </span>
                                <div className="text-sm text-gray-500">
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
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm text-gray-700">
                                  {feedback.vendorCode && (
                                    <div className="mb-1">
                                      <span className="font-medium text-blue-700">Vendor Code:</span> 
                                      <span className="ml-2 text-gray-800">{feedback.vendorCode}</span>
                                    </div>
                                  )}
                                  {feedback.vendorName && (
                                    <div>
                                      <span className="font-medium text-blue-700">Vendor Name:</span> 
                                      <span className="ml-2 text-gray-800">{feedback.vendorName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-gray-700 leading-relaxed text-base">
                              {feedback.comment}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(feedback)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit feedback"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDelete(feedback._id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete feedback"
                            >
                              <FontAwesomeIcon icon={faTrash} />
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
