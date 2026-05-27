import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiClock, FiExternalLink, FiShield } from 'react-icons/fi';
import moment from 'moment';
import { useRouter } from 'next/router';

const BankGuaranteeAlertList = () => {
  const router = useRouter();
  const [bgAlerts, setBgAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBGAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/purchaseorders/bankguaranteealerts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        setBgAlerts(data);
      } catch (err) {
        console.error('Error fetching BG alerts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBGAlerts();
  }, []);

  const getSeverityColor = (daysOverdue) => {
    if (daysOverdue <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (daysOverdue <= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityIcon = (daysOverdue) => {
    if (daysOverdue <= 7) return 'text-yellow-500';
    if (daysOverdue <= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const handleViewPO = (ponumber) => {
    // Use the same modal approach as delivery alerts
    window.open(`/po-alert-report/view-po?ponumber=${ponumber}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading bank guarantee alerts...</span>
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

  if (bgAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-green-600">
          <FiShield className="mx-auto h-8 w-8 mb-2" />
          <h3 className="text-lg font-medium mb-1">No Bank Guarantee Alerts</h3>
          <p className="text-sm text-gray-600">All bank guarantees are properly managed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiShield className="h-6 w-6 text-orange-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Guarantee Alerts
              </h3>
              <p className="text-sm text-gray-600">
                {bgAlerts.length} PO{bgAlerts.length !== 1 ? 's' : ''} with expired bank guarantees
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
                  BG Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bgAlerts.map((po, index) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {po.daysOverdue.map((bgAlert, bgIndex) => (
                        <div key={bgIndex} className="flex items-center">
                          <FiShield className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {bgAlert.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {po.daysOverdue.map((bgAlert, bgIndex) => (
                        <div key={bgIndex} className="text-sm text-gray-500">
                          {bgAlert.amount ? 
                            `${bgAlert.amount.toLocaleString()} SAR` : 
                            'N/A'
                          }
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {po.daysOverdue.map((bgAlert, bgIndex) => (
                        <div key={bgIndex} className="text-sm text-gray-900">
                          {moment(bgAlert.expirydate).format('MMM D, YYYY')}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {po.daysOverdue.map((bgAlert, bgIndex) => (
                        <span
                          key={bgIndex}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(bgAlert.daysOverdue)}`}
                        >
                          <FiClock className={`h-3 w-3 mr-1 ${getSeverityIcon(bgAlert.daysOverdue)}`} />
                          {bgAlert.daysOverdue} day{bgAlert.daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      ))}
                    </div>
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
              {bgAlerts.length} PO{bgAlerts.length !== 1 ? 's' : ''} with expired bank guarantees
            </span>
          </div>
          <div className="flex space-x-4">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              ≤ 7 days
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
              8-30 days
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              &gt; 30 days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankGuaranteeAlertList; 