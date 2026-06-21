import React from "react";
import { Edit2, Inbox, Plus, Trash2 } from "lucide-react";
import { useAppTheme } from "../../lib/useAppTheme";

const STATUS_BADGES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-app-text-muted border-slate-200",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-200",
};

function StatusBadge({ value, theme }) {
  if (!value) return <span className={theme === "light" ? "text-app-text-muted" : "text-slate-600"}>—</span>;
  if (theme === "light") {
    const cls = STATUS_BADGES[value] || "bg-slate-100 text-slate-600 border-slate-200";
    return (
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
        {value}
      </span>
    );
  }
  return value;
}

function renderCellValue(f, value, theme) {
  if (value === undefined || value === null || value === "") {
    return <span className={theme === "light" ? "text-app-text-secondary" : "text-slate-600"}>—</span>;
  }
  if (f.key === "status") return <StatusBadge value={value} theme={theme} />;
  if (f.key === "email" && theme === "light") {
    return (
      <a href={`mailto:${value}`} className="text-sky-500 hover:underline">
        {value}
      </a>
    );
  }
  if (f.key === "empno" && theme === "light") {
    return <span className="font-medium text-slate-900 font-mono text-[13px]">{value}</span>;
  }
  return value;
}

export default function MasterTable({
  data,
  fields,
  onEdit,
  onDelete,
  loading,
  theme,
  totalCount,
  onAdd,
  tabLabel = "record",
}) {
  const resolvedTheme = useAppTheme();
  const activeTheme = theme || resolvedTheme;
  const isLight = activeTheme === "light";
  const shown = data?.length ?? 0;
  const total = totalCount ?? shown;

  if (loading) {
    return (
      <div className={`py-16 text-center text-sm ${isLight ? "text-app-text-muted" : "text-app-text-muted"}`}>
        Loading records…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex min-h-[200px] flex-col items-center justify-center px-6 py-12 text-center ${isLight ? "" : ""}`}>
        <Inbox className={`mb-3 h-12 w-12 ${isLight ? "text-app-text-secondary" : "text-slate-600"}`} aria-hidden />
        <p className={`text-base ${isLight ? "text-app-text-muted" : "text-app-text-muted"}`}>No records found.</p>
        <p className={`mt-1 text-sm ${isLight ? "text-app-text-secondary" : "text-slate-600"}`}>
          Get started by adding your first {tabLabel.toLowerCase()} record.
        </p>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-app-text transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Record
          </button>
        )}
      </div>
    );
  }

  const theadClass = isLight
    ? "bg-slate-50 border-b border-slate-200"
    : "bg-app-surface-muted";
  const thClass = isLight
    ? "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600"
    : "px-6 py-4 text-left text-xs font-semibold text-app-text-secondary uppercase tracking-wider";
  const tbodyClass = isLight ? "bg-white divide-y divide-slate-100" : "bg-app-surface divide-y divide-app-border";
  const rowClass = isLight
    ? "hover:bg-slate-50 transition-colors"
    : "hover:bg-app-surface-muted/50 transition-colors";
  const tdClass = isLight
    ? "px-4 py-3.5 text-sm text-slate-700"
    : "px-6 py-4 text-sm text-app-text";
  const editBtnClass = isLight
    ? "inline-flex items-center justify-center p-2 rounded-md text-app-text-muted hover:text-sky-500 hover:bg-sky-50 transition-colors"
    : "inline-flex items-center justify-center p-2 rounded-md bg-slate-700 text-app-text-secondary hover:text-app-accent hover:bg-slate-600 transition-colors mr-2";
  const deleteBtnClass = isLight
    ? "inline-flex items-center justify-center p-2 rounded-md text-app-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
    : "inline-flex items-center justify-center p-2 rounded-md bg-slate-700 text-app-text-secondary hover:text-rose-400 hover:bg-slate-600 transition-colors";

  return (
    <div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className={`min-w-full ${isLight ? "divide-y divide-slate-100" : "divide-y divide-app-border"}`}>
          <thead className={theadClass}>
            <tr>
              {fields.map((f) => (
                <th key={f.key} className={thClass}>
                  {f.label}
                </th>
              ))}
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {data.map((row, idx) => (
              <tr key={row._id || idx} className={rowClass}>
                {fields.map((f) => {
                  const isLatLng = f.key === "latitude" || f.key === "longitude";
                  let cellClasses = tdClass;
                  if (isLatLng) {
                    cellClasses += " text-xs max-w-[100px] break-all whitespace-normal";
                  } else if (f.key === "remarks") {
                    cellClasses += " min-w-[200px] max-w-[300px] break-words whitespace-normal";
                  } else if (f.key === "empname") {
                    cellClasses += isLight ? " font-medium text-slate-900" : "";
                  } else {
                    cellClasses += " max-w-[180px] break-words whitespace-normal";
                  }
                  return (
                    <td key={f.key} className={cellClasses}>
                      {renderCellValue(f, row[f.key], theme)}
                    </td>
                  );
                })}
                <td className={`${tdClass} whitespace-nowrap text-right`}>
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className={`${editBtnClass} mr-1`}
                    title="Edit"
                    aria-label="Edit record"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row._id)}
                    className={deleteBtnClass}
                    title="Delete"
                    aria-label="Delete record"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLight && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm text-app-text-muted">
            Showing {shown.toLocaleString()} of {total.toLocaleString()} records
          </span>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${isLight ? "#CBD5E1" : "#334155"};
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
