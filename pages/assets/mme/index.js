import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Tablecomponent from '../../../components/Tablecomponent';
import { Boldstyle1, Boldstylesim, Cellstyle, Numberstyle } from '../../../components/Tablecomponent';

export default function MMEPage() {
  const [data, setData] = useState([]);
  const [assetNumberSearch, setAssetNumberSearch] = useState('');
  const [assetNameSearch, setAssetNameSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const searchEquipment = async (assetNumber, assetName) => {
    if ((!assetNumber?.trim() || assetNumber.trim().length < 2) && 
        (!assetName?.trim() || assetName.trim().length < 2)) {
      setData([]);
      return;
    }
    if (!assetNumber?.trim() && !assetName?.trim()) {
      setData([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (assetNumber?.trim()) params.append('assetNumber', assetNumber);
      if (assetName?.trim()) params.append('assetName', assetName);

      const response = await fetch(`/api/assets/mme?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchEquipment(assetNumberSearch, assetNameSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [assetNumberSearch, assetNameSearch]);

  const columns = useMemo(
    () => [
      {
        Header: "Asset Number",
        accessor: "assetnumber",
        Cell: ({ value }) => (
          <Link href={`/assets/${value}`} className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            {value}
          </Link>
        ),
      },
      {
        Header: "Description",
        accessor: "assetdescription",
        Cell: ({ value }) => <span className="text-slate-200">{value}</span>,
      },
      {
        Header: "Category",
        accessor: "assetcategory",
        Cell: ({ value }) => <Boldstylesim value={value || 'N/A'} />,
      },
      {
        Header: "Subcategory",
        accessor: "assetsubcategory",
      },
      {
        Header: "Status",
        accessor: "assetstatus",
        Cell: ({ value }) => <Cellstyle value={value || 'N/A'} />,
      },
      {
        Header: "Value",
        accessor: "acquiredvalue",
        Cell: ({ value }) => typeof value === 'number' ? <Numberstyle value={value} /> : 'N/A',
      },
      {
        Header: "Date",
        accessor: "acquireddate",
        Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A',
      },
      {
        Header: "QR Code",
        id: "qrcode",
        accessor: "assetnumber",
        Cell: ({ value }) => (
          <div className="bg-white p-1 inline-block rounded-md">
            <QRCodeSVG value={`https://app.jalinternational.com/assets/${value}`} size={48} />
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Head>
        <title>MME Equipment - Asset Management</title>
      </Head>

      <div className="mb-6 bg-slate-900/60 rounded-xl p-6 border border-slate-700 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">MME Equipment</h1>
        <p className="text-slate-400">Search and manage Machinery, Materials, and Equipment</p>
      </div>

      <div className="mb-6 bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={assetNumberSearch}
            onChange={(e) => setAssetNumberSearch(e.target.value)}
            placeholder="Search by asset number..."
            className="input input-bordered bg-slate-900/50 text-white border-slate-600 focus:border-cyan-500 w-full max-w-sm"
          />
          <input
            type="text"
            value={assetNameSearch}
            onChange={(e) => setAssetNameSearch(e.target.value)}
            placeholder="Search by asset description..."
            className="input input-bordered bg-slate-900/50 text-white border-slate-600 focus:border-cyan-500 w-full max-w-sm"
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-cyan-500"></span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p className="text-lg">Enter search criteria to view assets</p>
          </div>
        ) : (
          <Tablecomponent 
            columns={columns} 
            data={data} 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            enablePagination={true}
          />
        )}
      </div>
    </div>
  );
}
