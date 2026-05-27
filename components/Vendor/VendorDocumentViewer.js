import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';

// Lazy load the file viewer to avoid SSR issues
const FileViewer = React.lazy(() => import('react-file-viewer'));

function VendorDocumentViewer({ vendorCode, refreshTrigger }) {
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
    console.log('Viewing document:', doc);
    console.log('File path:', `/${vendorCode}/${doc.filename}`);
    setSelectedDocument(doc);
    setViewMode(true);
  };

  const handleDownloadDocument = (doc) => {
    console.log('Downloading document:', doc);
    console.log('Download URL:', `/${vendorCode}/${doc.filename}`);
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

      // Refresh the document list
      fetchDocuments();
      
      // Close viewer if the deleted document was being viewed
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
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      'CR': 'bg-blue-100 text-blue-800',
      'VAT': 'bg-green-100 text-green-800',
      'BROCHURE': 'bg-purple-100 text-purple-800',
      'PROFILE': 'bg-yellow-100 text-yellow-800',
      'LICENSE': 'bg-red-100 text-red-800',
      'CERTIFICATE': 'bg-indigo-100 text-indigo-800',
      'INSURANCE': 'bg-pink-100 text-pink-800',
      'ZATCA': 'bg-teal-100 text-teal-800',
      'BANK_ACCOUNT_LETTER': 'bg-orange-100 text-orange-800',
      'CLIENT_REFERENCES': 'bg-cyan-100 text-cyan-800',
      'APPROVAL_LETTERS': 'bg-lime-100 text-lime-800',
      'PREQUALIFICATION_SHEET': 'bg-amber-100 text-amber-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['OTHER'];
  };

  const filteredDocuments = filterType === 'ALL' 
    ? documents 
    : documents.filter(doc => doc.documentType === filterType);

  const uniqueDocumentTypes = [...new Set(documents.map(doc => doc.documentType))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading documents</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button
          onClick={fetchDocuments}
          className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      {documents.length > 0 && (
        <div>
          <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by type:
          </label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Documents</option>
            {uniqueDocumentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match the selected filter'}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDocuments.map((document) => (
            <div key={document._id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getFileIcon(document.filename)}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {document.filename}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(document.documentType)}`}>
                      {document.documentType}
                    </span>
                  </div>
                  
                  {document.description && (
                    <p className="text-xs text-gray-600 mb-1">{document.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Uploaded by {document.uploadedBy} on {new Date(document.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleViewDocument(document)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    title="View document"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(document)}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                    title="Download document"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(document._id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                    title="Delete document"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewMode && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDocument.filename}
              </h3>
              <button
                onClick={() => setViewMode(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading document...</span>
                </div>
              }>
                <FileViewer
                  fileType={selectedDocument.filename.split('.').pop()}
                  filePath={`/${vendorCode}/${selectedDocument.filename}`}
                  onError={(error) => console.error('FileViewer error:', error)}
                  errorComponent={<div className="text-center p-4 text-red-600">Error loading document</div>}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorDocumentViewer;
