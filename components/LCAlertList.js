import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiClock, FiExternalLink, FiFileText } from 'react-icons/fi';
import moment from 'moment';

const LCAlertList = () => {
  const [lcAlerts, setLcAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLCAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/purchaseorders/lcalerts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        setLcAlerts(data);
      } catch (err) {
        console.error('Error fetching LC alerts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLCAlerts();
  }, []);

  const getSeverityColor = (daysOverdue, daysUntilExpiry) => {
    if (daysOverdue > 0) {
      // Already expired
      if (daysOverdue <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      if (daysOverdue <= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
      return 'text-red-600 bg-red-50 border-red-200';
    } else {
      // Not yet expired
      if (daysUntilExpiry <= 7) return 'text-red-600 bg-red-50 border-red-200';
      if (daysUntilExpiry <= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getSeverityIcon = (daysOverdue, daysUntilExpiry) => {
    if (daysOverdue > 0) {
      // Already expired
      if (daysOverdue <= 7) return 'text-yellow-500';
      if (daysOverdue <= 30) return 'text-orange-500';
      return 'text-red-500';
    } else {
      // Not yet expired
      if (daysUntilExpiry <= 7) return 'text-red-500';
      if (daysUntilExpiry <= 30) return 'text-orange-500';
      return 'text-yellow-500';
    }
  };

  const handleViewPO = (ponumber) => {
    // Use the same modal approach as other alerts
    window.open(`/po-alert-report/view-po?ponumber=${ponumber}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading LC alerts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <FiAlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (lcAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-green-600">
          <FiFileText className="mx-auto h-8 w-8 mb-2" />
          <h3 className="text-lg font-medium mb-1">No LC Alerts</h3>
          <p className="text-sm text-gray-600">All LCs are properly managed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiFileText className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Letter of Credit Alerts
              </h3>
              <p className="text-sm text-gray-600">
                {lcAlerts.length} PO{lcAlerts.length !== 1 ? 's' : ''} with LC alerts
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Report Date</p>
            <p className="text-sm font-medium text-gray-900">
              {moment().format('MMM D, YYYY')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LC Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opened Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lcAlerts.map((po, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {po.ponumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {po.poDetails?.vendorname || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {po.poDetails?.vendorcode || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {po.poDetails?.plant || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {po.poDetails?.openvalue ? 
                      `${po.poDetails.openvalue.toLocaleString()} SAR` : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {po.lcAlert?.amount ? 
                      `${po.lcAlert.amount.toLocaleString()} SAR` : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {po.lcAlert?.openeddate ? 
                      moment(po.lcAlert.openeddate).format('MMM D, YYYY') : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {po.lcAlert?.expirydate ? 
                      moment(po.lcAlert.expirydate).format('MMM D, YYYY') : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(po.daysOverdue, po.daysUntilExpiry)}`}
                    >
                      <FiClock className={`h-3 w-3 mr-1 ${getSeverityIcon(po.daysOverdue, po.daysUntilExpiry)}`} />
                      {po.daysOverdue > 0 ? (
                        `${po.daysOverdue} day${po.daysOverdue !== 1 ? 's' : ''} expired`
                      ) : (
                        `${po.daysUntilExpiry} day${po.daysUntilExpiry !== 1 ? 's' : ''} left`
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPO(po.ponumber)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiExternalLink className="mr-1 h-3 w-3" />
                        View PO
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <span className="font-medium">Summary:</span>
            <span className="ml-2">
              {lcAlerts.length} PO{lcAlerts.length !== 1 ? 's' : ''} with LC alerts
            </span>
          </div>
          <div className="flex space-x-4">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              Critical (≤ 7 days)
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
              8-30 days
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              &gt; 30 days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LCAlertList; 