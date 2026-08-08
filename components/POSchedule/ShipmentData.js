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
  { name: 'shipmentbookeddate', label: 'Shipment Booked Date', type: 'date' },
  { name: 'grossweight', label: 'Gross Weight', type: 'number' },
  { name: 'saberapplieddate', label: 'SABER Applied Date', type: 'date' },
  { name: 'saberreceiveddate', label: 'SABER Received Date', type: 'date' },
  { name: 'ffnoMinateddate', label: 'FF Nominated Date', type: 'date' },
  { name: 'finalremarks', label: 'Final Remarks', type: 'textarea' },
];

const ShipmentData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const fetchShipmentData = async () => {
      try {
        const response = await fetch(`/api/poschedule/shipment?ponumber=${ponumber}`);
        const data = await response.json();
        if (data.success && data.shipdata) {
          const formattedData = Object.entries(data.shipdata).reduce((acc, [key, value]) => {
            acc[key] = key.toLowerCase().includes('date') && value ? formatDateForInput(value) : value;
            return acc;
          }, {});
          setFormData((prev) => ({ ...prev, ...formattedData }));
        }
      } catch (error) {
        console.error('Error fetching shipment data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (ponumber) fetchShipmentData();
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
      const response = await fetch('/api/poschedule/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponumber, shipdata: formattedData }),
      });
      const data = await response.json();
      alert(data.success ? 'Shipment data saved successfully!' : 'Error saving shipment data');
    } catch (error) {
      console.error('Error saving shipment data:', error);
      alert('Error saving shipment data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScheduleSection
      title="Packing & Shipment Data"
      accentClass="bg-rose-600"
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

export default ShipmentData;
