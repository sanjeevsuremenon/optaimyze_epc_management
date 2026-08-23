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
      <div className="app-page min-h-screen flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-rose-500 mb-4">Access Denied</h1>
          <p className="text-app-text-muted mb-8">Please sign in to access this page.</p>
          <Link href="/auth/login" className="app-btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="app-card shadow">
          <div className="px-6 py-4 border-b border-app-border">
            <h1 className="text-2xl font-bold text-app-text">View Vendor Documents</h1>
            <p className="mt-1 text-sm text-app-text-muted">
              Search for a vendor to view their uploaded documents.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="vendor-search" className="block text-sm font-medium text-app-text-secondary mb-2">
                Search for vendor by name or code:
              </label>
              <input
                type="text"
                id="vendor-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type vendor name or code (min 3 characters)..."
                className="app-input"
              />
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
                <span className="ml-2 text-app-text-muted">Searching...</span>
              </div>
            )}

            {vendors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-md font-medium text-app-text-secondary mb-4">Search Results:</h3>
                <div className="grid gap-4">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor._id}
                      className="p-4 border border-app-border rounded-xl hover:bg-app-surface-muted transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-app-text text-lg">{vendor.vendorname}</h4>
                          <p className="text-sm text-app-text-secondary mt-1">
                            Code: {vendor.vendorcode} | Source: {vendor.source}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Link
                            href={`/vendordocview/${vendor.vendorcode}`}
                            className="app-btn-primary"
                          >
                            View Documents
                          </Link>
                          <Link
                            href={`/vendordocupload`}
                            className="app-btn-secondary"
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
              <div className="text-center py-8 text-app-text-disabled">
                No vendors found matching "{searchTerm}"
              </div>
            )}

            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="text-center py-8 text-app-text-disabled">
                Please enter at least 3 characters to search
              </div>
            )}

            {searchTerm.length === 0 && (
              <div className="text-center py-8 text-app-text-disabled">
                Enter at least 3 characters to search for vendors
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
