import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './MaterialGroups.module.css';
import { GroupForm, SubgroupForm } from './components/Forms';

export default function NewMaterialGroupPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { type, groupId } = router.query;

  console.log('Styles loaded:', styles);
  console.log('Current styles:', {
    formPage: styles.formPage,
    formContent: styles.formContent
  });

  const handleSubmit = async (formData) => {
    console.log('Submit called with:', formData);
    try {
      setLoading(true);
      setError(null);
      const submitData = type === 'subgroup' ? { ...formData, groupId } : formData;
      
      const response = await fetch(`/api/material${type}s`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push('/material-groups');
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to create ${type}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Error creating ${type}`);
    } finally {
      setLoading(false);
    }
  };

  if (!router.isReady) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (!type) {
    return <div style={{ padding: '20px', color: 'red' }}>Missing type parameter</div>;
  }

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
        <h2>New {type}</h2>
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

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px' }}>
          {type === 'group' ? (
            <>
              <p>Debug: Rendering Group Form</p>
              <GroupForm 
                onSubmit={handleSubmit}
                onCancel={() => router.push('/material-groups')}
              />
            </>
          ) : (
            <>
              <p>Debug: Rendering Subgroup Form</p>
              <SubgroupForm
                groupId={groupId}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/material-groups')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
} 