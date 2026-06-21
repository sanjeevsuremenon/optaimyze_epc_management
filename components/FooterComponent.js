import React from "react";

function FooterComponent({ id }) {
  return (
    <footer className="border-t border-app-border bg-app-surface text-app-text-muted" id={id}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-app-accent">
            Optaimyze Portal
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-app-text">
            Project, vendor and material management made simple.
          </h2>
          <p className="mt-4 text-sm leading-6 text-app-text-muted">
            A central portal for EPC teams that works with existing ERP systems, vendor workflows, and
            structured data sources.
          </p>
        </div>

        <div className="grid gap-8 text-sm text-app-text-muted sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-app-accent">About</p>
            <p className="mt-3 leading-6">
              This portal helps project and procurement teams access vendor, material, and PO dashboards
              from a single secure location.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-app-accent">Legal</p>
            <p className="mt-3 text-[13px] leading-6">
              Use requires registration. Data may be delayed by up to one day and should be validated
              against live ERP systems for final decisions.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-app-border px-6 py-4 text-xs text-app-text-disabled sm:px-8">
        © {new Date().getFullYear()} OPTAIMYZE. All rights reserved.
      </div>
    </footer>
  );
}

export default FooterComponent;
