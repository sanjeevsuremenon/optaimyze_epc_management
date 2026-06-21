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

          // Check if there's a subgroupId in the URL to auto-select
          const { subgroupId } = router.query;
          if (subgroupId) {
            const preselectedOption = options.find(opt => opt.subgroupId === subgroupId);
            if (preselectedOption) {
              setSelectedOption(preselectedOption);
              setSearchFilter(preselectedOption.label);
            }
          }
        } else {
          setError('Failed to fetch groups');
        }
      } catch (err) {
        setError('Error fetching groups');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchData();
    }
  }, [router.isReady, router.query]);

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
    <div className="app-page min-h-screen flex flex-col pb-12">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center">
            <div className="w-1.5 h-8 bg-app-accent rounded-full mr-4"></div>
            <div>
              <h1 className="text-3xl font-bold text-app-text tracking-tight mb-1">
                Vendor Group Mapping
              </h1>
              <p className="text-app-text-muted text-sm">
                View vendors mapped to specific material or service groups and subgroups
              </p>
            </div>
          </div>

          {/* Search Controls */}
          <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-6 mb-8 relative">
            <div className="relative">
              <label htmlFor="groupSearch" className="block text-xs font-semibold text-app-accent mb-2 uppercase tracking-wider">
                Search Group-Subgroup Combinations
                {loading && (
                  <span className="ml-2 text-xs text-cyan-500">Loading...</span>
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
                  className="w-full px-5 py-3.5 bg-app-bg border border-app-border rounded-xl focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text placeholder-app-text-disabled transition-colors shadow-inner disabled:opacity-50"
                />
                {searchFilter && (
                  <button
                    onClick={clearSelection}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text-secondary transition-colors"
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
                <div className="absolute z-50 w-full mt-2 app-card rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleOptionSelect(option)}
                      className="p-3 hover:bg-app-surface-muted cursor-pointer border-b border-app-border/50 last:border-b-0 transition-colors duration-150"
                    >
                      <div className="font-medium text-app-text">{option.label}</div>
                      <div className="text-xs text-app-text-muted mt-0.5">
                        {option.isService ? 'Service' : 'Material'} Group
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showDropdown && searchFilter.length >= 3 && filteredOptions.length === 0 && (
                <div className="absolute z-50 w-full mt-2 app-card rounded-xl shadow-2xl p-4 text-center text-app-text-muted text-sm">
                  No groups or subgroups found matching "{searchFilter}"
                </div>
              )}

              {/* Minimum characters message */}
              {showDropdown && searchFilter.length > 0 && searchFilter.length < 3 && (
                <div className="absolute z-50 w-full mt-2 app-card rounded-xl shadow-2xl p-4 text-center text-app-text-muted text-sm">
                  Please enter at least 3 characters to search
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {selectedOption && (
              <div className="mt-6 p-4 bg-cyan-950/30 rounded-xl border border-cyan-900/50">
                <h3 className="text-xs font-semibold text-cyan-500 mb-1.5 uppercase tracking-wider">Selected Mapping</h3>
                <p className="text-app-text-secondary">
                  <span className="font-semibold text-app-text">{selectedOption.groupName}</span> → 
                  <span className="font-semibold text-app-text"> {selectedOption.subgroupName}</span>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-app-surface text-app-accent border border-app-border">
                    {selectedOption.isService ? 'Service Group' : 'Material Group'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-rose-400">Error</h3>
                  <div className="mt-1 text-sm text-rose-300">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingVendors && (
            <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-app-accent border-t-transparent"></div>
              <p className="mt-4 text-app-text-muted font-medium">Loading vendors...</p>
            </div>
          )}

          {/* Vendors List */}
          {!loadingVendors && selectedOption && (
            <div className="bg-app-surface/80 border border-app-border rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-5 bg-app-surface-muted border-b border-app-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-app-text tracking-tight">
                    Mapped Vendors
                  </h2>
                  <p className="text-sm text-app-text-muted mt-1">
                    Vendors mapped to {selectedOption.groupName} → {selectedOption.subgroupName}
                  </p>
                </div>
                <span className="px-3 py-1 bg-app-bg text-emerald-400 rounded-full text-sm font-bold border border-app-border">
                  {vendors.length} Total
                </span>
              </div>

              {vendors.length === 0 ? (
                <div className="p-12 text-center text-app-text-muted">
                  <svg className="mx-auto h-12 w-12 text-slate-600 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-app-text-secondary">No vendors found</h3>
                  <p className="mt-2 text-app-text-muted">
                    No vendors are currently mapped to this subgroup.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-app-border">
                    <thead className="bg-app-surface/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Contact Person</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/50">
                      {vendors.map((vendor, index) => (
                        <tr key={index} className="hover:bg-app-surface/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-app-text">
                              {vendor.vendorname || vendor.vendorName || vendor['vendor-name'] || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-app-accent font-mono">
                              {vendor.vendorcode || vendor.vendorCode || vendor['vendor-code'] || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-app-text-secondary">
                              {vendor.contactperson || vendor.contactPerson || vendor['contact-person'] || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-app-text-muted">
                              {vendor.email || vendor['email'] || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-app-text-muted">
                              {vendor.phone || vendor['phone'] || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded ${
                              vendor.isUnregistered 
                                ? 'bg-amber-900/40 text-amber-400 border border-amber-800' 
                                : 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                            }`}>
                              {vendor.isUnregistered ? 'Unregistered' : 'Registered'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {!vendor.isUnregistered && (
                              <button
                                onClick={() => router.push(`/vendor-dashboard?vendorcode=${vendor.vendorcode || vendor.vendorCode || vendor['vendor-code']}`)}
                                className="px-4 py-2 bg-app-surface hover:bg-app-surface-muted text-app-accent hover:text-app-accent rounded-lg text-xs font-semibold transition-colors border border-app-border"
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
          {!selectedOption && !loading && (
            <div className="bg-app-surface-muted border border-app-border border-dashed rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-app-surface mb-4">
                <svg className="h-8 w-8 text-app-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-app-text-secondary">Select a Group</h3>
              <p className="mt-2 text-app-text-muted max-w-md mx-auto">
                Type in the search box above to find and select a material or service subgroup to view its mapped vendors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
