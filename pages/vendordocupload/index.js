import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import VendorDocumentUpload from '../../components/Vendor/VendorDocumentUpload';
import SubcontractorDocumentsUpload from '../../components/Vendor/SubcontractorDocumentsUpload';
import VendorDocumentViewer from '../../components/Vendor/VendorDocumentViewer';
import VendorAdditionalInfoForm from '../../components/Vendor/VendorAdditionalInfoForm';

export default function VendorDocUploadPage() {
  const { data: session } = useSession();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [refreshDocuments, setRefreshDocuments] = useState(false);
  const [isSubcontractor, setIsSubcontractor] = useState(false);

  // Fetch vendors for selection using the same API as vendor-dashboard
  useEffect(() => {
    const fetchVendors = async () => {
      if (searchTerm.length >= 3) {
        try {
          const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(searchTerm)}`);
          const data = await response.json();
          setVendors(data);
        } catch (error) {
          console.error('Error fetching vendors:', error);
        }
      } else {
        setVendors([]);
      }
    };

    fetchVendors();
  }, [searchTerm]);

  // Function to generate vendor code from vendor name (first 5 + last 5 characters)
  const generateVendorCode = (vendorName) => {
    if (!vendorName || vendorName.length < 5) {
      return vendorName; // Return as is if too short
    }
    
    const first5 = vendorName.substring(0, 5);
    const last5 = vendorName.substring(vendorName.length - 5);
    return first5 + last5;
  };

  const handleVendorSelect = (vendor) => {
    // Generate vendor code for registeredvendors with NA vendorcode
    const processedVendor = {
      ...vendor,
      vendorcode: vendor.source === 'registeredvendors' && vendor.vendorcode === 'NA' 
        ? generateVendorCode(vendor.vendorname)
        : vendor.vendorcode
    };
    
    setSelectedVendor(processedVendor);
    setShowUploadForm(true);
    setRefreshDocuments(false);
  };

  const handleUploadSuccess = () => {
    toast.success('Documents uploaded successfully!', {
      position: "top-right",
      autoClose: 3000,
    });
    setRefreshDocuments(true);
  };

  const handleUploadError = (error) => {
    toast.error(`Upload failed: ${error}`, {
      position: "top-right",
      autoClose: 5000,
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-300 py-8" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d6d3d1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Document Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload and manage vendor documents including CR, VAT copies, brochures, and profile documents.
            </p>
          </div>

          <div className="p-6">
            {!selectedVendor ? (
              <div className="bg-stone-300 p-6 rounded-lg" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d6d3d1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Vendor</h2>
                <div className="mb-6">
                  <label htmlFor="vendor-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search for vendor by name or code:
                  </label>
                  <input
                    type="text"
                    id="vendor-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type vendor name or code (min 3 characters)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                {vendors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-md font-medium text-gray-700">Search Results:</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-inner">
                      {vendors.map((vendor) => (
                        <div
                          key={vendor._id}
                          onClick={() => handleVendorSelect(vendor)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{vendor.vendorname}</h4>
                              <p className="text-sm text-gray-600">
                                Code: {vendor.vendorcode} | Source: {vendor.source}
                              </p>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">Select</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchTerm.length >= 3 && vendors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No vendors found matching "{searchTerm}"
                  </div>
                )}

                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <div className="text-center py-8 text-gray-500">
                    Please enter at least 3 characters to search
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Managing Documents for: {selectedVendor.vendorname}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Vendor Code: {selectedVendor.vendorcode}
                      {selectedVendor.source === 'registeredvendors' && selectedVendor.vendorcode !== 'NA' && (
                        <span className="text-xs text-blue-600 ml-2">
                          (Generated from vendor name)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedVendor(null);
                      setShowUploadForm(false);
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Change Vendor
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Form */}
                  <div className="bg-zinc-200 p-6 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-300 border border-zinc-300">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
                    <VendorDocumentUpload
                      vendorCode={selectedVendor.vendorcode}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  </div>

                  {/* Document Viewer */}
                  <div className="bg-zinc-200 p-6 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-300 border border-zinc-300">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
                    <VendorDocumentViewer
                      vendorCode={selectedVendor.vendorcode}
                      refreshTrigger={refreshDocuments}
                    />
                  </div>
                </div>

                {/* Subcontractor Selection and Section */}
                <div className="mt-6 bg-zinc-200 border border-zinc-300 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <div className="px-6 py-4 border-b border-zinc-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Type</h3>
                    <p className="text-sm text-gray-600 mb-4">Select vendor type to show relevant document upload options.</p>
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="vendorType"
                          value="regular"
                          checked={!isSubcontractor}
                          onChange={(e) => setIsSubcontractor(e.target.value === 'subcontractor')}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Regular Vendor</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="vendorType"
                          value="subcontractor"
                          checked={isSubcontractor}
                          onChange={(e) => setIsSubcontractor(e.target.value === 'subcontractor')}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Subcontractor</span>
                      </label>
                    </div>
                  </div>
                  {isSubcontractor && (
                    <div className="p-6 bg-zinc-100">
                      <SubcontractorDocumentsUpload
                        vendorCode={selectedVendor.vendorcode}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                      />
                    </div>
                  )}
                </div>

                {/* Additional Information Form */}
                <div className="mt-6 bg-zinc-200 border border-zinc-300 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <div className="px-6 py-4 border-b border-zinc-300">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Company Information</h3>
                    <p className="text-sm text-gray-600">Provide company profile details to assist evaluation.</p>
                  </div>
                  <div className="p-6 bg-zinc-100">
                    <VendorAdditionalInfoForm
                      vendorCode={selectedVendor.vendorcode}
                      onSaved={() => toast.success('Additional information saved', { position: 'top-right', autoClose: 2000 })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
