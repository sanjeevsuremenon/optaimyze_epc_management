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

    // Check if session is available
    if (!session) {
      alert('Please log in to submit feedback');
      return;
    }

    try {
      const url = editingId ? `/api/po-feedback/${editingId}` : '/api/po-feedback';
      const method = editingId ? 'PUT' : 'POST';
      
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

  // Filter feedbacks based on search term
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Head>
        <title>PO Feedback - OPTAIMYZE Portal</title>
        <meta name="description" content="User feedback on purchase orders" />
      </Head>
      
      <div className="flex-1">
        <div className="flex flex-col">
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-blue-200 px-4 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Purchase Order Feedback
              </h1>
              
              {/* Search Box */}
              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Search feedbacks..."
                  />
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Feedback
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-6 pb-16 mb-24">

              {/* Feedback Form */}
              {showForm && (
                <div className="mb-6 p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {editingId ? 'Edit Feedback' : 'Add New Feedback'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PO Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.poNumber}
                          onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Enter PO number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PO Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.poTitle}
                          onChange={(e) => setFormData({ ...formData, poTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Enter PO title"
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
                        placeholder="Enter your feedback about the purchase order..."
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
                  <div className="text-center py-12">
                    <div className="inline-block bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-blue-200">
                      <div className="text-gray-500 text-lg">
                        {searchTerm ? `No feedbacks found matching "${searchTerm}"` : 'No feedback available yet. Be the first to share your feedback!'}
                      </div>
                    </div>
                  </div>
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
                            
                            {(feedback.poNumber || feedback.poTitle) && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm text-gray-700">
                                  {feedback.poNumber && (
                                    <div className="mb-1">
                                      <span className="font-medium text-blue-700">PO Number:</span> 
                                      <span className="ml-2 text-gray-800">{feedback.poNumber}</span>
                                    </div>
                                  )}
                                  {feedback.poTitle && (
                                    <div>
                                      <span className="font-medium text-blue-700">Title:</span> 
                                      <span className="ml-2 text-gray-800">{feedback.poTitle}</span>
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
