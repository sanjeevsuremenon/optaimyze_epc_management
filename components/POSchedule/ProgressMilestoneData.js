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
  { name: 'mfgstart', label: 'Manufacturing Start Date', type: 'date' },
  { name: 'Bldate', label: 'BL Date', type: 'date' },
  { name: 'Fatdate', label: 'FAT Date', type: 'date' },
  { name: 'Fatreportdate', label: 'FAT Report Date', type: 'date' },
  { name: 'vesselreacheddate', label: 'Vessel Reached Date', type: 'date' },
  { name: 'customscleareddate', label: 'Customs Cleared Date', type: 'date' },
];

const ProgressMilestoneData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const response = await fetch(`/api/poschedule/progress?ponumber=${ponumber}`);
        const data = await response.json();
        if (data.success && data.progressdata) {
          const formattedData = Object.entries(data.progressdata).reduce((acc, [key, value]) => {
            if (value) acc[key] = formatDateForInput(value);
            return acc;
          }, {});
          setFormData((prev) => ({ ...prev, ...formattedData }));
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (ponumber) fetchProgressData();
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
        if (value) acc[key] = new Date(value).toISOString();
        return acc;
      }, {});
      const response = await fetch('/api/poschedule/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponumber, progressdata: formattedData }),
      });
      const data = await response.json();
      alert(data.success ? 'Progress data saved successfully!' : 'Error saving progress data');
    } catch (error) {
      console.error('Error saving progress data:', error);
      alert('Error saving progress data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScheduleSection
      title="Progress Milestone Data"
      accentClass="bg-emerald-600"
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

export default ProgressMilestoneData;
