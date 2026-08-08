import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiArrowLeft, FiX, FiCalendar } from 'react-icons/fi';

import GeneralPOData from '../../../components/POSchedule/GeneralPOData';
import PaymentScheduleData from '../../../components/POSchedule/PaymentScheduleData';
import BankGuaranteeData from '../../../components/POSchedule/BankGuaranteeData';
import LCData from '../../../components/POSchedule/LCData';
import ProgressMilestoneData from '../../../components/POSchedule/ProgressMilestoneData';
import ShipmentData from '../../../components/POSchedule/ShipmentData';

export default function POSchedulePage() {
  const router = useRouter();
  const { ponumber } = router.query;
  const [activeTab, setActiveTab] = useState('general');
  const [isNewTab, setIsNewTab] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.opener) {
      setIsNewTab(true);
    }
  }, []);

  if (!ponumber) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center font-[Poppins,sans-serif]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'payment', label: 'Payment Schedule' },
    { id: 'bank', label: 'Bank Guarantee' },
    { id: 'lc', label: 'Letter of Credit' },
    { id: 'progress', label: 'Progress / Inspection' },
    { id: 'shipping', label: 'Shipping' },
  ];

  return (
    <div className="app-page min-h-screen text-app-text flex flex-col pb-12 font-[Poppins,sans-serif]">
      <Head>
        <title>Schedule PO: {ponumber}</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-app-text flex items-center gap-3 tracking-tight">
              <button
                type="button"
                onClick={() => (isNewTab ? window.close() : router.back())}
                className="p-2 hover:bg-app-surface-muted rounded-lg transition-colors text-app-text-muted hover:text-app-text border border-transparent hover:border-app-border"
                title={isNewTab ? 'Close Tab' : 'Back'}
              >
                {isNewTab ? <FiX /> : <FiArrowLeft />}
              </button>
              <span className="inline-flex items-center gap-2">
                <FiCalendar className="text-app-accent hidden sm:inline" />
                Update Schedule
              </span>
              <span className="text-app-accent font-semibold">{ponumber}</span>
            </h1>
            <p className="text-sm text-app-text-muted mt-2 ml-11">
              Fill out the schedule forms below. Each section saves independently.
            </p>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-app-border px-4 sm:px-6 bg-app-surface-muted/60">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3.5 px-2 sm:px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-app-accent text-app-accent'
                      : 'border-transparent text-app-text-muted hover:text-app-text hover:border-app-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6 bg-app-bg/40">
            {activeTab === 'general' && <GeneralPOData ponumber={ponumber} />}
            {activeTab === 'payment' && <PaymentScheduleData ponumber={ponumber} />}
            {activeTab === 'bank' && <BankGuaranteeData ponumber={ponumber} />}
            {activeTab === 'lc' && <LCData ponumber={ponumber} />}
            {activeTab === 'progress' && <ProgressMilestoneData ponumber={ponumber} />}
            {activeTab === 'shipping' && <ShipmentData ponumber={ponumber} />}
          </div>
        </div>
      </div>
    </div>
  );
}
