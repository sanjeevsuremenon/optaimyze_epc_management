import React, { useState, useEffect, useRef, useCallback } from "react";
import useDebounce from "../../lib/useDebounce";
import Link from "next/link";
import Head from "next/head";
import { Users, Plus, Search, Edit3, Layers, Building2, MapPin, Phone, Mail, Globe, ExternalLink, X } from "lucide-react";
import VendorGroupMapping from "../../components/VendorGroupMapping";
import GlassSubPageHero from "../../components/GlassSubPageHero";
import { GlassStyles, Tilt } from "../../components/landing/glass";

const PAGE_LIMIT = 100;

export default function NonSapVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const [mappingVendor, setMappingVendor] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const loadMoreRef = useRef(null);

  const buildQuery = useCallback(
    (skip) => {
      const qs = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        skip: String(skip),
      });
      if (debouncedSearchTerm.length >= 4) {
        qs.set("search", debouncedSearchTerm);
      }
      return qs;
    },
    [debouncedSearchTerm]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nonsapvendors?${buildQuery(0)}`);
        if (!res.ok) throw new Error("Failed to load vendors");
        const data = await res.json();
        if (cancelled) return;
        setVendors(data.vendors || []);
        setHasMore(Boolean(data.hasMore));
        setTotal(data.total ?? 0);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setVendors([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, shouldFetch, buildQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/nonsapvendors?${buildQuery(vendors.length)}`);
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      setVendors((prev) => [...prev, ...(data.vendors || [])]);
      setHasMore(Boolean(data.hasMore));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, buildQuery, vendors.length]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const internalId = (vendor) =>
    vendor.internalVendorCode || (vendor._id && String(vendor._id)) || "";

  const displayValue = (value) =>
    value === undefined || value === null || String(value).trim() === ""
      ? "—"
      : String(value);

  return (
    <div className="app-page min-h-screen flex-1 flex flex-col font-sans">
      <GlassStyles />
      <Head>
        <title>Non-SAP Vendors Directory | OPTAIMYZE</title>
      </Head>

      <main className="w-full max-w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Glass Subpage Hero */}
          <GlassSubPageHero
            icon={Building2}
            eyebrow="SUPPLIER DIRECTORY"
            title="Non-SAP Vendors Directory"
            description="Manage non-SAP and direct suppliers, custom profiles, and material/service group classifications."
            accent="violet"
            moduleKey="vendors"
          >
            <Link
              href="/vendors/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20"
            >
              <Plus size={15} /> Add New Vendor
            </Link>
          </GlassSubPageHero>

          {/* Search & Meta Toolbar */}
          <Tilt glow="violet" className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search vendors by name or code (min 4 characters)…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-border text-app-text text-xs rounded-xl focus:outline-none focus:border-violet-500 transition-colors placeholder-app-text-disabled"
                />
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
              </div>
              <div className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider bg-app-bg px-3.5 py-2 rounded-xl border border-app-border shrink-0 self-start sm:self-auto">
                {loading ? (
                  "Loading…"
                ) : (
                  <>
                    Showing {vendors.length} of {total} non-SAP vendor{total === 1 ? "" : "s"}
                    {debouncedSearchTerm.length >= 4 ? ` matching “${debouncedSearchTerm}”` : ""}
                  </>
                )}
              </div>
            </div>
          </Tilt>

          {/* Bento Grid of Vendor Cards */}
          {loading && vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500 mb-4" />
              <span className="text-app-text-muted font-medium text-xs">Loading supplier profiles...</span>
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl shadow-sm text-center">
              <Building2 size={40} className="text-app-text-muted mb-3 opacity-40" />
              <h3 className="text-base font-bold text-app-text mb-1">No Non-SAP Vendors Found</h3>
              <p className="text-xs text-app-text-muted max-w-sm">
                {searchTerm ? `No suppliers match "${searchTerm}". Try a different keyword.` : "Click 'Add New Vendor' to create your first supplier profile."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vendors.map((vendor) => (
                <Tilt
                  key={vendor._id}
                  glow="violet"
                  className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-app-border/60 pb-3 mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-app-text leading-snug">
                          {displayValue(vendor.vendorname)}
                        </h3>
                        <p className="text-[10px] font-mono font-semibold text-app-accent mt-0.5" title={internalId(vendor)}>
                          ID: {internalId(vendor)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/vendors/edit/${encodeURIComponent(String(vendor._id))}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-app-bg hover:bg-violet-600 hover:text-white text-app-text-secondary text-[11px] font-bold border border-app-border hover:border-violet-500 transition-all"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Edit3 size={11} /> Edit
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[11px] font-bold border border-violet-500/25 transition-all"
                          onClick={() => setMappingVendor(vendor)}
                        >
                          <Layers size={11} /> Map Groups
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-app-bg/60 p-3 rounded-xl border border-app-border/50 text-xs mb-4">
                      <div>
                        <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider mb-0.5">Vendor Code</p>
                        <p className="font-mono font-bold text-app-text text-[11px] truncate">{displayValue(vendor.vendorcode)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider mb-0.5">Company Reg. #</p>
                        <p className="font-mono font-medium text-app-text text-[11px] truncate">{displayValue(vendor.companyregistrationnumber)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider mb-0.5">Company Email</p>
                        <p className="text-app-text text-[11px] truncate" title={vendor.companyemail}>{displayValue(vendor.companyemail)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider mb-0.5">Website</p>
                        <p className="text-app-text text-[11px] truncate" title={vendor.companywebsite}>{displayValue(vendor.companywebsite)}</p>
                      </div>
                    </div>

                    {/* Address & Contact sections */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Address Card */}
                      <div className="p-3 bg-app-surface-muted/50 rounded-xl border border-app-border/60">
                        <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <MapPin size={11} className="text-violet-500" /> Address
                        </p>
                        <div className="space-y-1 text-[11px] text-app-text-secondary">
                          <p><span className="text-app-text-muted">City/Country:</span> {displayValue(vendor.address?.city)}, {displayValue(vendor.address?.countrycode)}</p>
                          <p className="truncate"><span className="text-app-text-muted">Line:</span> {displayValue(vendor.address?.address1)}</p>
                          <p><span className="text-app-text-muted">PO / ZIP:</span> {displayValue(vendor.address?.pobox)} / {displayValue(vendor.address?.zipcode)}</p>
                        </div>
                      </div>

                      {/* Contact Card */}
                      <div className="p-3 bg-app-surface-muted/50 rounded-xl border border-app-border/60">
                        <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Phone size={11} className="text-violet-500" /> Contact Details
                        </p>
                        <div className="space-y-1 text-[11px] text-app-text-secondary">
                          <p><span className="text-app-text-muted">Sales:</span> {displayValue(vendor.contact?.salesname)}</p>
                          <p className="truncate"><span className="text-app-text-muted">Email:</span> {displayValue(vendor.contact?.salesemail)}</p>
                          <p><span className="text-app-text-muted">Tel / Mob:</span> {displayValue(vendor.contact?.telephone1 || vendor.contact?.salesmobile)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tilt>
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={loadMoreRef} className="h-4" aria-hidden />
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500" />
              <span className="ml-3 text-xs text-app-text-muted font-medium">Loading more vendors…</span>
            </div>
          )}
          {!hasMore && vendors.length > 0 && !loading && (
            <p className="text-center text-xs text-app-text-muted py-4 font-semibold">All {total} non-SAP vendors loaded.</p>
          )}

          {/* Group Mapping Liquid Glass Modal */}
          {mappingVendor && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
              role="presentation"
              onClick={() => setMappingVendor(null)}
            >
              <div
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-app-surface border border-app-border rounded-2xl shadow-2xl p-6 relative animate-scaleUp"
                role="dialog"
                aria-labelledby="map-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h2 id="map-modal-title" className="text-base font-bold text-app-text">
                        Material & Service Group Mapping
                      </h2>
                      <p className="text-xs text-app-text-muted">{mappingVendor.vendorname}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-app-text-muted hover:text-app-text hover:bg-app-surface-muted transition-colors"
                    onClick={() => setMappingVendor(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-app-bg/60 p-3 rounded-xl border border-app-border text-xs mb-4">
                  <p className="text-app-text-muted">
                    Internal ID: <code className="font-bold text-violet-500">{internalId(mappingVendor)}</code> — Custom group mapping model stored by non-SAP vendor identifier.
                  </p>
                </div>

                <VendorGroupMapping
                  nonsapVendorId={internalId(mappingVendor)}
                  vendorName={mappingVendor.vendorname}
                  vendorCode=""
                  onSaveSuccess={() => setMappingVendor(null)}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
