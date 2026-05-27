import { useState, useRef } from 'react';
import VendorGroupMapping from '../../components/VendorGroupMapping';

export default function VendorGroupMappingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  // Function to generate vendor code from vendor name (first 5 + last 4 characters)
  const generateVendorCode = (vendorName) => {
    if (!vendorName || vendorName.length < 5) {
      return vendorName; // Return as is if too short
    }
    
    const first5 = vendorName.substring(0, 5);
    const last4 = vendorName.substring(vendorName.length - 4);
    return first5 + last4;
  };

  const searchVendors = async (term) => {
    if (!term || term.length < 3) {
      setVendors([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for term:', term);
      const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(term)}`);
      console.log('Search response status:', response.status);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      console.log('Search results:', data);
      setVendors(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      searchVendors(term);
    }, 300);
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
    setSearchTerm(vendor.vendorname);
    setVendors([]); // Clear search results
  };

  return (
    <>
    <div className="container mx-auto h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Vendor Group Mapping</h1>

      {/* Search Section */}
      <div className="mb-8 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search vendor by name or code (min 3 characters)..."
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {vendors.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {vendors.map((vendor) => (
              <div
                key={`${vendor.vendorcode}-${vendor.source}`}
                onClick={() => handleVendorSelect(vendor)}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium">{vendor.vendorname}</div>
                <div className="text-sm text-gray-600">
                  Code: {vendor.vendorcode} | Source: {vendor.source}
                  {vendor.source === 'registeredvendors' && vendor.vendorcode === 'NA' && (
                    <span className="text-xs text-blue-600 ml-2">
                      (Will generate: {generateVendorCode(vendor.vendorname)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}

        {searchTerm.length >= 3 && vendors.length === 0 && !isSearching && !selectedVendor && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-gray-500">
            No vendors found matching "{searchTerm}"
          </div>
        )}

        {searchTerm.length > 0 && searchTerm.length < 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-gray-500">
            Please enter at least 3 characters to search
          </div>
        )}
      </div>

      {/* Mapping Component */}
      {selectedVendor && (
        <div className="mt-4">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selected Vendor: {selectedVendor.vendorname}
            </h3>
            <p className="text-sm text-gray-600">
              Vendor Code: {selectedVendor.vendorcode}
              {selectedVendor.source === 'registeredvendors' && selectedVendor.vendorcode !== 'NA' && (
                <span className="text-xs text-blue-600 ml-2">
                  (Generated from vendor name)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600">
              Source: {selectedVendor.source}
            </p>
          </div>
          <VendorGroupMapping 
            vendorCode={selectedVendor.vendorcode}
            vendorName={selectedVendor.vendorname}
          />
        </div>
      )}

      {/* No vendor selected state */}
      {!selectedVendor && (
        <div className="text-center text-gray-500 mt-8">
          Search and select a vendor to manage group mappings
        </div>
      )}
    </div>
    </>
  );
} 