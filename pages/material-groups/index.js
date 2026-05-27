import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import styles from './MaterialGroups.module.css';

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

    // Support multiple search terms separated by '*', matched anywhere
    // within subgroup name or description (case-insensitive).
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

        // Require that all search terms appear somewhere in either
        // the name or description.
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

  const handleAddGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/materialgroups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });
      if (response.ok) {
        setNewGroup({ name: '', description: '', isService: false });
        fetchGroups();
      }
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const handleAddSubgroup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/materialsubgroups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubgroup),
      });
      if (response.ok) {
        setNewSubgroup({ groupId: '', name: '', description: '' });
        fetchGroups();
      }
    } catch (error) {
      console.error('Error adding subgroup:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (confirm('Are you sure? This will delete all associated subgroups.')) {
      try {
        const response = await fetch(`/api/materialgroups?id=${groupId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchGroups();
        }
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  const handleDeleteSubgroup = async (subgroupId) => {
    if (confirm('Are you sure you want to delete this subgroup?')) {
      try {
        const response = await fetch(`/api/materialsubgroups?id=${subgroupId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchGroups();
        }
      } catch (error) {
        console.error('Error deleting subgroup:', error);
      }
    }
  };

  const handleNewClick = (type, groupId = null) => {
    const query = {
      type: type
    };
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
      const body = formData._id 
        ? { id: formData._id, ...formData }
        : formData;

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
      const body = formData._id 
        ? { id: formData._id, ...formData }
        : formData;

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
        headers: {
          'Content-Type': 'application/json',
        },
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
      <div className={styles.formPage}>
        <div className={styles.formHeader}>
          <h2>{editingItem ? 'Edit' : 'New'} {formType}</h2>
          <button 
            className={styles.closeButton}
            onClick={handleCloseForm}
          >
            ×
          </button>
        </div>
        <div className={styles.formContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}
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
    <>
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h1 className={styles.headerText}>Material & Service Groups Management</h1>
        <div className={styles.actions}>
          {isAdmin && (
            <button 
              className={styles.newButton}
              onClick={() => handleNewClick('group')}
            >
              New Group
            </button>
          )}
          {isAdmin && selectedGroup && (
            <button 
              className={styles.newButton}
              onClick={() => handleNewClick('subgroup', selectedGroup._id)}
            >
              New Subgroup
            </button>
          )}
          <button 
            className={styles.sortButton}
            onClick={handleSort}
          >
            Sort by Type
          </button>
        </div>
      </div>

      <div className={styles.searchSection}>
        <label className={styles.searchLabel}>
          Search Material &amp; Service Subgroups (name or description)
        </label>
        <input
          type="text"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or description, use * to separate multiple terms..."
        />
        <div className={styles.searchHint}>
          {debouncedSearchTerm && (
            searchResults.length > 0
              ? `Found ${searchResults.length} matching subgroups`
              : 'No matching subgroups found'
          )}
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.content}>
          {searchResults.length > 0 && (
            <div className={styles.searchResultsSection}>
              <h2>Matching Subgroups</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Subgroup</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(({ group, subgroup }) => (
                    <tr
                      key={subgroup._id}
                      className={styles.subgroupRow}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <td className={styles.groupName}>{group.name}</td>
                      <td className={styles.subgroupName}>{subgroup.name}</td>
                      <td className={styles.subgroupDescription}>{subgroup.description}</td>
                      <td>
                        {isAdmin && (
                          <>
                            <button 
                              className={styles.editButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(e, 'subgroup', subgroup);
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button 
                              className={styles.deleteButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('subgroup', subgroup._id);
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {(isAdmin || userRole === 'user' || userRole === 'project') && (
                          <button 
                            className={styles.viewVendorsButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/material-groups/view-vendors?subgroupId=${subgroup._id}`, '_blank');
                            }}
                            title="View Vendors"
                          >
                            👁️
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button 
                              className={styles.mapVendorButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/material-groups/map-vendor?subgroupId=${subgroup._id}`, '_blank');
                              }}
                              title="Map Vendor"
                            >
                              🔗
                            </button>
                            <button 
                              className={styles.printVendorsButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                const params = new URLSearchParams({
                                  subgroupId: subgroup._id,
                                  groupName: group.name || '',
                                  subgroupName: subgroup.name || '',
                                  isService: String(!!group.isService)
                                });
                                window.open(`/material-groups/print-vendors?${params.toString()}`, '_blank');
                              }}
                              title="print the mapped vendors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className={styles.printIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H5a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.groupsSection}>
            <h2>Groups</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr 
                    key={group._id}
                    className={`${styles.groupRow} ${selectedGroup?._id === group._id ? styles.selectedRow : ''}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <td className={styles.groupName}>{group.name}</td>
                    <td className={styles.groupDescription}>{group.description}</td>
                    <td className={styles.groupType}>{group.isService ? 'Service' : 'Material'}</td>
                    {isAdmin && (
                      <td>
                        <button 
                          className={styles.editButton}
                          onClick={(e) => handleEditClick(e, 'group', group)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete('group', group._id);
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.subgroupsSection}>
            <h2>Subgroups {selectedGroup && `for ${selectedGroup.name}`}</h2>
            {selectedGroup ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.subgroups.map(subgroup => (
                    <tr key={subgroup._id} className={styles.subgroupRow}>
                      <td className={styles.subgroupName} >{subgroup.name}</td>
                      <td className={styles.subgroupDescription}>{subgroup.description}</td>
                      <td>
                        {isAdmin && (
                          <>
                            <button 
                              className={styles.editButton}
                              onClick={(e) => handleEditClick(e, 'subgroup', subgroup)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button 
                              className={styles.deleteButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete('subgroup', subgroup._id);
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {(isAdmin || userRole === 'user' || userRole === 'project') && (
                          <button 
                            className={styles.viewVendorsButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/material-groups/view-vendors?subgroupId=${subgroup._id}`, '_blank');
                            }}
                            title="View Vendors"
                          >
                            👁️
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button 
                              className={styles.mapVendorButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/material-groups/map-vendor?subgroupId=${subgroup._id}`, '_blank');
                              }}
                              title="Map Vendor"
                            >
                              🔗
                            </button>
                            <button 
                              className={styles.printVendorsButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                const params = new URLSearchParams({
                                  subgroupId: subgroup._id,
                                  groupName: selectedGroup.name || '',
                                  subgroupName: subgroup.name || '',
                                  isService: String(!!selectedGroup.isService)
                                });
                                window.open(`/material-groups/print-vendors?${params.toString()}`, '_blank');
                              }}
                              title="print the mapped vendors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className={styles.printIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H5a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Select a group to view subgroups</p>
            )}
          </div>
        </div>
      )}
    </div>
    </>
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
    <form className={styles.form} onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      <div className={styles.formField}>
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className={styles.formField}>
        <label>Description:</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className={styles.formField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isService}
            onChange={(e) => setFormData({ ...formData, isService: e.target.checked })}
          />
          Is Service Group
        </label>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton}>
          {initialData ? 'Update' : 'Create'} Group
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
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
    <form className={styles.form} onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      <div className={styles.formField}>
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className={styles.formField}>
        <label>Description:</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton}>
          {initialData ? 'Update' : 'Create'} Subgroup
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
} 