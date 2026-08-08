import React, { useState, useEffect } from 'react';
import ScheduleSection, { ScheduleFormLayout } from './ScheduleSection';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const formFields = [
  { name: 'lcdatadate', label: 'LC Data Date', type: 'date' },
  { name: 'lcestopendate', label: 'LC Estimated Open Date', type: 'date' },
  { name: 'lcopeneddate', label: 'LC Opened Date', type: 'date' },
  { name: 'lcexpirydate', label: 'LC Expiry Date', type: 'date' },
  { name: 'lcincoterm', label: 'LC Incoterm', type: 'text' },
  { name: 'lcdocuments', label: 'LC Documents', type: 'textarea' },
  { name: 'lclastshipdate', label: 'LC Last Ship Date', type: 'date' },
  { name: 'lcamount', label: 'LC Amount', type: 'number' },
  { name: 'lcswift', label: 'LC Swift', type: 'text' },
  { name: 'lcremarks', label: 'LC Remarks', type: 'textarea' },
];

const LCData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const fetchLCData = async () => {
      try {
        const response = await fetch(`/api/poschedule/lc?ponumber=${ponumber}`);
        const data = await response.json();
        if (data.success && data.lcdata) {
          const formattedData = Object.entries(data.lcdata).reduce((acc, [key, value]) => {
            acc[key] = key.toLowerCase().includes('date') && value ? formatDateForInput(value) : value;
            return acc;
          }, {});
          setFormData((prev) => ({ ...prev, ...formattedData }));
        }
      } catch (error) {
        console.error('Error fetching LC data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (ponumber) fetchLCData();
  }, [ponumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formattedData = Object.entries(formData).reduce((acc, [key, value]) => {
        acc[key] = key.toLowerCase().includes('date') && value ? new Date(value).toISOString() : value;
        return acc;
      }, {});
      const response = await fetch('/api/poschedule/lc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponumber, lcdata: formattedData }),
      });
      const data = await response.json();
      alert(data.success ? 'LC data saved successfully!' : 'Error saving LC data');
    } catch (error) {
      console.error('Error saving LC data:', error);
      alert('Error saving LC data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScheduleSection
      title="Letter of Credit Data"
      accentClass="bg-indigo-600"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((v) => !v)}
      isLoading={isLoading}
    >
      <ScheduleFormLayout
        fields={formFields}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScheduleSection>
  );
};

export default LCData;
