import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

export default function POFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    comment: '',
    poNumber: '',
    poTitle: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchFeedbacks();
    }
  }, [session]);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch('/api/po-feedback', {
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
      const url = editingId ? `/api/po-feedback/${editingId}` : '/api/po-feedback';
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
        setFormData({ comment: '', poNumber: '', poTitle: '' });
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
      poNumber: feedback.poNumber || '',
      poTitle: feedback.poTitle || ''
    });
    setEditingId(feedback._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch(`/api/po-feedback/${id}`, {
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
    setFormData({ comment: '', poNumber: '', poTitle: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      feedback.comment?.toLowerCase().includes(searchLower) ||
      feedback.poNumber?.toLowerCase().includes(searchLower) ||
      feedback.poTitle?.toLowerCase().includes(searchLower) ||
      feedback.username?.toLowerCase().includes(searchLower)
    );
  });

  if (status === 'loading') {
    return (
      <div className="app-page min-h-screen flex items-center justify-center text-app-text">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="app-page min-h-full flex-1 flex flex-col text-app-text">
      <Head>
        <title>PO Feedback - OPTAIMYZE Portal</title>
        <meta name="description" content="User feedback on purchase orders" />
      </Head>

      <div className="flex-1 w-full">
        <div className="flex-shrink-0 bg-app-surface border-b border-app-border px-4 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-app-text">
                Purchase Order Feedback
              </h1>
              <p className="text-xs text-app-text-muted mt-1">
                Submit and view feedback on purchase orders
              </p>
            </div>

            <div className="flex flex-1 max-w-md w-full sm:mx-4 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 pr-4 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text text-sm placeholder:text-app-text-disabled"
                placeholder="Search feedbacks..."
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-app-accent hover:bg-app-accent-hover text-app-accent-text px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Feedback
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 pb-16 space-y-6">
          {showForm && (
            <div className="p-6 bg-app-surface border border-app-border rounded-2xl shadow-sm">
              <h3 className="text-base font-bold mb-4 text-app-text">
                {editingId ? 'Edit Feedback' : 'Add New Feedback'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                      PO Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text text-sm"
                      placeholder="Enter PO number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                      PO Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.poTitle}
                      onChange={(e) => setFormData({ ...formData, poTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text text-sm"
                      placeholder="Enter PO title"
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
                    className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text text-sm"
                    placeholder="Enter your feedback about the purchase order..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-app-accent hover:bg-app-accent-hover text-app-accent-text px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {editingId ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 bg-app-surface hover:bg-app-surface-muted text-app-text-secondary px-4 py-2 rounded-lg text-sm font-semibold transition border border-app-border"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 bg-app-surface border border-app-border rounded-lg shadow-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-app-accent mr-3" />
                  <span className="text-xs text-app-text-muted font-semibold">Loading feedbacks...</span>
                </div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block bg-app-surface border border-app-border rounded-xl shadow-sm p-8">
                  <div className="text-app-text-muted text-sm">
                    {searchTerm
                      ? `No feedbacks found matching "${searchTerm}"`
                      : 'No feedback available yet. Be the first to share your feedback!'}
                  </div>
                </div>
              </div>
            ) : (
              filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="w-full bg-app-surface border-l-4 border-l-app-accent border-y border-r border-app-border rounded-xl shadow-sm hover:shadow-md hover:border-app-border-light transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 bg-app-accent rounded-full flex items-center justify-center text-app-accent-text font-bold text-sm">
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

                        {(feedback.poNumber || feedback.poTitle) && (
                          <div className="mb-4 p-3 bg-app-bg rounded-lg border border-app-border">
                            <div className="text-xs text-app-text-muted">
                              {feedback.poNumber && (
                                <div className="mb-1">
                                  <span className="font-bold text-app-accent text-[10px] uppercase tracking-wider">
                                    PO Number:
                                  </span>
                                  <span className="ml-2 text-app-text-secondary font-semibold">
                                    {feedback.poNumber}
                                  </span>
                                </div>
                              )}
                              {feedback.poTitle && (
                                <div>
                                  <span className="font-bold text-app-accent text-[10px] uppercase tracking-wider">
                                    Title:
                                  </span>
                                  <span className="ml-2 text-app-text-secondary font-semibold">
                                    {feedback.poTitle}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-app-text-secondary leading-relaxed text-sm">
                          {feedback.comment}
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEdit(feedback)}
                          className="p-1.5 text-app-accent hover:bg-app-surface-muted rounded transition-all"
                          title="Edit feedback"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(feedback._id)}
                          className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-app-surface-muted rounded transition-all"
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
