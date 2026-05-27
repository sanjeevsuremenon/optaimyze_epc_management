import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import VendorDocumentViewer from '../../components/Vendor/VendorDocumentViewer';

export default function VendorDocViewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { vendorcode } = router.query;
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vendorcode) {
      fetchVendorInfo();
    }
  }, [vendorcode]);

  const fetchVendorInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(vendorcode)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vendor information');
      }
      
      const vendors = await response.json();
      const vendor = vendors.find(v => v.vendorcode === vendorcode);
      
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      setVendorInfo(vendor);
    } catch (err) {
      console.error('Error fetching vendor info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go Back
            </button>
            <Link
              href="/vendordocupload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vendorInfo.vendorname} - Documents
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Vendor Code: {vendorInfo.vendorcode} | 
                  Source: {vendorInfo.source}
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/vendordocupload"
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Upload More Documents
                </Link>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <VendorDocumentViewer
              vendorCode={vendorcode}
              refreshTrigger={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
