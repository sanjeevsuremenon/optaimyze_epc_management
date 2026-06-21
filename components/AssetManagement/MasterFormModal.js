import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Check, X } from "lucide-react";
import { useAppTheme } from "../../lib/useAppTheme";

const STATUS_DOT = {
  Active: "bg-emerald-500",
  Inactive: "bg-slate-400",
  "On Leave": "bg-amber-500",
};

function validateField(f, value) {
  if (f.required && (!value || String(value).trim() === "")) {
    return `${f.label} is required`;
  }
  if (f.key === "email" && value && !/\S+@\S+\.\S+/.test(String(value))) {
    return "Please enter a valid email address";
  }
  return null;
}

export default function MasterFormModal({
  isOpen,
  onClose,
  onSave,
  fields,
  initialData,
  globalData,
  title,
  theme,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialSnapshot = useRef("");
  const resolvedTheme = useAppTheme();
  const activeTheme = theme || resolvedTheme;
  const isLight = activeTheme === "light";
  const isEdit = Boolean(initialData);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      initialSnapshot.current = JSON.stringify(initialData);
    } else {
      const init = {};
      fields.forEach((f) => {
        init[f.key] = "";
      });
      setFormData(init);
      initialSnapshot.current = JSON.stringify(init);
    }
    setErrors({});
  }, [initialData, fields, isOpen]);

  if (!isOpen || !mounted) return null;

  const isDirty = JSON.stringify(formData) !== initialSnapshot.current;

  const handleClose = () => {
    if (isDirty && !confirm("You have unsaved changes. Are you sure you want to close?")) {
      return;
    }
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      fields.forEach((f) => {
        if (f.type === "dynamic-select" && f.dependsOn === name) {
          next[f.key] = "";
        }
      });
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const field = fields.find((f) => f.key === name);
    if (!field) return;
    const err = validateField(field, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  };

  const validateAll = () => {
    const next = {};
    fields.forEach((f) => {
      const err = validateField(f, formData[f.key]);
      if (err) next[f.key] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = isLight
    ? "w-full h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder-app-text-disabled transition focus:border-sky-500 focus:outline-none focus:ring-[3px] focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
    : "w-full bg-app-surface border border-app-border text-app-text rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed placeholder-app-text-disabled";

  const inputErrorClass = isLight
    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
    : "border-rose-500 focus:ring-rose-500/50";

  const labelClass = isLight
    ? "block text-sm font-medium text-gray-700 mb-2"
    : "block text-sm font-medium text-app-text-secondary mb-1.5";

  const renderDynamicSelect = (f) => {
    let options = [];
    if (f.key === "townCity" && f.dependsOn === "premisesKind") {
      const parentValue = formData[f.dependsOn];
      const cities = globalData?.locationcities || [];
      options = cities
        .filter((c) => (parentValue ? c.kind === parentValue : true))
        .map((c) => ({ value: c.name, label: c.name }));
    } else if (
      f.key === "category" &&
      (f.dependsOn === "fixed-asset-categories" || f.dependsOn === "mme-categories")
    ) {
      const cats = globalData?.[f.dependsOn] || [];
      options = cats.map((c) => ({ value: c.name, label: c.name }));
    } else if (f.key === "designation") {
      options = (globalData?.designations || []).map((d) => ({ value: d.name, label: d.name }));
    } else if (f.key === "department") {
      options = (globalData?.departments || []).map((d) => ({ value: d.name, label: d.name }));
    } else if (f.key === "grade") {
      options = (globalData?.["employee-grades"] || []).map((g) => ({ value: g.grade, label: g.grade }));
    } else if (f.key === "salaryLevel") {
      options = (globalData?.["employee-salary-levels"] || []).map((l) => ({
        value: l.level,
        label: l.level,
      }));
    }

    return (
      <select
        name={f.key}
        value={formData[f.key] || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        required={f.required}
        disabled={f.dependsOn === "premisesKind" && !formData.premisesKind}
        className={`${inputClass} ${errors[f.key] ? inputErrorClass : ""}`}
      >
        <option value="">Select {f.label}</option>
        {options.map((opt, i) => (
          <option key={`${opt.value}-${i}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };

  const renderStatusSelect = (f) => (
    <select
      name={f.key}
      value={formData[f.key] || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      required={f.required}
      className={`${inputClass} ${errors[f.key] ? inputErrorClass : ""}`}
    >
      <option value="">Select Status</option>
      {f.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const backdropClass = isLight
    ? "fixed inset-0 z-[9999] flex items-center justify-center bg-app-surface-muted backdrop-blur-sm p-4"
    : "fixed inset-0 z-[9999] flex items-center justify-center bg-app-surface-muted backdrop-blur-sm transition-opacity p-4 sm:p-6 mt-16 sm:mt-0";

  const modalClass = isLight
    ? "flex w-full max-w-[640px] max-h-[85vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
    : "app-card rounded-xl shadow-2xl w-full max-w-3xl mx-auto flex flex-col max-h-[95vh]";

  const headerClass = isLight
    ? "flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5"
    : "px-6 py-4 border-b border-app-border flex justify-between items-center bg-app-surface-muted rounded-t-xl shrink-0";

  const footerClass = isLight
    ? "flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4"
    : "px-6 py-4 border-t border-app-border flex justify-end gap-3 bg-app-surface/80 rounded-b-xl shrink-0";

  return ReactDOM.createPortal(
    <div
      className={backdropClass}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-form-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={headerClass}>
          <h3
            id="master-form-modal-title"
            className={isLight ? "text-xl font-semibold text-slate-900" : "text-lg font-semibold text-app-text"}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className={
              isLight
                ? "flex h-8 w-8 items-center justify-center rounded-full text-app-text-muted transition hover:bg-slate-100 hover:text-slate-600"
                : "p-1 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-muted transition-colors"
            }
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={`overflow-y-auto custom-scrollbar ${isLight ? "px-6 py-6" : "px-6 py-5"}`}>
            <div className={`grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 ${isLight ? "" : "gap-5"}`}>
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className={labelClass} htmlFor={`field-${f.key}`}>
                    {f.label}
                    {f.required && <span className="ml-0.5 text-red-500">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={`field-${f.key}`}
                      name={f.key}
                      value={formData[f.key] || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required={f.required}
                      rows={3}
                      className={`${inputClass} h-auto py-2.5 ${errors[f.key] ? inputErrorClass : ""}`}
                    />
                  ) : f.type === "select" && f.key === "status" && isLight ? (
                    <>
                      {renderStatusSelect(f)}
                      {formData[f.key] && STATUS_DOT[formData[f.key]] && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-app-text-muted">
                          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[formData[f.key]]}`} />
                          {formData[f.key]}
                        </div>
                      )}
                    </>
                  ) : f.type === "select" ? (
                    <select
                      id={`field-${f.key}`}
                      name={f.key}
                      value={formData[f.key] || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required={f.required}
                      className={`${inputClass} ${errors[f.key] ? inputErrorClass : ""}`}
                    >
                      <option value="">Select {f.label}</option>
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "dynamic-select" ? (
                    renderDynamicSelect(f)
                  ) : (
                    <input
                      id={`field-${f.key}`}
                      type={f.key === "email" ? "email" : "text"}
                      name={f.key}
                      value={formData[f.key] || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required={f.required}
                      placeholder={
                        f.key === "empname"
                          ? "Enter full name"
                          : f.key === "email"
                            ? "Enter email address"
                            : undefined
                      }
                      className={`${inputClass} ${errors[f.key] ? inputErrorClass : ""}`}
                      aria-invalid={Boolean(errors[f.key])}
                      aria-describedby={errors[f.key] ? `${f.key}-error` : undefined}
                    />
                  )}
                  {errors[f.key] && (
                    <p id={`${f.key}-error`} className="mt-1.5 text-xs text-red-500" role="alert">
                      {errors[f.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={footerClass}>
            <button
              type="button"
              onClick={handleClose}
              className={
                isLight
                  ? "rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  : "px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-app-text-secondary hover:bg-app-surface-muted hover:text-app-text transition-colors"
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={
                isLight
                  ? "inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-app-text transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
                  : "px-4 py-2 border border-transparent rounded-md text-sm font-medium text-slate-950 bg-app-accent hover:bg-app-accent-hover transition-colors shadow-lg shadow-cyan-500/20"
              }
            >
              {isLight && <Check className="h-4 w-4" aria-hidden />}
              {saving ? "Saving…" : isEdit ? "Update Record" : "Save Record"}
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
          background-color: ${isLight ? "#CBD5E1" : "#475569"};
          border-radius: 20px;
        }
      `}</style>
    </div>,
    document.body
  );
}
