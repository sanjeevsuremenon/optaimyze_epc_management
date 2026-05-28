import React from 'react';
import { FiFileText, FiClock, FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi';
import moment from 'moment';
import { useRouter } from 'next/router';

const LCAlertList = ({ lcAlerts = [], onOpenComment }) => {
  const router = useRouter();

  const getSeverityColor = (daysOverdue, daysUntilExpiry) => {
    if (daysOverdue > 0) {
      if (daysOverdue <= 7) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      if (daysOverdue <= 30) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    } else {
      if (daysUntilExpiry <= 7) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      if (daysUntilExpiry <= 30) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getSeverityIcon = (daysOverdue, daysUntilExpiry) => {
    if (daysOverdue > 0) {
      if (daysOverdue <= 7) return 'text-yellow-500';
      if (daysOverdue <= 30) return 'text-orange-500';
      return 'text-rose-500';
    } else {
      if (daysUntilExpiry <= 7) return 'text-rose-500';
      if (daysUntilExpiry <= 30) return 'text-orange-500';
      return 'text-yellow-500';
    }
  };

  if (lcAlerts.length === 0) {
    return (
      <div className="p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <FiFileText className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-1">No Letter of Credit Alerts</h3>
          <p className="text-sm text-slate-400">All Letters of Credit are currently properly managed and within expiry limits.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiFileText className="h-5 w-5 text-cyan-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Letter of Credit Expiry Alerts
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-slate-950 text-cyan-400 py-1 px-3 rounded-full text-xs font-bold border border-slate-800 shadow-sm">
              {lcAlerts.length} Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead className="bg-slate-950 sticky top-0 z-10 shadow-sm border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">PO Number</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plant</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Value</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">LC Amount</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opened Date</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900">
            {lcAlerts.map((po, index) => (
              <tr key={index} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-xs font-bold text-cyan-400">
                    {po.ponumber}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-slate-200 capitalize break-words font-medium">
                    {po.poDetails?.vendorname?.toLowerCase() || 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {po.poDetails?.vendorcode || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-300">
                  {po.poDetails?.plant || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-emerald-400">
                  {po.poDetails?.openvalue ? 
                    `${po.poDetails.openvalue.toLocaleString()} SAR` : 
                    'N/A'
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-300">
                  {po.lcAlert?.amount ? 
                    `${po.lcAlert.amount.toLocaleString()}` : 
                    'N/A'
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                  {po.lcAlert?.openeddate ? 
                    moment(po.lcAlert.openeddate).format('MMM D, YYYY') : 
                    'N/A'
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-300">
                  {po.lcAlert?.expirydate ? 
                    moment(po.lcAlert.expirydate).format('MMM D, YYYY') : 
                    'N/A'
                  }
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityColor(po.daysOverdue, po.daysUntilExpiry)}`}
                  >
                    <FiClock className={`h-2.5 w-2.5 mr-1 ${getSeverityIcon(po.daysOverdue, po.daysUntilExpiry)}`} />
                    {po.daysOverdue > 0 ? (
                      `${po.daysOverdue} day${po.daysOverdue !== 1 ? 's' : ''} expired`
                    ) : (
                      `${po.daysUntilExpiry} day${po.daysUntilExpiry !== 1 ? 's' : ''} left`
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/openpurchaseorders1/schedule/${po.ponumber}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-slate-700 hover:border-violet-500"
                      title="Update Schedule"
                    >
                      <FiCalendar size={12} /> Schedule
                    </button>
                    <button
                      onClick={() => onOpenComment(po.ponumber)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-slate-700 hover:border-blue-500"
                      title="View/Add Comments"
                    >
                      <FiMessageSquare size={12} /> Comment
                    </button>
                    <button
                      onClick={() => router.push(`/openpurchaseorders1/view/${po.ponumber}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-all shadow-sm border border-slate-700 hover:border-cyan-500"
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

export default LCAlertList;