import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

function VendorDocumentUpload({ vendorCode, onUploadSuccess, onUploadError }) {
  const [files, setFiles] = useState([]);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const { data: session } = useSession();

  const documentTypes = [
    { value: 'CR', label: 'Commercial Registration (CR)' },
    { value: 'VAT', label: 'VAT Certificate' },
    { value: 'BROCHURE', label: 'Company Brochure' },
    { value: 'PROFILE', label: 'Company Profile' },
    { value: 'LICENSE', label: 'Business License' },
    { value: 'CERTIFICATE', label: 'Quality Certificate' },
    { value: 'INSURANCE', label: 'Insurance Certificate' },
    { value: 'ZATCA', label: 'ZATCA certificate' },
    { value: 'BANK_ACCOUNT_LETTER', label: 'Bank account letter' },
    { value: 'CLIENT_REFERENCES', label: 'Client references and project references list' },
    { value: 'APPROVAL_LETTERS', label: 'Approval letters from reputed clients' },
    { value: 'PREQUALIFICATION_SHEET', label: 'Vendor pre-qualification filledin sheet' },
    { value: 'OTHER', label: 'Other Document' }
  ];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vendorCode) {
      onUploadError('Vendor code is required');
      return;
    }

    if (files.length === 0) {
      onUploadError('Please select at least one file');
      return;
    }

    if (!documentType) {
      onUploadError('Please select a document type');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      
      // Add metadata
      formData.append('vendorCode', vendorCode);
      formData.append('documentType', documentType);
      formData.append('description', description);
      formData.append('uploadedBy', session?.user?.name || 'Unknown');
      formData.append('uploadedAt', new Date().toISOString());

      const response = await fetch('/api/vendors/upload-documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Reset form
      setFiles([]);
      setDocumentType('');
      setDescription('');
      e.target.reset();
      
      onUploadSuccess();
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <select
          id="documentType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select document type...</option>
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief description of the documents..."
        />
      </div>

      <div>
        <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
          Select Files *
        </label>
        <input
          type="file"
          id="files"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB per file)
        </p>
      </div>

      {files.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Files:</h4>
          <ul className="space-y-1">
            {files.map((file, index) => (
              <li key={index} className="text-sm text-blue-800">
                {file.name} ({formatFileSize(file.size)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || files.length === 0 || !documentType}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </div>
        ) : (
          'Upload Documents'
        )}
      </button>
    </form>
  );
}

export default VendorDocumentUpload;
