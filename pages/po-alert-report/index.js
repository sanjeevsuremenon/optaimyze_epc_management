import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiClock, FiShield, FiExternalLink, FiFileText } from 'react-icons/fi';
import moment from 'moment';
import DeliveryAlertList from '../../components/DeliveryAlertList';
import BankGuaranteeAlertList from '../../components/BankGuaranteeAlertList';
import LCAlertList from '../../components/LCAlertList';

const POAlertReport = () => {
  const [deliveryAlerts, setDeliveryAlerts] = useState([]);
  const [bgAlerts, setBgAlerts] = useState([]);
  const [lcAlerts, setLcAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading alert reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            <FiAlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>Error loading data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PO Alert Report</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive view of all purchase order alerts requiring attention
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Report Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {moment().format('MMM D, YYYY')}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <FiCalendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivery Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{deliveryAlerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <FiShield className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bank Guarantee Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{bgAlerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FiFileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">LC Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{lcAlerts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Sections */}
        <div className="space-y-8">
          {/* Delivery Alerts */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiCalendar className="mr-2 text-red-500" />
                Delivery Date Alerts
              </h2>
              <p className="text-sm text-gray-600">
                POs with delivery dates that have passed
              </p>
            </div>
            <DeliveryAlertList />
          </div>

          {/* Bank Guarantee Alerts */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiShield className="mr-2 text-orange-500" />
                Bank Guarantee Alerts
              </h2>
              <p className="text-sm text-gray-600">
                POs with expired bank guarantees
              </p>
            </div>
            <BankGuaranteeAlertList />
          </div>

          {/* LC Alerts */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiFileText className="mr-2 text-blue-500" />
                Letter of Credit Alerts
              </h2>
              <p className="text-sm text-gray-600">
                POs with LCs that are expired or expiring within 1 month
              </p>
            </div>
            <LCAlertList />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Alert Management</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click "View PO" on any alert to see detailed information and take action
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                Critical (≤ 7 days)
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                Warning (8-30 days)
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                Info (&gt; 30 days)
              </span>
            </div>
          </div>
        </div>
      </div>    </div>
  );
};

export default POAlertReport; 