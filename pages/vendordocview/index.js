import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function VendorDocViewIndexPage() {
  const { data: session } = useSession();
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      fetchVendors();
    } else {
      setVendors([]);
    }
  }, [searchTerm]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">View Vendor Documents</h1>
            <p className="mt-1 text-sm text-gray-600">
              Search for a vendor to view their uploaded documents.
            </p>
          </div>

          <div className="p-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}

            {vendors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-md font-medium text-gray-700 mb-4">Search Results:</h3>
                <div className="grid gap-4">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor._id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-lg">{vendor.vendorname}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Code: {vendor.vendorcode} | Source: {vendor.source}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Link
                            href={`/vendordocview/${vendor.vendorcode}`}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            View Documents
                          </Link>
                          <Link
                            href={`/vendordocupload`}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Upload Documents
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchTerm.length >= 3 && vendors.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No vendors found matching "{searchTerm}"
              </div>
            )}

            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="text-center py-8 text-gray-500">
                Please enter at least 3 characters to search
              </div>
            )}

            {searchTerm.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Enter at least 3 characters to search for vendors
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
