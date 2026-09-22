import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiClock, FiShield, FiExternalLink, FiFileText } from 'react-icons/fi';
import { AlertOctagon, ShieldAlert, FileWarning, CalendarClock } from 'lucide-react';
import moment from 'moment';
import Head from 'next/head';
import DeliveryAlertList from '../../components/DeliveryAlertList';
import BankGuaranteeAlertList from '../../components/BankGuaranteeAlertList';
import LCAlertList from '../../components/LCAlertList';
import POCommentModal from '../../components/PO/POCommentModal';
import GlassSubPageHero from '../../components/GlassSubPageHero';
import { GlassStyles, Tilt } from '../../components/landing/glass';

const POAlertReport = () => {
  const [deliveryAlerts, setDeliveryAlerts] = useState([]);
  const [bgAlerts, setBgAlerts] = useState([]);
  const [lcAlerts, setLcAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
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
      <div className="app-page min-h-screen flex items-center justify-center font-sans">
        <GlassStyles />
        <div className="flex items-center gap-3 bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl px-6 py-4 shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          <span className="text-app-text-secondary font-medium text-sm">Loading comprehensive alert reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center font-sans p-4">
        <GlassStyles />
        <div className="bg-app-surface/90 backdrop-blur-md border border-rose-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <FiAlertTriangle className="mx-auto h-12 w-12 mb-4 text-rose-500" />
          <h2 className="text-xl font-bold text-app-text mb-2">Error Loading Data</h2>
          <p className="text-app-text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen text-app-text font-sans">
      <GlassStyles />
      <Head>
        <title>PO Alert Report | OPTAIMYZE</title>
      </Head>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl space-y-6">
        
        {/* Glass Subpage Hero */}
        <GlassSubPageHero
          icon={AlertOctagon}
          eyebrow="RISK & COMPLIANCE"
          title="PO Alert Report"
          description="Comprehensive view of all purchase order alerts requiring operational attention and milestone tracking."
          accent="rose"
          moduleKey="purchaseorders"
        >
          <div className="text-right bg-app-surface/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-app-border/60">
            <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-wider">Report Date</p>
            <p className="text-sm font-extrabold text-app-text">
              {moment().format('MMM D, YYYY')}
            </p>
          </div>
        </GlassSubPageHero>

        {/* Summary Bento KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Total Alerts */}
          <Tilt glow="rose" className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Total Active Alerts</p>
                <p className="text-2xl md:text-3xl font-black text-rose-500">{totalAlerts}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-app-text-muted flex items-center gap-1.5 border-t border-app-border/40 pt-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Requires immediate review
            </div>
          </Tilt>

          {/* Delivery Alerts */}
          <div onClick={() => setActiveTab('delivery')} className="cursor-pointer">
            <Tilt glow="amber" className={`bg-app-surface/90 backdrop-blur-md border rounded-2xl p-5 shadow-sm transition-all ${
              activeTab === 'delivery' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-app-border hover:border-amber-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Delivery Alerts</p>
                  <p className="text-2xl md:text-3xl font-black text-amber-500">{deliveryAlerts.length}</p>
                </div>
                <div className={`p-3 rounded-xl border transition-colors ${
                  activeTab === 'delivery' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                }`}>
                  <FiCalendar className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-app-text-muted flex items-center justify-between border-t border-app-border/40 pt-2.5">
                <span>Passed delivery dates</span>
                <span className="font-bold text-amber-500 text-[10px] uppercase">Select</span>
              </div>
            </Tilt>
          </div>

          {/* BG Alerts */}
          <div onClick={() => setActiveTab('bg')} className="cursor-pointer">
            <Tilt glow="violet" className={`bg-app-surface/90 backdrop-blur-md border rounded-2xl p-5 shadow-sm transition-all ${
              activeTab === 'bg' ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-app-border hover:border-violet-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Bank Guarantees</p>
                  <p className="text-2xl md:text-3xl font-black text-violet-500">{bgAlerts.length}</p>
                </div>
                <div className={`p-3 rounded-xl border transition-colors ${
                  activeTab === 'bg' ? 'bg-violet-500/20 border-violet-500/40 text-violet-500' : 'bg-violet-500/10 border-violet-500/20 text-violet-500'
                }`}>
                  <FiShield className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-app-text-muted flex items-center justify-between border-t border-app-border/40 pt-2.5">
                <span>Expiry thresholds</span>
                <span className="font-bold text-violet-500 text-[10px] uppercase">Select</span>
              </div>
            </Tilt>
          </div>

          {/* LC Alerts */}
          <div onClick={() => setActiveTab('lc')} className="cursor-pointer">
            <Tilt glow="cyan" className={`bg-app-surface/90 backdrop-blur-md border rounded-2xl p-5 shadow-sm transition-all ${
              activeTab === 'lc' ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-app-border hover:border-cyan-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider mb-1">Letters of Credit</p>
                  <p className="text-2xl md:text-3xl font-black text-cyan-500">{lcAlerts.length}</p>
                </div>
                <div className={`p-3 rounded-xl border transition-colors ${
                  activeTab === 'lc' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-500' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500'
                }`}>
                  <FiFileText className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-app-text-muted flex items-center justify-between border-t border-app-border/40 pt-2.5">
                <span>Expiry & validity</span>
                <span className="font-bold text-cyan-500 text-[10px] uppercase">Select</span>
              </div>
            </Tilt>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`py-2 px-4 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'delivery' 
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm' 
                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
            }`}
          >
            <FiCalendar size={14} /> Delivery Dates
            <span className="bg-app-bg text-app-text font-bold py-0.5 px-2 rounded-full text-[10px] border border-app-border">{deliveryAlerts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('bg')}
            className={`py-2 px-4 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'bg' 
                ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 shadow-sm' 
                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
            }`}
          >
            <FiShield size={14} /> Bank Guarantees
            <span className="bg-app-bg text-app-text font-bold py-0.5 px-2 rounded-full text-[10px] border border-app-border">{bgAlerts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('lc')}
            className={`py-2 px-4 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'lc' 
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm' 
                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
            }`}
          >
            <FiFileText size={14} /> Letters of Credit
            <span className="bg-app-bg text-app-text font-bold py-0.5 px-2 rounded-full text-[10px] border border-app-border">{lcAlerts.length}</span>
          </button>
        </div>

        {/* Tab Content in Glass Container */}
        <div className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm overflow-hidden">
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

        {/* Alert Severity Legend Footer */}
        <div className="bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl shadow-sm p-5">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-app-text-muted gap-4">
            <div>
              <h3 className="font-bold text-app-text mb-1 flex items-center gap-2 text-sm">
                <FiAlertTriangle className="text-rose-500"/> Alert Management & Action Workflow
              </h3>
              <p className="text-app-text-muted text-xs">Use action buttons on any alert row to quickly update schedule milestones, log audit comments, or view PO timeline.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 bg-app-bg/60 px-4 py-2.5 rounded-xl border border-app-border">
              <span className="flex items-center text-xs font-medium text-app-text">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full mr-2 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                Critical (≤ 7 days)
              </span>
              <span className="flex items-center text-xs font-medium text-app-text">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                Warning (8-30 days)
              </span>
              <span className="flex items-center text-xs font-medium text-app-text">
                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full mr-2 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
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