import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiArrowLeft, FiX } from 'react-icons/fi';

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
    if (window.opener) {
      setIsNewTab(true);
    }
  }, []);

  if (!ponumber) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'payment', label: 'Payment Schedule' },
    { id: 'bank', label: 'Bank Guarantee' },
    { id: 'lc', label: 'Letter of Credit (LC)' },
    { id: 'progress', label: 'Progress/Inspection' },
    { id: 'shipping', label: 'Shipping' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col pb-12">
      <Head>
        <title>Schedule PO: {ponumber}</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <button 
                onClick={() => isNewTab ? window.close() : router.back()}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                title={isNewTab ? "Close Tab" : "Back"}
              >
                {isNewTab ? <FiX /> : <FiArrowLeft />}
              </button>
              Update Schedule: <span className="text-cyan-400">{ponumber}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 ml-11">Fill out the schedule forms below. Each section saves independently.</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Tabs Navigation */}
          <div className="border-b border-slate-800 px-6 bg-slate-900/50">
            <nav className="flex space-x-6 overflow-x-auto custom-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-slate-950/30">
            {activeTab === 'general' && <GeneralPOData ponumber={ponumber} />}
            {activeTab === 'payment' && <PaymentScheduleData ponumber={ponumber} />}
            {activeTab === 'bank' && <BankGuaranteeData ponumber={ponumber} />}
            {activeTab === 'lc' && <LCData ponumber={ponumber} />}
            {activeTab === 'progress' && <ProgressMilestoneData ponumber={ponumber} />}
            {activeTab === 'shipping' && <ShipmentData ponumber={ponumber} />}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        /* Force dark mode for imported components if they use standard classes */
        .bg-white { background-color: #0f172a !important; color: #f1f5f9 !important; border-color: #1e293b !important; }
        .text-gray-900, .text-gray-800, .text-blue-900 { color: #f8fafc !important; font-size: 0.875rem !important; }
        .text-gray-700, .text-gray-600, .text-gray-500 { color: #94a3b8 !important; }
        .bg-gray-50, .bg-blue-50 { background-color: #1e293b !important; border-color: #334155 !important; }
        .bg-blue-50\\/50, .bg-blue-50\\/30, .bg-blue-50\\/60 { background-color: #0f172a !important; }
        .border-gray-200, .border-blue-200, .border-blue-100 { border-color: #334155 !important; }
        input, textarea, select { background-color: #1e293b !important; color: #f8fafc !important; border-color: #334155 !important; font-size: 0.875rem !important; font-weight: normal !important; }
        
        /* Sober up striking colors */
        .bg-blue-600 { background-color: #334155 !important; color: #cbd5e1 !important; }
        .hover\\:bg-blue-700:hover { background-color: #475569 !important; }
        .text-red-600 { color: #38bdf8 !important; font-weight: 500 !important; } /* Soft sky blue instead of neon red */
        .bg-red-50 { background-color: #0f172a !important; border-color: #38bdf8 !important; }
        
        /* Tone down typography */
        .text-lg, .text-xl { font-size: 1rem !important; font-weight: 600 !important; }
        .font-extrabold { font-weight: 600 !important; }
        label { font-size: 0.75rem !important; font-weight: 500 !important; color: #94a3b8 !important; text-transform: uppercase; letter-spacing: 0.025em; }
        
        /* Reduce padding/margins for smaller footprint */
        .p-4 { padding: 0.75rem !important; }
        .mb-4 { margin-bottom: 0.75rem !important; }
      `}</style>
    </div>
  );
}