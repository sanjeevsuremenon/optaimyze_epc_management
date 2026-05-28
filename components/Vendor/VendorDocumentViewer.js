import React, { useState, useEffect, Suspense } from 'react';
import { FiDownload, FiTrash2, FiEye, FiFileText, FiImage, FiFile, FiX } from 'react-icons/fi';

// Removed react-file-viewer to fix findDOMNode crash

export default function VendorDocumentViewer({ vendorCode, refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (vendorCode) {
      fetchDocuments();
    }
  }, [vendorCode, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendors/documents/${vendorCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setViewMode(true);
  };

  const handleDownloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = `/${vendorCode}/${doc.filename}`;
    link.download = doc.originalName || doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/vendors/documents/${vendorCode}/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      fetchDocuments();
      
      if (selectedDocument && selectedDocument._id === documentId) {
        setViewMode(false);
        setSelectedDocument(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document');
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FiFileText className="text-rose-400 text-xl" />;
      case 'doc':
      case 'docx':
        return <FiFileText className="text-blue-400 text-xl" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FiImage className="text-emerald-400 text-xl" />;
      default:
        return <FiFile className="text-slate-400 text-xl" />;
    }
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      'CR': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'VAT': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      'BROCHURE': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      'PROFILE': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'LICENSE': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      'CERTIFICATE': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      'INSURANCE': 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      'ZATCA': 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
      'BANK_ACCOUNT_LETTER': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      'CLIENT_REFERENCES': 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      'APPROVAL_LETTERS': 'bg-lime-500/10 text-lime-400 border border-lime-500/20',
      'PREQUALIFICATION_SHEET': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      'OTHER': 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
    };
    return colors[type] || colors['OTHER'];
  };

  const filteredDocuments = filterType === 'ALL' 
    ? documents 
    : documents.filter(doc => doc.documentType === filterType);

  const uniqueDocumentTypes = [...new Set(documents.map(doc => doc.documentType))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-slate-400 font-medium">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-rose-500/20">
        <div className="text-rose-400 font-bold mb-2">Error Loading Documents</div>
        <div className="text-sm text-slate-400 mb-4">{error}</div>
        <button
          onClick={fetchDocuments}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <label htmlFor="filterType" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Filter by Type
            </label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Documents ({documents.length})</option>
              {uniqueDocumentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
          <FiFile className="mx-auto h-12 w-12 text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">
            {documents.length === 0 ? 'No documents uploaded yet.' : 'No documents match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <div key={document._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-cyan-900 transition-colors group flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  {getFileIcon(document.filename)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-200 truncate" title={document.filename}>
                    {document.filename}
                  </h3>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getDocumentTypeColor(document.documentType)}`}>
                      {document.documentType}
                    </span>
                  </div>
                </div>
              </div>
              
              {document.description && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1">{document.description}</p>
              )}
              {!document.description && <div className="flex-1"></div>}
              
              <div className="text-[10px] text-slate-500 mb-4 pt-4 border-t border-slate-800/80">
                Uploaded by <span className="text-slate-400 font-medium">{document.uploadedBy}</span> on {new Date(document.uploadedAt).toLocaleDateString()}
              </div>
              
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => handleViewDocument(document)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-cyan-900/40 text-cyan-400 rounded-lg transition-colors border border-slate-800 hover:border-cyan-800 text-xs font-semibold"
                  title="View Document"
                >
                  <FiEye /> View
                </button>
                <button
                  onClick={() => handleDownloadDocument(document)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-emerald-900/40 text-emerald-400 rounded-lg transition-colors border border-slate-800 hover:border-emerald-800 text-xs font-semibold"
                  title="Download Document"
                >
                  <FiDownload /> Save
                </button>
                <button
                  onClick={() => handleDeleteDocument(document._id)}
                  className="inline-flex items-center justify-center p-1.5 bg-slate-900 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors border border-slate-800 hover:border-rose-800"
                  title="Delete Document"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewMode && selectedDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedDocument.filename)}
                <h3 className="text-lg font-bold text-slate-100 truncate max-w-md" title={selectedDocument.filename}>
                  {selectedDocument.filename}
                </h3>
              </div>
              <button
                onClick={() => setViewMode(false)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Close Viewer"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-slate-950 relative rounded-b-2xl">
              {(() => {
                const fileType = selectedDocument.filename.split('.').pop().toLowerCase();
                const filePath = `/${vendorCode}/${selectedDocument.filename}`;

                if (fileType === 'pdf') {
                  return (
                    <iframe
                      src={filePath}
                      className="w-full h-full border-0"
                      title={selectedDocument.filename}
                    />
                  );
                } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
                  return (
                    <div className="flex items-center justify-center h-full p-4 bg-slate-900/50">
                      <img 
                        src={filePath} 
                        alt={selectedDocument.filename} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-800"
                      />
                    </div>
                  );
                } else {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                      <div className="text-center p-6 border border-rose-500/20 bg-rose-500/10 rounded-xl max-w-sm">
                        <FiFile className="mx-auto h-12 w-12 text-rose-400 mb-4" />
                        <h4 className="text-lg font-bold text-rose-400 mb-2">Format Not Supported</h4>
                        <p className="text-slate-300 text-sm mb-4">This file format cannot be previewed in the browser.</p>
                        <button 
                          onClick={() => handleDownloadDocument(selectedDocument)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 text-sm font-medium inline-flex items-center gap-2"
                        >
                          <FiDownload /> Download Instead
                        </button>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
