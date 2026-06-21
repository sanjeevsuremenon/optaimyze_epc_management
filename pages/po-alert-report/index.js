import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiClock, FiShield, FiExternalLink, FiFileText } from 'react-icons/fi';
import moment from 'moment';
import Head from 'next/head';
import DeliveryAlertList from '../../components/DeliveryAlertList';
import BankGuaranteeAlertList from '../../components/BankGuaranteeAlertList';
import LCAlertList from '../../components/LCAlertList';
import POCommentModal from '../../components/PO/POCommentModal';

const POAlertReport = () => {
  const [deliveryAlerts, setDeliveryAlerts] = useState([]);
  const [bgAlerts, setBgAlerts] = useState([]);
  const [lcAlerts, setLcAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New UI states
  const [activeTab, setActiveTab] = useState('delivery');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        
        // Fetch delivery alerts
        const deliveryResponse = await fetch('/api/reports/purchaseorders/deliverydatepassed');
        if (deliveryResponse.ok) {
          const deliveryData = await deliveryResponse.json();
          setDeliveryAlerts(deliveryData);
        }

        // Fetch BG alerts
        const bgResponse = await fetch('/api/reports/purchaseorders/bankguaranteealerts');
        if (bgResponse.ok) {
          const bgData = await bgResponse.json();
          setBgAlerts(bgData);
        }

        // Fetch LC alerts
        const lcResponse = await fetch('/api/reports/purchaseorders/lcalerts');
        if (lcResponse.ok) {
          const lcData = await lcResponse.json();
          setLcAlerts(lcData);
        }
        
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const totalAlerts = deliveryAlerts.length + bgAlerts.length + lcAlerts.length;

  const openCommentModal = (poNumber) => {
    setSelectedPO(poNumber);
    setIsCommentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent"></div>
        <span className="ml-4 text-app-text-secondary font-medium">Loading comprehensive alert reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center">
        <div className="bg-app-surface border border-app-border rounded-xl p-8 max-w-md text-center shadow-2xl">
          <FiAlertTriangle className="mx-auto h-12 w-12 mb-4 text-rose-500" />
          <h2 className="text-xl font-bold text-app-text mb-2">Error Loading Data</h2>
          <p className="text-app-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen text-app-text font-sans">
      <Head>
        <title>PO Alert Report</title>
      </Head>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8 bg-app-surface border border-app-border rounded-2xl p-6 shadow-xl relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <FiAlertTriangle size={150} className="text-rose-500" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-app-text tracking-tight mb-2">PO Alert Report</h1>
            <p className="text-app-text-muted">
              Comprehensive view of all purchase order alerts requiring attention
            </p>
          </div>
          <div className="relative z-10 text-right bg-app-bg/50 p-4 rounded-xl border border-app-border/50">
            <p className="text-xs text-app-text-muted uppercase tracking-wide mb-1">Report Date</p>
            <p className="text-xl font-bold text-app-text">
              {moment().format('MMM D, YYYY')}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiAlertTriangle className="h-20 w-20 text-rose-500" />
            </div>
            <div className="relative z-10 flex items-center">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <FiAlertTriangle className="h-7 w-7 text-rose-500" />
              </div>
              <div className="ml-5">
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1">Total Alerts</p>
                <p className="text-3xl font-extrabold text-app-text">{totalAlerts}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('delivery')}
            className={`cursor-pointer bg-app-surface border rounded-xl shadow-lg p-6 relative overflow-hidden group transition-all ${activeTab === 'delivery' ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiCalendar className="h-20 w-20 text-orange-500" />
            </div>
            <div className="relative z-10 flex items-center">
              <div className={`p-4 rounded-xl border transition-colors ${activeTab === 'delivery' ? 'bg-orange-500/20 border-orange-500/30' : 'bg-orange-500/10 border-orange-500/20'}`}>
                <FiCalendar className="h-7 w-7 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1">Delivery Alerts</p>
                <p className="text-3xl font-extrabold text-app-text">{deliveryAlerts.length}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('bg')}
            className={`cursor-pointer bg-app-surface border rounded-xl shadow-lg p-6 relative overflow-hidden group transition-all ${activeTab === 'bg' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiShield className="h-20 w-20 text-amber-500" />
            </div>
            <div className="relative z-10 flex items-center">
              <div className={`p-4 rounded-xl border transition-colors ${activeTab === 'bg' ? 'bg-amber-500/20 border-amber-500/30' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <FiShield className="h-7 w-7 text-amber-500" />
              </div>
              <div className="ml-5">
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1">BG Alerts</p>
                <p className="text-3xl font-extrabold text-app-text">{bgAlerts.length}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('lc')}
            className={`cursor-pointer bg-app-surface border rounded-xl shadow-lg p-6 relative overflow-hidden group transition-all ${activeTab === 'lc' ? 'border-app-accent ring-1 ring-app-accent/50' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiFileText className="h-20 w-20 text-cyan-500" />
            </div>
            <div className="relative z-10 flex items-center">
              <div className={`p-4 rounded-xl border transition-colors ${activeTab === 'lc' ? 'bg-app-accent/20 border-app-accent/30' : 'bg-app-accent/10 border-app-accent/20'}`}>
                <FiFileText className="h-7 w-7 text-cyan-500" />
              </div>
              <div className="ml-5">
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1">LC Alerts</p>
                <p className="text-3xl font-extrabold text-app-text">{lcAlerts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-app-border mb-8">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`py-3 px-6 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'delivery' 
                ? 'bg-app-surface text-orange-400 border-t border-x border-slate-800' 
                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
            }`}
          >
            <FiCalendar size={16} /> Delivery Dates
            <span className="bg-app-bg text-app-text-secondary py-0.5 px-2 rounded-full text-xs ml-2 border border-app-border/50">{deliveryAlerts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('bg')}
            className={`py-3 px-6 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'bg' 
                ? 'bg-app-surface text-amber-400 border-t border-x border-slate-800' 
                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
            }`}
          >
            <FiShield size={16} /> Bank Guarantees
            <span className="bg-app-bg text-app-text-secondary py-0.5 px-2 rounded-full text-xs ml-2 border border-app-border/50">{bgAlerts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('lc')}
            className={`py-3 px-6 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'lc' 
                ? 'bg-app-surface text-app-accent border-t border-x border-slate-800' 
                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
            }`}
          >
            <FiFileText size={16} /> Letters of Credit
            <span className="bg-app-bg text-app-text-secondary py-0.5 px-2 rounded-full text-xs ml-2 border border-app-border/50">{lcAlerts.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden mb-8">
          {activeTab === 'delivery' && (
            <DeliveryAlertList passedPOs={deliveryAlerts} onOpenComment={openCommentModal} />
          )}
          {activeTab === 'bg' && (
            <BankGuaranteeAlertList bgAlerts={bgAlerts} onOpenComment={openCommentModal} />
          )}
          {activeTab === 'lc' && (
            <LCAlertList lcAlerts={lcAlerts} onOpenComment={openCommentModal} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 bg-app-surface border border-app-border rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-app-text-muted">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-app-text mb-1 flex items-center gap-2"><FiAlertTriangle className="text-rose-400"/> Alert Management</h3>
              <p>Use the action buttons on any alert to quickly Schedule, Comment, or View detailed PO information.</p>
            </div>
            <div className="flex space-x-6">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-rose-500 rounded-full mr-2 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                Critical (≤ 7 days)
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                Warning (8-30 days)
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                Info (&gt; 30 days)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Universal PO Comment Modal */}
      <POCommentModal 
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        poNumber={selectedPO}
      />
    </div>
  );
};

export default POAlertReport; 