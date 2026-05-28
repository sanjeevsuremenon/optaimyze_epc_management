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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-center">
          <div className="w-1.5 h-8 bg-cyan-500 rounded-full mr-4"></div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              Vendor Group Mapping
            </h1>
            <p className="text-slate-400 text-sm">
              Search for a vendor to map them to specific material or service groups
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg p-6 mb-8 relative">
          <label className="block text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
            Search Vendor
            {isSearching && (
              <span className="ml-2 text-xs text-cyan-500">Searching...</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search vendor by name or code (min 3 characters)..."
              className="w-full px-5 py-3.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 placeholder-slate-600 transition-colors shadow-inner"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {vendors.length > 0 && (
            <div className="absolute z-50 w-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {vendors.map((vendor) => (
                <div
                  key={`${vendor.vendorcode}-${vendor.source}`}
                  onClick={() => handleVendorSelect(vendor)}
                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-b-0 transition-colors duration-150"
                >
                  <div className="font-medium text-slate-200">{vendor.vendorname}</div>
                  <div className="text-sm text-slate-400 mt-0.5">
                    Code: <span className="font-mono text-cyan-400">{vendor.vendorcode}</span> | Source: {vendor.source}
                    {vendor.source === 'registeredvendors' && vendor.vendorcode === 'NA' && (
                      <span className="text-xs text-amber-400 ml-2 font-medium bg-amber-900/30 px-2 py-0.5 rounded border border-amber-800/50">
                        (Will generate: {generateVendorCode(vendor.vendorname)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 3 && vendors.length === 0 && !isSearching && !selectedVendor && (
            <div className="absolute z-50 w-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 text-center text-slate-400 text-sm">
              No vendors found matching "{searchTerm}"
            </div>
          )}

          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <div className="absolute z-50 w-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 text-center text-slate-400 text-sm">
              Please enter at least 3 characters to search
            </div>
          )}
        </div>

        {/* Mapping Component */}
        {selectedVendor && (
          <div className="mt-8">
            <div className="mb-6 p-5 bg-cyan-950/30 border border-cyan-900/50 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-white mb-2">
                Selected Vendor: <span className="text-cyan-400">{selectedVendor.vendorname}</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-300">
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2 uppercase text-xs font-bold tracking-wider">Code:</span>
                  <span className="font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700">{selectedVendor.vendorcode}</span>
                  {selectedVendor.source === 'registeredvendors' && selectedVendor.vendorcode !== 'NA' && (
                    <span className="text-xs text-cyan-500 ml-2 italic">
                      (Generated from name)
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2 uppercase text-xs font-bold tracking-wider">Source:</span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">{selectedVendor.source}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg p-6">
              <VendorGroupMapping 
                vendorCode={selectedVendor.vendorcode}
                vendorName={selectedVendor.vendorname}
              />
            </div>
          </div>
        )}

        {/* No vendor selected state */}
        {!selectedVendor && (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center mt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300">Select a Vendor to Map</h3>
            <p className="mt-2 text-slate-500 max-w-md mx-auto">
              Search and select a vendor above to manage their material and service group mappings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}