import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

export default function MasterFormModal({ isOpen, onClose, onSave, fields, initialData, globalData, title }) {
  const [formData, setFormData] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialData) {
      setFormData(initialData);
    } else {
      const init = {};
      fields.forEach(f => init[f.key] = "");
      setFormData(init);
    }
  }, [initialData, fields]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      // Auto-clear dependent child fields when parent value changes
      fields.forEach(f => {
        if (f.type === 'dynamic-select' && f.dependsOn === name) {
          next[f.key] = ''; 
        }
      });
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderDynamicSelect = (f) => {
    let options = [];
    if (f.key === 'townCity' && f.dependsOn === 'premisesKind') {
      const parentValue = formData[f.dependsOn];
      const cities = globalData?.locationcities || [];
      options = cities
        .filter(c => parentValue ? c.kind === parentValue : true)
        .map(c => ({ value: c.name, label: c.name }));
    } else if (f.key === 'category' && (f.dependsOn === 'fixed-asset-categories' || f.dependsOn === 'mme-categories')) {
      const cats = globalData?.[f.dependsOn] || [];
      options = cats.map(c => ({ value: c.name, label: c.name }));
    } else if (f.key === 'designation') {
      const desigs = globalData?.designations || [];
      options = desigs.map(d => ({ value: d.name, label: d.name }));
    } else if (f.key === 'department') {
      const depts = globalData?.departments || [];
      options = depts.map(d => ({ value: d.name, label: d.name }));
    } else if (f.key === 'grade') {
      const grades = globalData?.['employee-grades'] || [];
      options = grades.map(g => ({ value: g.grade, label: g.grade }));
    } else if (f.key === 'salaryLevel') {
      const levels = globalData?.['employee-salary-levels'] || [];
      options = levels.map(l => ({ value: l.level, label: l.level }));
    }

    return (
      <select
        name={f.key}
        value={formData[f.key] || ""}
        onChange={handleChange}
        required={f.required}
        disabled={f.dependsOn === 'premisesKind' && !formData.premisesKind}
        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select {f.label}</option>
        {options.map((opt, i) => (
          <option key={`${opt.value}-${i}`} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity p-4 sm:p-6 mt-16 sm:mt-0">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl mx-auto flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-xl shrink-0">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="px-6 py-5 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fields.map(f => (
                <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    name={f.key}
                    value={formData[f.key] || ""}
                    onChange={handleChange}
                    required={f.required}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 sm:text-sm placeholder-slate-500"
                    rows="3"
                  />
                ) : f.type === "select" ? (
                  <select
                    name={f.key}
                    value={formData[f.key] || ""}
                    onChange={handleChange}
                    required={f.required}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 sm:text-sm"
                  >
                    <option value="">Select {f.label}</option>
                    {f.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : f.type === "dynamic-select" ? (
                  renderDynamicSelect(f)
                ) : (
                  <input
                    type="text"
                    name={f.key}
                    value={formData[f.key] || ""}
                    onChange={handleChange}
                    required={f.required}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 sm:text-sm placeholder-slate-500"
                  />
                )}
              </div>
            ))}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/80 rounded-b-xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-slate-950 bg-cyan-500 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 20px;
        }
      `}</style>
    </div>,
    document.body
  );
}
