import React from 'react';

/**
 * Theme-aware collapsible section wrapper for PO schedule forms.
 */
export default function ScheduleSection({
  title,
  accentClass = 'bg-app-accent',
  isExpanded,
  onToggle,
  isLoading,
  children,
}) {
  return (
    <div className="bg-app-surface rounded-xl shadow-sm border border-app-border flex overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`${accentClass} text-white px-2.5 py-4 cursor-pointer transition-opacity hover:opacity-90 flex items-center shrink-0`}
        aria-expanded={isExpanded}
      >
        <div className="transform -rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
          <span className="text-sm font-bold tracking-wider uppercase">{title}</span>
        </div>
      </button>

      <div className="flex-1 min-w-0">
        <div
          onClick={onToggle}
          className="p-3 flex justify-end cursor-pointer hover:bg-app-surface-muted transition-colors"
        >
          <svg
            className={`w-5 h-5 text-app-text-muted transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export function ScheduleField({ field, value, onChange }) {
  const inputClass =
    'block w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-app-text text-sm shadow-sm focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent placeholder:text-app-text-disabled';

  return (
    <div
      className={`relative p-4 bg-app-surface-muted/60 rounded-xl border border-app-border hover:border-app-accent/40 transition-colors ${
        field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3 xl:col-span-4' : ''
      }`}
    >
      <label htmlFor={field.name} className="block text-xs font-semibold uppercase tracking-wide text-app-text-muted mb-2">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={onChange}
          rows={2}
          className={inputClass}
        />
      ) : (
        <input
          id={field.name}
          type={field.type}
          name={field.name}
          value={value || ''}
          onChange={onChange}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function ScheduleFormLayout({ fields, formData, onChange, onSubmit, saving }) {
  return (
    <form onSubmit={onSubmit} className="p-4 sm:p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {fields.map((field) => (
          <ScheduleField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="mt-6 border-t border-app-border pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-app-accent-text bg-app-accent hover:bg-app-accent-hover shadow-sm transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
