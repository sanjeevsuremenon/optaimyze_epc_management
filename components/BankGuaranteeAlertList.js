import React from 'react';
import { FiShield, FiClock, FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi';
import moment from 'moment';
import { useRouter } from 'next/router';

const BankGuaranteeAlertList = ({ bgAlerts = [], onOpenComment }) => {
  const router = useRouter();

  const getSeverityColor = (daysOverdue) => {
    if (daysOverdue <= 7) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (daysOverdue <= 30) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };

  const getSeverityIcon = (daysOverdue) => {
    if (daysOverdue <= 7) return 'text-rose-500';
    if (daysOverdue <= 30) return 'text-orange-500';
    return 'text-yellow-500';
  };

  if (bgAlerts.length === 0) {
    return (
      <div className="p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <FiShield className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-app-text mb-1">No Bank Guarantee Alerts</h3>
          <p className="text-sm text-app-text-muted">All bank guarantees are currently properly managed and within expiry limits.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-app-border bg-app-surface-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiShield className="h-5 w-5 text-amber-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-app-text">
                Bank Guarantee Expiry Alerts
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-app-bg text-amber-400 py-1 px-3 rounded-full text-xs font-bold border border-app-border shadow-sm">
              {bgAlerts.length} Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[16%]" />
            <col className="w-[7%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead className="bg-app-bg sticky top-0 z-10 shadow-sm border-b border-app-border">
            <tr>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Vendor</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Plant</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Open Value</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">BG Type</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Expiry Date</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider">Days Overdue</th>
              <th className="px-4 py-3 text-[11px] font-bold text-app-text-muted uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/50 bg-app-surface">
            {bgAlerts.map((po, index) => (
              <tr key={index} className="hover:bg-app-surface/40 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-xs font-bold text-app-accent">
                    {po.ponumber}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-app-text capitalize break-words font-medium">
                    {po.poDetails?.vendorname?.toLowerCase() || 'N/A'}
                  </div>
                  <div className="text-[10px] text-app-text-muted font-mono mt-0.5">
                    {po.poDetails?.vendorcode || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-app-text-secondary">
                  {po.poDetails?.plant || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-emerald-400">
                  {po.poDetails?.openvalue ? 
                    `${po.poDetails.openvalue.toLocaleString()} SAR` : 
                    'N/A'
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    {po.daysOverdue.map((bgAlert, bgIndex) => (
                      <div key={bgIndex} className="flex items-center">
                        <FiShield className="h-3 w-3 mr-1.5 text-amber-500" />
                        <span className="text-[11px] font-bold text-app-text-secondary uppercase tracking-wide">
                          {bgAlert.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    {po.daysOverdue.map((bgAlert, bgIndex) => (
                      <div key={bgIndex} className="text-xs font-mono text-app-text-secondary">
                        {bgAlert.amount ? 
                          `${bgAlert.amount.toLocaleString()}` : 
                          'N/A'
                        }
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    {po.daysOverdue.map((bgAlert, bgIndex) => (
                      <div key={bgIndex} className="text-xs text-app-text-muted">
                        {moment(bgAlert.expirydate).format('MMM D, YYYY')}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1.5">
                    {po.daysOverdue.map((bgAlert, bgIndex) => (
                      <div key={bgIndex}>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityColor(bgAlert.daysOverdue)}`}
                        >
                          <FiClock className={`h-2.5 w-2.5 mr-1 ${getSeverityIcon(bgAlert.daysOverdue)}`} />
                          {bgAlert.daysOverdue} day{bgAlert.daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/openpurchaseorders1/schedule/${po.ponumber}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-violet-600 text-app-text-secondary hover:text-app-text rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-violet-500"
                      title="Update Schedule"
                    >
                      <FiCalendar size={12} /> Schedule
                    </button>
                    <button
                      onClick={() => onOpenComment(po.ponumber)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-blue-600 text-app-text-secondary hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-blue-500"
                      title="View/Add Comments"
                    >
                      <FiMessageSquare size={12} /> Comment
                    </button>
                    <button
                      onClick={() => router.push(`/openpurchaseorders1/view/${po.ponumber}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-app-surface hover:bg-app-accent text-app-text-secondary hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-app-border hover:border-app-accent"
                      title="View PO Details & Timeline"
                    >
                      <FiEye size={12} /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankGuaranteeAlertList;