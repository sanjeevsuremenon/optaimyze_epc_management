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
  { name: 'poackdate', label: 'PO Acknowledgement Date', type: 'date' },
  { name: 'podelydate', label: 'PO Delivery Date', type: 'date' },
  { name: 'estdelydate', label: 'Estimated Delivery Date', type: 'date' },
  { name: 'delysch', label: 'Delivery Schedule', type: 'text' },
  { name: 'basedesignapprdate', label: 'Base Design Approval Date', type: 'date' },
  { name: 'basedesigncomments', label: 'Base Design Comments', type: 'textarea' },
  { name: 'generalcomments', label: 'General Comments', type: 'textarea' },
  { name: 'basedesignrecdate', label: 'Base Design Receipt Date', type: 'date' },
  { name: 'mfgclearancedate', label: 'Manufacturing Clearance Date', type: 'date' },
  { name: 'itpapprdate', label: 'ITP Approval Date', type: 'date' },
  { name: 'detdesignrecdate', label: 'Detailed Design Receipt Date', type: 'date' },
  { name: 'detdesignaprdate', label: 'Detailed Design Approval Date', type: 'date' },
  { name: 'grdate', label: 'GR Date', type: 'date' },
  { name: 'finalworkcompleteddate', label: 'Final Work Completion Date', type: 'date' },
];

const GeneralPOData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const fetchGeneralData = async () => {
      try {
        const response = await fetch(`/api/poschedule/general?ponumber=${ponumber}`);
        const data = await response.json();
        if (data.success && data.generaldata) {
          const formattedData = Object.entries(data.generaldata).reduce((acc, [key, value]) => {
            acc[key] = key.toLowerCase().includes('date') && value ? formatDateForInput(value) : value;
            return acc;
          }, {});
          setFormData((prev) => ({ ...prev, ...formattedData }));
        }
      } catch (error) {
        console.error('Error fetching general data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (ponumber) fetchGeneralData();
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
      const response = await fetch('/api/poschedule/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponumber, generaldata: formattedData }),
      });
      const data = await response.json();
      alert(data.success ? 'Data saved successfully!' : 'Error saving data');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScheduleSection
      title="General PO Progress Data"
      accentClass="bg-sky-600"
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

export default GeneralPOData;
