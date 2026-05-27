import { useState } from 'react';

export function GroupForm({ initialData, onSubmit, onCancel }) {
  console.log('GroupForm rendering with:', { initialData });
  
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    isService: false
  });

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>Description:</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={formData.isService}
            onChange={(e) => setFormData({ ...formData, isService: e.target.checked })}
          />
          Is Service Group
        </label>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {initialData ? 'Update' : 'Create'} Group
        </button>
        <button 
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SubgroupForm({ groupId, initialData, onSubmit, onCancel }) {
  console.log('SubgroupForm rendering with:', { groupId, initialData });
  
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    groupId: groupId
  });

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>Description:</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {initialData ? 'Update' : 'Create'} Subgroup
        </button>
        <button 
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Dummy default export so Next.js doesn't treat this as an invalid page
export default function MaterialGroupsFormsPage() {
  return null;
}  