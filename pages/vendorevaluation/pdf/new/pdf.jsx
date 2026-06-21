import React from "react";

const VendorevaluationPDF = ({ filters }) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 dark:bg-app-surface dark:ring-slate-700">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-app-text">
          Vendor Evaluation PDF Preview
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-app-text-muted">
          This preview loads dynamically on the client. Replace this placeholder with your actual PDF rendering component when ready.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-app-surface">
          <p className="text-sm uppercase tracking-[0.18em] text-app-text-muted">From vendor code</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-app-text">
            {filters?.vendorCodeFrom ?? "N/A"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-app-surface">
          <p className="text-sm uppercase tracking-[0.18em] text-app-text-muted">To vendor code</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-app-text">
            {filters?.vendorCodeTo ?? "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700 dark:border-slate-700 dark:bg-app-bg dark:text-app-text-secondary">
        <p className="text-sm font-medium">PDF content will appear here after generation.</p>
        <p className="mt-3 text-sm leading-6">
          If you want to render a true PDF preview, replace this component with a PDF viewer or React PDF renderer that uses the given filter values.
        </p>
      </div>
    </div>
  );
};

export default VendorevaluationPDF;
