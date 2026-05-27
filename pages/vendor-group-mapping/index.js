import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function VendorGroupMappingPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch groups with subgroups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/materialgroups');
        if (response.ok) {
          const data = await response.json();
          
          // Create options for the search - flatten groups and subgroups
          const options = data.flatMap(group => 
            group.subgroups.map(subgroup => ({
              value: subgroup._id,
              label: `${group.name} - ${subgroup.name}`,
              groupName: group.name,
              subgroupName: subgroup.name,
              groupId: group._id,
              subgroupId: subgroup._id,
              isService: group.isService
            }))
          );
          
          setGroups(options);
          setFilteredOptions(options);
        } else {
          setError('Failed to fetch groups');
        }
      } catch (err) {
        setError('Error fetching groups');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter options based on search term
  useEffect(() => {
    if (!searchFilter) {
      setFilteredOptions(groups);
      return;
    }

    const searchRegex = new RegExp(searchFilter, 'i');
    const filtered = groups.filter(option => 
      searchRegex.test(option.groupName) || 
      searchRegex.test(option.subgroupName)
    );
    setFilteredOptions(filtered);
  }, [searchFilter, groups]);

  // Fetch vendors when option is selected
  useEffect(() => {
    if (selectedOption) {
      fetchVendorsBySubgroup(selectedOption.subgroupId);
    } else {
      setVendors([]);
    }
  }, [selectedOption]);

  const fetchVendorsBySubgroup = async (subgroupId) => {
    setLoadingVendors(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/vendorgroupmap/vendors-by-subgroup?subgroupId=${subgroupId}`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      } else {
        setError('Failed to fetch vendors');
      }
    } catch (err) {
      setError('Error fetching vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchFilter(value);
    setShowDropdown(value.length > 0);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setSearchFilter(option.label);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedOption(null);
    setSearchFilter('');
    setShowDropdown(false);
    setVendors([]);
  };

  return (
  <div
    className="min-h-screen bg-slate-900/5"
    style={{
      backgroundImage: `radial-gradient(circle at 0 0, rgba(59,130,246,0.18) 0, transparent 55%),
                        radial-gradient(circle at 100% 0, rgba(236,72,153,0.14) 0, transparent 55%),
                        radial-gradient(circle at 50% 120%, rgba(16,185,129,0.14) 0, transparent 60%)`,
      backgroundAttachment: 'fixed',
      backgroundSize: '120% 120%'
    }}
  >      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2 drop-shadow-sm">
              Vendor Group Mapping
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              View vendors mapped to specific material or service groups and subgroups
            </p>
          </div>

          {/* Search Controls */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-6 mb-8 transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.35)]">
            <div className="relative">
              <label htmlFor="groupSearch" className="block text-xs md:text-sm font-semibold text-slate-800 mb-2 tracking-wide uppercase">
                Search Group-Subgroup Combinations
                {loading && (
                  <span className="ml-2 text-xs text-blue-600">Loading...</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="groupSearch"
                  type="text"
                  value={searchFilter}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(searchFilter.length > 0)}
                  placeholder="Type to search groups or subgroups (min 3 characters)..."
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-xl shadow-inner bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed placeholder:text-slate-400 text-sm md:text-base"
                />
                {searchFilter && (
                  <button
                    onClick={clearSelection}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown Results */}
              {showDropdown && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-[0_16px_40px_rgba(15,23,42,0.25)] max-h-60 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleOptionSelect(option)}
                      className="p-3 hover:bg-blue-50/80 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors duration-150"
                    >
                      <div className="font-medium text-slate-900">{option.label}</div>
                      <div className="text-xs md:text-sm text-slate-600">
                        {option.isService ? 'Service' : 'Material'} Group
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showDropdown && searchFilter.length >= 3 && filteredOptions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-[0_16px_40px_rgba(15,23,42,0.25)] p-3 text-center text-slate-500 text-sm">
                  No groups or subgroups found matching "{searchFilter}"
                </div>
              )}

              {/* Minimum characters message */}
              {showDropdown && searchFilter.length > 0 && searchFilter.length < 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-[0_16px_40px_rgba(15,23,42,0.25)] p-3 text-center text-slate-500 text-sm">
                  Please enter at least 3 characters to search
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {selectedOption && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-100/80 rounded-2xl border border-blue-100 shadow-inner">
                <h3 className="text-xs md:text-sm font-semibold text-blue-900 mb-1 tracking-wide uppercase">Selected Mapping</h3>
                <p className="text-blue-900 text-sm md:text-base">
                  <span className="font-semibold">{selectedOption.groupName}</span> → 
                  <span className="font-semibold"> {selectedOption.subgroupName}</span>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/70 text-[10px] md:text-xs font-semibold text-blue-700 border border-blue-200">
                    {selectedOption.isService ? 'Service Group' : 'Material Group'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 mb-6 shadow-[0_12px_30px_rgba(220,38,38,0.2)]">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingVendors && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600 text-sm">Loading vendors...</p>
            </div>
          )}

          {/* Vendors List */}
          {!loadingVendors && selectedOption && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_20px_55px_rgba(15,23,42,0.22)] transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Mapped Vendors ({vendors.length})
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Vendors mapped to {selectedOption.groupName} → {selectedOption.subgroupName}
                </p>
              </div>

              {vendors.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No vendors found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    No vendors are currently mapped to this subgroup.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Vendor Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Vendor Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Contact Person
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {vendors.map((vendor, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {vendor['vendor-name'] || vendor.vendorName || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                              {vendor['vendor-code'] || vendor.vendorCode || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                              {vendor['contact-person'] || vendor.contactPerson || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                              {vendor['email'] || vendor.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                              {vendor['phone'] || vendor.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              vendor.isUnregistered 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {vendor.isUnregistered ? 'Unregistered' : 'Registered'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!vendor.isUnregistered && (
                              <button
                                onClick={() => router.push(`/vendor-dashboard?vendorcode=${vendor['vendor-code'] || vendor.vendorCode}`)}
                                className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold tracking-wide shadow-[0_8px_20px_rgba(37,99,235,0.45)] hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.6)] transition-all"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!selectedOption && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">Search for Group-Subgroup Combination</h3>
              <p className="mt-1 text-sm text-slate-500">
                Type in the search box above to find and select a group-subgroup combination to view mapped vendors.
              </p>
            </div>
          )}
        </div>
      </div>    </div>
  );
}
