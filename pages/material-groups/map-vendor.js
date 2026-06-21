import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useDebounce from '../../lib/useDebounce';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MapVendorToSubgroup() {
  const router = useRouter();
  const { subgroupId } = router.query;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  
  const [groupInfo, setGroupInfo] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const [mappedVendors, setMappedVendors] = useState([]);
  const [loadingMappedVendors, setLoadingMappedVendors] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load subgroup info
  useEffect(() => {
    if (router.isReady && subgroupId) {
      const fetchGroupInfo = async () => {
        setLoadingGroup(true);
        try {
          const res = await fetch('/api/materialgroups');
          if (res.ok) {
            const data = await res.json();
            for (const group of data) {
              const subgroup = group.subgroups?.find(s => String(s._id) === String(subgroupId));
              if (subgroup) {
                setGroupInfo({
                  groupName: group.name,
                  subgroupName: subgroup.name,
                  isService: group.isService
                });
                break;
              }
            }
          }
        } catch (error) {
          console.error('Failed to load group info:', error);
        } finally {
          setLoadingGroup(false);
        }
      };
      fetchGroupInfo();
      fetchMappedVendors();
    }
  }, [router.isReady, subgroupId]);

  const fetchMappedVendors = async () => {
    setLoadingMappedVendors(true);
    try {
      const res = await fetch(`/api/vendorgroupmap/vendors-by-subgroup?subgroupId=${subgroupId}`);
      if (res.ok) {
        const data = await res.json();
        setMappedVendors(data);
      }
    } catch (err) {
      console.error('Error fetching mapped vendors:', err);
    } finally {
      setLoadingMappedVendors(false);
    }
  };

  useEffect(() => {
    const searchVendors = async () => {
      if (debouncedSearchTerm.length >= 3 && !selectedVendor) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/vendors/search-enhanced?term=${encodeURIComponent(debouncedSearchTerm)}`);
          if (response.ok) {
            const data = await response.json();
            setVendors(data);
          } else {
            setVendors([]);
          }
        } catch (error) {
          console.error('Failed to search vendors:', error);
          setVendors([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setVendors([]);
      }
    };

    searchVendors();
  }, [debouncedSearchTerm, selectedVendor]);

  const generateVendorCode = (name) => {
    if (!name) return 'NA';
    if (name.length < 5) return name;
    const first = name.substring(0, 5);
    const last = name.substring(name.length - 5);
    return first + last;
  };

  const isNonsapObjectId = (idStr) => {
    if (!idStr) return false;
    return /^[a-fA-F0-9]{24}$/.test(String(idStr).trim());
  };

  const handleVendorSelect = (vendor) => {
    const isRegistered = vendor.source === 'registeredvendors';
    const hasNoCode = !vendor.vendorcode || vendor.vendorcode === 'NA';
    const processedVendor = {
      ...vendor,
      vendorcode: isRegistered && hasNoCode ? generateVendorCode(vendor.vendorname) : vendor.vendorcode
    };
    setSelectedVendor(processedVendor);
    setSearchTerm(`${vendor.vendorname} (${vendor.vendorcode || 'NA'})`);
    setVendors([]);
  };

  const handleMapVendor = async () => {
    if (!selectedVendor || !subgroupId) return;
    setIsMapping(true);

    try {
      const vendorCode = selectedVendor.vendorcode;
      const vendorName = selectedVendor.vendorname;
      const source = selectedVendor.source;
      const id = selectedVendor._id;

      let getUrl = '';
      let postUrl = '';
      let payloadKey = '';
      let payloadValue = '';

      const isNonSap = isNonsapObjectId(id) && source === 'nonsap';
      const isUnregistered = source === 'registeredvendors' && (!vendorCode || vendorCode === 'NA' || vendorCode === generateVendorCode(vendorName));

      if (isNonSap) {
        getUrl = `/api/nonsapvendorgroupmap?nonsapVendorId=${id}`;
        postUrl = `/api/nonsapvendorgroupmap`;
        payloadKey = 'nonsapVendorId';
        payloadValue = id;
      } else if (isUnregistered) {
        getUrl = `/api/unregisteredvendorgroupmap?vendorName=${encodeURIComponent(vendorName)}`;
        postUrl = `/api/unregisteredvendorgroupmap`;
        payloadKey = 'vendorName';
        payloadValue = vendorName;
      } else {
        getUrl = `/api/vendorgroupmap?vendorCode=${encodeURIComponent(vendorCode)}`;
        postUrl = `/api/vendorgroupmap`;
        payloadKey = 'vendorCode';
        payloadValue = vendorCode;
      }

      // Get existing mappings
      const getRes = await fetch(getUrl);
      const mappings = await getRes.json();
      
      const existingSubgroupIds = mappings.map(m => String(m.subgroupId));
      
      if (!existingSubgroupIds.includes(String(subgroupId))) {
        existingSubgroupIds.push(String(subgroupId));
        
        // Save back
        const postRes = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [payloadKey]: payloadValue,
            subgroupIds: existingSubgroupIds
          })
        });

        if (postRes.ok) {
          toast.success('Vendor mapped successfully!');
          handleCancel();
          fetchMappedVendors();
        } else {
          toast.error('Failed to map vendor.');
        }
      } else {
        toast.info('Vendor is already mapped to this subgroup.');
        handleCancel();
      }

    } catch (error) {
      console.error('Error mapping vendor:', error);
      toast.error('An error occurred while mapping.');
    } finally {
      setIsMapping(false);
    }
  };

  const handleDeleteMapping = async (vendor) => {
    if (!confirm(`Are you sure you want to remove ${vendor['vendor-name'] || vendor.vendorname || vendor.vendorCode} from this subgroup?`)) return;

    try {
      const vendorCode = vendor['vendor-code'] || vendor.vendorCode;
      const vendorName = vendor['vendor-name'] || vendor.vendorname;
      const isUnregistered = vendor.isUnregistered;
      // Note: We'd need a robust way to know if it's nonsap, but for now we'll check unreg or reg.
      
      let getUrl = '';
      let postUrl = '';
      let payloadKey = '';
      let payloadValue = '';

      if (isUnregistered) {
        getUrl = `/api/unregisteredvendorgroupmap?vendorName=${encodeURIComponent(vendorName)}`;
        postUrl = `/api/unregisteredvendorgroupmap`;
        payloadKey = 'vendorName';
        payloadValue = vendorName;
      } else {
        getUrl = `/api/vendorgroupmap?vendorCode=${encodeURIComponent(vendorCode)}`;
        postUrl = `/api/vendorgroupmap`;
        payloadKey = 'vendorCode';
        payloadValue = vendorCode;
      }

      const getRes = await fetch(getUrl);
      const mappings = await getRes.json();
      
      const existingSubgroupIds = mappings.map(m => String(m.subgroupId)).filter(id => id !== String(subgroupId));
      
      const postRes = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [payloadKey]: payloadValue,
          subgroupIds: existingSubgroupIds
        })
      });

      if (postRes.ok) {
        toast.success('Mapping removed successfully!');
        fetchMappedVendors();
      } else {
        toast.error('Failed to remove mapping.');
      }

    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('An error occurred while removing mapping.');
    }
  };

  const handleCancel = () => {
    setSelectedVendor(null);
    setSearchTerm('');
    setVendors([]);
  };

  const getStatusBadge = (vendor) => {
    if (vendor.isUnregistered) {
      return <span className="text-amber-500 font-medium">Unregistered</span>;
    }
    return <span className="text-emerald-500 font-medium">Registered</span>;
  };

  return (
    <div className="app-page min-h-screen flex flex-col pb-12">
      <ToastContainer theme="dark" />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text tracking-tight flex items-center">
            Map Vendor to{' '}
            {loadingGroup ? (
              <span className="ml-2 h-6 w-48 bg-app-surface rounded animate-pulse inline-block"></span>
            ) : groupInfo ? (
              <span className="text-app-accent ml-2">
                {groupInfo.groupName} - {groupInfo.subgroupName}
              </span>
            ) : (
              <span className="ml-2">Group</span>
            )}
          </h1>
          <button 
            onClick={() => router.push('/material-groups')}
            className="px-4 py-2 bg-app-surface hover:bg-app-surface-muted text-app-text-secondary rounded-lg text-sm font-semibold transition-colors border border-app-border flex items-center shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
        </div>

        {/* Search Section */}
        <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-app-text mb-4">Search and Select Vendor</h2>
          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-app-text-muted mb-2">
              Search Vendor (minimum 3 characters):
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedVendor) setSelectedVendor(null);
                }}
                placeholder="Type vendor name or code..."
                className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-lg focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent text-app-text placeholder-app-text-disabled transition-colors shadow-inner"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-app-accent border-t-transparent"></div>
                </div>
              )}
            </div>

            {vendors.length > 0 && !selectedVendor && (
              <div className="absolute z-50 w-full left-0 mt-2 app-card rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                {vendors.map((vendor) => (
                  <div
                    key={`${vendor.vendorcode}-${vendor.source}`}
                    onClick={() => handleVendorSelect(vendor)}
                    className="p-3 hover:bg-app-surface-muted cursor-pointer border-b border-app-border/50 last:border-b-0 transition-colors duration-150"
                  >
                    <div className="font-medium text-app-text">{vendor.vendorname}</div>
                    <div className="text-sm text-app-text-muted mt-0.5">
                      Code: <span className="font-mono text-app-accent">{vendor.vendorcode}</span> | Source: {vendor.source}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchTerm.length >= 3 && vendors.length === 0 && !isSearching && !selectedVendor && (
              <div className="absolute z-50 w-full left-0 mt-2 app-card rounded-lg shadow-2xl p-4 text-center text-app-text-muted text-sm">
                No vendors found.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMapVendor}
              disabled={!selectedVendor || isMapping}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all ${
                selectedVendor && !isMapping
                  ? 'bg-app-accent hover:bg-app-accent text-white shadow-cyan-900/50'
                  : 'bg-app-surface text-app-text-muted cursor-not-allowed'
              }`}
            >
              {isMapping ? 'Mapping...' : 'Map Vendor'}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-app-text rounded-lg text-sm font-semibold transition-colors border border-slate-600 shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Already Mapped Vendors */}
        <div className="bg-app-surface border border-app-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-5 border-b border-app-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-app-text">
              Already Mapped Vendors ({loadingMappedVendors ? '...' : mappedVendors.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-app-surface-muted">
                  <th className="px-6 py-4 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/80">
                {loadingMappedVendors ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-app-text-muted">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-app-accent border-t-transparent mr-2"></div>
                        Loading mapped vendors...
                      </div>
                    </td>
                  </tr>
                ) : mappedVendors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-app-text-muted italic">
                      No vendors mapped to this subgroup yet.
                    </td>
                  </tr>
                ) : (
                  mappedVendors.map((vendor, idx) => {
                    const vendorName = vendor['vendor-name'] || vendor.vendorname || vendor.vendorCode;
                    const vendorCode = vendor['vendor-code'] || vendor.vendorCode;
                    
                    return (
                      <tr key={idx} className="hover:bg-app-surface/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-app-text">
                          {vendorName}
                        </td>
                        <td className="px-6 py-4 text-app-text-muted font-mono text-sm">
                          {vendorCode}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(vendor)}
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => handleDeleteMapping(vendor)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 rounded text-xs font-semibold transition-all shadow-sm"
                          >
                            Delete
                          </button>
                          <button
                            title="Chat"
                            className="px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-500 border border-blue-500/20 rounded text-xs font-semibold transition-all shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
