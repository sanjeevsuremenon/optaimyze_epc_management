import React from "react";
import { Edit2, Trash2 } from "lucide-react";

export default function MasterTable({ data, fields, onEdit, onDelete, loading }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading records...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-500">No records found.</div>;
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-900/50">
          <tr>
            {fields.map((f) => (
              <th key={f.key} className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {f.label}
              </th>
            ))}
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-800 divide-y divide-slate-700">
          {data.map((row, idx) => (
            <tr key={row._id || idx} className="hover:bg-slate-700/50 transition-colors">
              {fields.map((f) => {
                const isLatLng = f.key === 'latitude' || f.key === 'longitude';
                let cellClasses = 'px-6 py-4 text-sm text-slate-200 ';
                if (isLatLng) {
                  cellClasses += 'text-xs max-w-[100px] break-all whitespace-normal';
                } else if (f.key === 'remarks') {
                  cellClasses += 'min-w-[200px] max-w-[300px] break-words whitespace-normal';
                } else {
                  cellClasses += 'max-w-[150px] break-words whitespace-normal';
                }
                return (
                  <td key={f.key} className={cellClasses}>
                    {row[f.key] || <span className="text-slate-600">—</span>}
                  </td>
                );
              })}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(row)}
                  className="inline-flex items-center justify-center p-2 rounded-md bg-slate-700 text-slate-300 hover:text-cyan-400 hover:bg-slate-600 transition-colors mr-2"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(row._id)}
                  className="inline-flex items-center justify-center p-2 rounded-md bg-slate-700 text-slate-300 hover:text-rose-400 hover:bg-slate-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
