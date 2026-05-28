import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FiEdit2, FiTrash2, FiEye, FiLink, FiPrinter, FiPlus, FiFilter, FiX } from 'react-icons/fi';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export default function MaterialGroupsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  // Debounce the raw search term so that we don't recompute on every key stroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      setSearchResults([]);
      return;
    }

    const terms = debouncedSearchTerm
      .split('*')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    if (terms.length === 0) {
      setSearchResults([]);
      return;
    }

    const matches = [];

    groups.forEach(group => {
      const subgroups = Array.isArray(group.subgroups) ? group.subgroups : [];
      subgroups.forEach(subgroup => {
        const name = subgroup.name || '';
        const description = subgroup.description || '';
        const haystack = `${name} ${description}`.toLowerCase();

        const isMatch = terms.every(term => haystack.includes(term));

        if (isMatch) {
          matches.push({ group, subgroup });
        }
      });
    });

    setSearchResults(matches);
  }, [debouncedSearchTerm, groups]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/materialgroups');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setGroups(data);
      } else {
        console.error('Received non-array data:', data);
        setGroups([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([]);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = () => {
    const sortedGroups = [...groups].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.isService === b.isService ? 0 : a.isService ? 1 : -1;
      } else {
        return a.isService === b.isService ? 0 : a.isService ? -1 : 1;
      }
    });
    setGroups(sortedGroups);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleNewClick = (type, groupId = null) => {
    const query = { type: type };
    if (groupId) {
      query.groupId = groupId;
    }
    router.push({
      pathname: '/material-groups/new',
      query
    });
  };

  const handleEditClick = (e, type, item) => {
    e.stopPropagation();
    router.push({
      pathname: '/material-groups/edit',
      query: {
        type: type,
        id: item._id
      }
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormType(null);
    setEditingItem(null);
    setError(null);
  };

  const handleGroupSubmit = async (formData) => {
    try {
      setError(null);
      const method = formData._id ? 'PUT' : 'POST';
      const body = formData._id ? { id: formData._id, ...formData } : formData;

      const response = await fetch('/api/materialgroups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save group');
      }
    } catch (err) {
      console.error('Error saving group:', err);
      setError('Failed to save group');
    }
  };

  const handleSubgroupSubmit = async (formData) => {
    try {
      setError(null);
      const method = formData._id ? 'PUT' : 'POST';
      const body = formData._id ? { id: formData._id, ...formData } : formData;

      const response = await fetch('/api/materialsubgroups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save subgroup');
      }
    } catch (err) {
      console.error('Error saving subgroup:', err);
      setError('Failed to save subgroup');
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/material${type}s`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete ${type}`);
      }

      if (type === 'group') {
        setGroups(prevGroups => prevGroups.filter(group => group._id !== id));
        if (selectedGroup?._id === id) {
          setSelectedGroup(null);
        }
      } else if (type === 'subgroup') {
        const updatedGroups = groups.map(group => {
          if (group._id === selectedGroup._id) {
            const updatedGroup = {
              ...group,
              subgroups: group.subgroups.filter(subgroup => subgroup._id !== id)
            };
            setSelectedGroup(updatedGroup);
            return updatedGroup;
          }
          return group;
        });
        setGroups(updatedGroups);
      }

      setError(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{editingItem ? 'Edit' : 'New'} {formType}</h2>
            <button className="text-slate-400 hover:text-rose-400 transition-colors" onClick={handleCloseForm}>
              <FiX size={24} />
            </button>
          </div>
          {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded-lg text-sm">{error}</div>}
          {formType === 'group' ? (
            <GroupForm 
              initialData={editingItem}
              onSubmit={async (data) => {
                await handleGroupSubmit(data);
                if (!error) handleCloseForm();
              }}
              onCancel={handleCloseForm}
            />
          ) : (
            <SubgroupForm
              groupId={selectedGroup?._id}
              initialData={editingItem}
              onSubmit={async (data) => {
                await handleSubgroupSubmit(data);
                if (!error) handleCloseForm();
              }}
              onCancel={handleCloseForm}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-1.5 h-8 bg-cyan-500 rounded-full mr-4"></div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Material & Service Groups</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSort}
              className="px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center shadow-md"
            >
              <FiFilter className="mr-2" /> Sort by Type
            </button>
            {isAdmin && (
              <button 
                onClick={() => handleNewClick('group')}
                className="px-4 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center"
              >
                <FiPlus className="mr-2" /> New Group
              </button>
            )}
            {isAdmin && selectedGroup && (
              <button 
                onClick={() => handleNewClick('subgroup', selectedGroup._id)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center"
              >
                <FiPlus className="mr-2" /> New Subgroup
              </button>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg p-6 mb-8 relative">
          <label className="block text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
            Search Material & Service Subgroups
          </label>
          <input
            type="text"
            className="w-full px-5 py-3.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 placeholder-slate-600 transition-colors shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or description, use * to separate multiple terms..."
          />
          {debouncedSearchTerm && (
            <div className="mt-3 text-sm font-medium text-slate-400">
              {searchResults.length > 0
                ? <span className="text-emerald-400">Found {searchResults.length} matching subgroups</span>
                : <span className="text-rose-400">No matching subgroups found</span>
              }
            </div>
          )}
        </div>

        {error && <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded-xl text-center font-medium shadow-sm">{error}</div>}
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 font-medium">Loading groups...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Search Results Table */}
            {searchResults.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full mr-3"></div>
                  <h2 className="text-lg font-bold text-white">Matching Subgroups</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/80 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Subgroup</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Description</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map(({ group, subgroup }) => (
                        <tr
                          key={subgroup._id}
                          className="bg-slate-900/30 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <td className="px-6 py-4 font-medium text-slate-300 break-words">{toTitleCase(group.name)}</td>
                          <td className="px-6 py-4 font-semibold text-cyan-400 break-words">{toTitleCase(subgroup.name)}</td>
                          <td className="px-6 py-4 text-slate-400 break-words">{toTitleCase(subgroup.description)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {isAdmin && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(e, 'subgroup', subgroup); }} className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors" title="Edit">
                                    <FiEdit2 />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete('subgroup', subgroup._id); }} className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors" title="Delete">
                                    <FiTrash2 />
                                  </button>
                                </>
                              )}
                              {(isAdmin || userRole === 'user' || userRole === 'project') && (
                                <button onClick={(e) => { e.stopPropagation(); window.open(`/vendor-group-mapping?subgroupId=${subgroup._id}`, '_blank'); }} className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors" title="View Vendors">
                                  <FiEye />
                                </button>
                              )}
                              {isAdmin && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); window.open(`/material-groups/map-vendor?subgroupId=${subgroup._id}`, '_blank'); }} className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors" title="Map Vendor">
                                    <FiLink />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); const params = new URLSearchParams({ subgroupId: subgroup._id, groupName: group.name || '', subgroupName: subgroup.name || '', isService: String(!!group.isService) }); window.open(`/material-groups/print-vendors?${params.toString()}`, '_blank'); }} className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors" title="Print Vendors">
                                    <FiPrinter />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Main Layout: Groups and Subgroups Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Groups Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1.5 h-5 bg-cyan-500 rounded-full mr-3"></div>
                    <h2 className="text-lg font-bold text-white">Groups</h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-950 text-slate-400 rounded-full">{groups.length} total</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/80 border-b border-slate-700">
                      <tr>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                        {isAdmin && <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {groups.map(group => (
                        <tr 
                          key={group._id}
                          className={`cursor-pointer transition-colors ${selectedGroup?._id === group._id ? 'bg-cyan-900/30 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'}`}
                          onClick={() => setSelectedGroup(group)}
                        >
                          <td className="px-5 py-4 font-semibold text-slate-200 break-words">{toTitleCase(group.name)}</td>
                          <td className="px-5 py-4 text-sm text-slate-400 break-words">{toTitleCase(group.description)}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${group.isService ? 'bg-purple-900/40 text-purple-400 border border-purple-800' : 'bg-blue-900/40 text-blue-400 border border-blue-800'}`}>
                              {group.isService ? 'Service' : 'Material'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button onClick={(e) => handleEditClick(e, 'group', group)} className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors" title="Edit">
                                  <FiEdit2 size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete('group', group._id); }} className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subgroups Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1.5 h-5 bg-emerald-500 rounded-full mr-3"></div>
                    <h2 className="text-lg font-bold text-white">Subgroups {selectedGroup && <span className="text-emerald-400 ml-1">for {toTitleCase(selectedGroup.name)}</span>}</h2>
                  </div>
                  {selectedGroup && <span className="text-xs font-semibold px-2.5 py-1 bg-slate-950 text-slate-400 rounded-full">{selectedGroup.subgroups.length} total</span>}
                </div>
                
                {selectedGroup ? (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-800/80 border-b border-slate-700">
                        <tr>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                          <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {selectedGroup.subgroups.length > 0 ? (
                          selectedGroup.subgroups.map(subgroup => (
                            <tr key={subgroup._id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-5 py-4 font-semibold text-cyan-300 break-words">{toTitleCase(subgroup.name)}</td>
                              <td className="px-5 py-4 text-sm text-slate-400 break-words">{toTitleCase(subgroup.description)}</td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-1.5 flex-wrap">
                                  {isAdmin && (
                                    <>
                                      <button onClick={(e) => handleEditClick(e, 'subgroup', subgroup)} className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-950 rounded transition-colors" title="Edit">
                                        <FiEdit2 size={16} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDelete('subgroup', subgroup._id); }} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 rounded transition-colors" title="Delete">
                                        <FiTrash2 size={16} />
                                      </button>
                                    </>
                                  )}
                                  {(isAdmin || userRole === 'user' || userRole === 'project') && (
                                    <button onClick={(e) => { e.stopPropagation(); window.open(`/vendor-group-mapping?subgroupId=${subgroup._id}`, '_blank'); }} className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-950 rounded transition-colors" title="View Vendors">
                                      <FiEye size={16} />
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <>
                                      <button onClick={(e) => { e.stopPropagation(); window.open(`/material-groups/map-vendor?subgroupId=${subgroup._id}`, '_blank'); }} className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 rounded transition-colors" title="Map Vendor">
                                        <FiLink size={16} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); const params = new URLSearchParams({ subgroupId: subgroup._id, groupName: selectedGroup.name || '', subgroupName: subgroup.name || '', isService: String(!!selectedGroup.isService) }); window.open(`/material-groups/print-vendors?${params.toString()}`, '_blank'); }} className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-950 rounded transition-colors" title="Print Vendors">
                                        <FiPrinter size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="px-5 py-8 text-center text-slate-500 italic">No subgroups available for this group.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                    <FiFilter size={48} className="mb-4 opacity-20" />
                    <p className="text-lg">Select a group to view its subgroups</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Form Components
function GroupForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    isService: false
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="3"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 transition-colors resize-none"
        ></textarea>
      </div>
      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-700/50 bg-slate-950/50 hover:bg-slate-800 transition-colors">
          <input
            type="checkbox"
            checked={formData.isService}
            onChange={(e) => setFormData({ ...formData, isService: e.target.checked })}
            className="w-5 h-5 accent-cyan-500 bg-slate-900 border-slate-700 rounded"
          />
          <span className="text-slate-300 font-medium">Is Service Group</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-800">
        <button type="submit" className="flex-1 py-2.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors">
          {initialData ? 'Update' : 'Create'} Group
        </button>
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function SubgroupForm({ groupId, initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    groupId: groupId
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="3"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 transition-colors resize-none"
        ></textarea>
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-800">
        <button type="submit" className="flex-1 py-2.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors">
          {initialData ? 'Update' : 'Create'} Subgroup
        </button>
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
} 