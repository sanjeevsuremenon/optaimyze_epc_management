import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GroupForm, SubgroupForm } from './components/Forms';

export default function EditMaterialGroupPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { type, id } = router.query;
    if (type && id) {
      fetchItem(type, id);
    }
  }, [router.isReady, router.query]);

  const fetchItem = async (type, id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/material${type}s/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }
      const data = await response.json();
      console.log('Fetched data:', data);
      setInitialData(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const { type, id } = router.query;
      console.log('Submitting update:', { type, id, formData });
      
      const response = await fetch(`/api/material${type}s`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          ...formData,
          ...(type === 'subgroup' && { groupId: formData.groupId })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to update ${type}`);
      }

      console.log('Update successful:', data);
      router.push('/material-groups');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
    }
  };

  if (!router.isReady || loading) {
    return (
      <div style={{ 
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px',
        color: '#c62828',
        backgroundColor: '#ffebee',
        borderRadius: '4px',
        margin: '20px'
      }}>
        {error}
      </div>
    );
  }

  const { type } = router.query;

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#fff'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Edit {type}</h2>
        <button 
          onClick={() => router.push('/material-groups')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#666',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px'
      }}>
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '4px' 
        }}>
          {initialData && type === 'group' ? (
            <GroupForm 
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/material-groups')}
            />
          ) : initialData && type === 'subgroup' ? (
            <SubgroupForm
              groupId={initialData.groupId}
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/material-groups')}
            />
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666' 
            }}>
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 