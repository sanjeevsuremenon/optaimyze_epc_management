import React, { useEffect, useState, useMemo } from 'react';
import HeaderComponent from '../HeaderNewComponent';
import FooterComponent from '../FooterComponent';
import moment from 'moment';
import Link from 'next/link';
import { FiFileText, FiArrowUp, FiArrowDown } from 'react-icons/fi';

function VendorsNoPOList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'desc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <FiArrowUp className="inline ml-1" />
    ) : (
      <FiArrowDown className="inline ml-1" />
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reports/vendors/no-purchaseorders');
        if (!res.ok) throw new Error('Failed to fetch report');
        const data = await res.json();
        setVendors(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedVendors = useMemo(() => {
    const items = [...vendors];
    const { key, direction } = sortConfig;
    items.sort((a, b) => {
      const dir = direction === 'asc' ? 1 : -1;

      if (key === 'vendor-code') {
        return (a['vendor-code'] || '').localeCompare(b['vendor-code'] || '') * dir;
      }
      if (key === 'vendor-name') {
        return (a['vendor-name'] || '').localeCompare(b['vendor-name'] || '') * dir;
      }
      if (key === 'created_date') {
        const da = a['created_date'] ? new Date(a['created_date']) : new Date(0);
        const db = b['created_date'] ? new Date(b['created_date']) : new Date(0);
        return (da - db) * dir;
      }
      if (key === 'created_by') {
        return (a['created_by'] || '').localeCompare(b['created_by'] || '') * dir;
      }
      return 0;
    });
    return items;
  }, [vendors, sortConfig]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent />
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading vendor report...</p>
      </div>
      <FooterComponent />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent />
      <div className="container mx-auto px-4 py-12 text-center text-red-600">Error: {error}</div>
      <FooterComponent />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Vendors without Purchase Orders</h1>
            <p className="text-sm text-gray-600 mt-1">List of vendors (code, name, date of registration, created by) who have no purchase orders. Vendors with uploaded documents show a flag to the right.</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-left divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => requestSort('vendor-code')}>Vendor Code <SortIndicator columnKey={'vendor-code'} /></button>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => requestSort('vendor-name')}>Vendor Name <SortIndicator columnKey={'vendor-name'} /></button>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => requestSort('created_date')}>Registered <SortIndicator columnKey={'created_date'} /></button>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => requestSort('created_by')}>Created By <SortIndicator columnKey={'created_by'} /></button>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Docs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedVendors.map((v, idx) => (
                <tr key={`${v['vendor-code']}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <Link href={`/vendorpage?vendorcode=${encodeURIComponent(v['vendor-code'])}`} className="text-blue-600 hover:underline">
                      {v['vendor-code']}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v['vendor-name']}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v['created_date'] ? moment(v['created_date']).format('YYYY-MM-DD') : 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v['created_by'] || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {v.documentsUploaded ? (
                      <Link href={`/vendordocview/${encodeURIComponent(v['vendor-code'])}`} className="inline-flex items-center gap-2 text-green-600 hover:underline">
                          <FiFileText />
                          <span className="text-xs">Docs</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-gray-500">Total: {vendors.length}</div>
      </div>
      <FooterComponent />
    </div>
  );
}

export default VendorsNoPOList;
