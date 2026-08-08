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
  { name: 'advamountpaid', label: 'Advance Amount Paid', type: 'number' },
  { name: 'advpaiddate', label: 'Advance Payment Date', type: 'date' },
  { name: 'milestoneamountpaid', label: 'Milestone Amount Paid', type: 'number' },
  { name: 'milestoneamountpaiddate', label: 'Milestone Payment Date', type: 'date' },
  { name: 'finalpaidamt', label: 'Final Amount Paid', type: 'number' },
  { name: 'finalpaiddate', label: 'Final Payment Date', type: 'date' },
  { name: 'paymentcomments', label: 'Payment Comments', type: 'textarea' },
];

const PaymentScheduleData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await fetch(`/api/poschedule/payment?ponumber=${ponumber}`);
        const data = await response.json();
        if (data.success && data.paymentdata) {
          const formattedData = Object.entries(data.paymentdata).reduce((acc, [key, value]) => {
            acc[key] = key.toLowerCase().includes('date') && value ? formatDateForInput(value) : value;
            return acc;
          }, {});
          setFormData((prev) => ({ ...prev, ...formattedData }));
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (ponumber) fetchPaymentData();
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
      const response = await fetch('/api/poschedule/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponumber, paymentdata: formattedData }),
      });
      const data = await response.json();
      alert(data.success ? 'Payment data saved successfully!' : 'Error saving payment data');
    } catch (error) {
      console.error('Error saving payment data:', error);
      alert('Error saving payment data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScheduleSection
      title="Payment Schedule Data"
      accentClass="bg-teal-600"
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

export default PaymentScheduleData;
