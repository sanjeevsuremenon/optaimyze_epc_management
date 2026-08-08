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
  { name: 'abgamount', label: 'Advance BG Amount', type: 'number' },
  { name: 'abgactualdate', label: 'Advance BG Actual Date', type: 'date' },
  { name: 'abgexpirydate', label: 'Advance BG Expiry Date', type: 'date' },
  { name: 'abgreturneddate', label: 'Advance BG Return Date', type: 'date' },
  { name: 'pbgamount', label: 'Performance BG Amount', type: 'number' },
  { name: 'pbgestdate', label: 'Performance BG Est. Date', type: 'date' },
  { name: 'pbgactualdate', label: 'Performance BG Actual Date', type: 'date' },
  { name: 'pbgexpirydate', label: 'Performance BG Expiry Date', type: 'date' },
  { name: 'pbgreturneddate', label: 'Performance BG Return Date', type: 'date' },
  { name: 'bgremarks', label: 'Bank Guarantee Remarks', type: 'textarea' },
];

const BankGuaranteeData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const fetchBGData = async () => {
      try {
        const response = await fetch(`/api/poschedule/bankguarantee?ponumber=${ponumber}`);
        const data = await response.json();
        if (data.success && data.bgdata) {
          const formattedData = Object.entries(data.bgdata).reduce((acc, [key, value]) => {
            acc[key] = key.toLowerCase().includes('date') && value ? formatDateForInput(value) : value;
            return acc;
          }, {});
          setFormData((prev) => ({ ...prev, ...formattedData }));
        }
      } catch (error) {
        console.error('Error fetching BG data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (ponumber) fetchBGData();
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
      const response = await fetch('/api/poschedule/bankguarantee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponumber, bgdata: formattedData }),
      });
      const data = await response.json();
      alert(data.success ? 'Bank Guarantee data saved successfully!' : 'Error saving Bank Guarantee data');
    } catch (error) {
      console.error('Error saving BG data:', error);
      alert('Error saving Bank Guarantee data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScheduleSection
      title="Bank Guarantee Data"
      accentClass="bg-violet-600"
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

export default BankGuaranteeData;
