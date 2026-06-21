import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { FiX, FiEdit2, FiTrash2, FiMessageSquare } from 'react-icons/fi';

export default function POCommentModal({ isOpen, onClose, poNumber }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isOpen && poNumber) {
      fetchComments();
    } else {
      // Reset state when closed
      setTitle('');
      setComment('');
      setEditingId(null);
    }
  }, [isOpen, poNumber]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchaseorders/openpo/comments/${poNumber}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) {
      toast.warn('Please provide a title and comment.');
      return;
    }

    try {
      if (editingId) {
        // Update existing comment
        const res = await fetch(`/api/purchaseorders/openpo/comments/${poNumber}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, title, comment, user: session.user.name }),
        });
        if (res.ok) {
          toast.success('Comment updated!');
          setEditingId(null);
          setTitle('');
          setComment('');
          fetchComments();
        } else {
          toast.error('Failed to update comment');
        }
      } else {
        // Create new comment
        const res = await fetch(`/api/purchaseorders/openpo/comments/${poNumber}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, comment, user: session.user.name }),
        });
        if (res.ok) {
          toast.success('Comment added!');
          setTitle('');
          setComment('');
          fetchComments();
        } else {
          toast.error('Failed to add comment');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving comment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/purchaseorders/openpo/comments/${poNumber}?commentId=${id}&user=${encodeURIComponent(session.user.name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Comment deleted');
        fetchComments();
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting comment');
    }
  };

  const handleEditClick = (c) => {
    setEditingId(c._id);
    setTitle(c.title);
    setComment(c.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setComment('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-app-border">
          <h2 className="text-xl font-bold text-app-text flex items-center">
            <FiMessageSquare className="mr-3 text-app-accent" />
            Comments for PO: {poNumber}
          </h2>
          <button onClick={onClose} className="p-2 text-app-text-muted hover:text-app-text bg-app-surface-muted hover:bg-app-surface-muted rounded-full transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Comments List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-app-text-muted uppercase tracking-wider">Previous Comments ({comments.length})</h3>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-app-accent border-t-transparent rounded-full"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-app-text-muted italic">No comments yet. Be the first to add one!</p>
            ) : (
              comments.map((c) => {
                const isOwner = c.updatedBy === session?.user?.name;
                return (
                  <div key={c._id} className="bg-app-surface-muted border border-app-border/50 rounded-lg p-4 transition-colors hover:bg-app-surface">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-app-text">{c.title}</h4>
                        <div className="text-xs text-app-text-muted mt-1">
                          By <span className="text-app-accent font-medium">{c.updatedBy}</span> on {new Date(c.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditClick(c)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Edit">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(c._id)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded transition-colors" title="Delete">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div 
                      className="text-app-text-secondary text-sm prose prose-invert prose-sm max-w-none prose-p:leading-snug prose-li:my-0"
                      dangerouslySetInnerHTML={{ __html: c.comment }} 
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Add/Edit Form */}
          <div className="bg-app-bg/50 p-5 rounded-lg border border-app-border">
            <h3 className="text-sm font-semibold text-app-text-secondary mb-4 uppercase tracking-wider">
              {editingId ? 'Edit Comment' : 'Add New Comment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-app-text-muted mb-1">Subject / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a brief subject..."
                  className="w-full px-4 py-2.5 bg-app-surface border border-app-border rounded-lg text-app-text focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-app-text-muted mb-1">Comment</label>
                <textarea
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type your detailed comment here..."
                  className="w-full px-4 py-3 bg-app-surface border border-app-border rounded-lg text-app-text focus:ring-1 focus:ring-app-accent focus:border-app-accent transition-colors"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={editingId ? cancelEdit : onClose}
                  className="px-4 py-2 bg-app-surface hover:bg-app-surface-muted text-app-text-secondary rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                >
                  <FiX size={16} /> {editingId ? 'Cancel Edit' : 'Close'}
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !comment.trim()}
                  className="px-5 py-2 bg-app-accent hover:bg-app-accent disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-md"
                >
                  {editingId ? 'Save Changes' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
