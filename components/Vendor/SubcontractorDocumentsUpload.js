import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

function SubcontractorDocumentsUpload({ vendorCode, onUploadSuccess, onUploadError }) {
  const { data: session } = useSession();
  const [files, setFiles] = useState({
    saudizationCertificate: null,
    contractorsCouncilMembership: null,
    completedWorksCertificates: null,
    keyPersonnelResumes: null,
    keyEquipmentList: null,
    contractorClassification: null,
    organizationChart: null,
  });
  const [uploading, setUploading] = useState(false);

  const labels = {
    saudizationCertificate: 'Certificate from Labor Office attesting Saudization adherence',
    contractorsCouncilMembership: 'Valid Membership Certificate from Saudi Council of Contractors',
    completedWorksCertificates: 'Works completed with completion certificates from clients',
    keyPersonnelResumes: 'Resumes of key technical personnel',
    keyEquipmentList: 'List and details of key equipment',
    contractorClassification: 'Contractor classification certificate',
    organizationChart: 'Organization chart',
  };

  const documentTypeMap = {
    saudizationCertificate: 'SUBC_SAUDIZATION_CERT',
    contractorsCouncilMembership: 'SUBC_CONTRACTORS_COUNCIL',
    completedWorksCertificates: 'SUBC_COMPLETED_WORKS',
    keyPersonnelResumes: 'SUBC_KEY_PERSONNEL_RESUMES',
    keyEquipmentList: 'SUBC_KEY_EQUIPMENT',
    contractorClassification: 'SUBC_CLASSIFICATION',
    organizationChart: 'SUBC_ORG_CHART',
  };

  const handleChange = (key) => (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const uploadSingle = async (key, file) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('vendorCode', vendorCode);
    formData.append('documentType', documentTypeMap[key]);
    formData.append('description', labels[key]);
    formData.append('uploadedBy', session?.user?.name || 'Unknown');
    formData.append('uploadedAt', new Date().toISOString());

    const res = await fetch('/api/vendors/upload-documents', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed for ${labels[key]}`);
    }
    return res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorCode) {
      onUploadError && onUploadError('Vendor code is required');
      return;
    }

    const entries = Object.entries(files).filter(([, file]) => !!file);
    if (entries.length === 0) {
      onUploadError && onUploadError('Select at least one subcontractor document to upload');
      return;
    }

    setUploading(true);
    try {
      for (const [key, file] of entries) {
        await uploadSingle(key, file);
      }
      // Reset
      setFiles({
        saudizationCertificate: null,
        contractorsCouncilMembership: null,
        completedWorksCertificates: null,
        keyPersonnelResumes: null,
        keyEquipmentList: null,
        contractorClassification: null,
        organizationChart: null,
      });
      (e.target && e.target.reset && e.target.reset());
      onUploadSuccess && onUploadSuccess();
    } catch (err) {
      onUploadError && onUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.keys(labels).map((key) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{labels[key]}</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleChange(key)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={uploading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload Subcontractor Documents'}
      </button>
    </form>
  );
}

export default SubcontractorDocumentsUpload;
