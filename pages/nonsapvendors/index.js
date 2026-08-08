import React, { useState, useEffect, useRef, useCallback } from "react";
import useDebounce from "../../lib/useDebounce";
import styles from "../vendors/Vendors.module.css";
import Link from "next/link";
import VendorGroupMapping from "../../components/VendorGroupMapping";

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
    <div className={`${styles.container} bg-app-bg text-app-text`}>
      <div className="mb-3" />
      <div className={styles.headerSection}>
        <input
          type="text"
          placeholder="Search vendors (optional, min 4 characters)…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <Link
          href="/vendors/new"
          className={styles.addNewButton}
          target="_blank"
          rel="noopener noreferrer"
          title="Add vendor (opens in new tab)"
        >
          +
        </Link>
      </div>

      <p className={styles.listMeta}>
        {loading ? (
          "Loading…"
        ) : (
          <>
            Showing {vendors.length} of {total} non-SAP vendor
            {total === 1 ? "" : "s"}
            {debouncedSearchTerm.length >= 4
              ? ` matching “${debouncedSearchTerm}”`
              : ""}
          </>
        )}
      </p>

      <div className={styles.cardGrid}>
        {vendors.map((vendor) => (
          <article key={vendor._id} className={styles.vendorCard}>
            <div className={styles.vendorCardHeader}>
              <div>
                <h3 className={styles.vendorNameCell}>
                  {displayValue(vendor.vendorname)}
                </h3>
                <p className={styles.vendorBadge} title={internalId(vendor)}>
                  ID: {internalId(vendor)}
                </p>
              </div>

              <div className={styles.vendorCardActions}>
                <Link
                  href={`/vendors/edit/${encodeURIComponent(String(vendor._id))}`}
                  className={styles.editLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className={styles.mapButton}
                  onClick={() => setMappingVendor(vendor)}
                >
                  Map groups
                </button>
              </div>
            </div>

            <div className={styles.vendorCardMeta}>
              <div>
                <p className={styles.fieldLabel}>Vendor Code</p>
                <p>{displayValue(vendor.vendorcode)}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>Company Reg. #</p>
                <p>{displayValue(vendor.companyregistrationnumber)}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>Company Email</p>
                <p>{displayValue(vendor.companyemail)}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>Website</p>
                <p>{displayValue(vendor.companywebsite)}</p>
              </div>
            </div>

            <div className={styles.vendorCardSection}>
              <p className={styles.sectionTitle}>Address</p>
              <div className={styles.vendorCardGrid}>
                <div>
                  <p className={styles.fieldLabel}>Country Code</p>
                  <p>{displayValue(vendor.address?.countrycode)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>City</p>
                  <p>{displayValue(vendor.address?.city)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Address 1</p>
                  <p>{displayValue(vendor.address?.address1)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Address 2</p>
                  <p>{displayValue(vendor.address?.address2)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>PO Box</p>
                  <p>{displayValue(vendor.address?.pobox)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>ZIP Code</p>
                  <p>{displayValue(vendor.address?.zipcode)}</p>
                </div>
              </div>
            </div>

            <div className={styles.vendorCardSection}>
              <p className={styles.sectionTitle}>Contact</p>
              <div className={styles.vendorCardGrid}>
                <div>
                  <p className={styles.fieldLabel}>Telephone 1</p>
                  <p>{displayValue(vendor.contact?.telephone1)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Telephone 2</p>
                  <p>{displayValue(vendor.contact?.telephone2)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Sales Name</p>
                  <p>{displayValue(vendor.contact?.salesname)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Sales Email</p>
                  <p>{displayValue(vendor.contact?.salesemail)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Sales Mobile</p>
                  <p>{displayValue(vendor.contact?.salesmobile)}</p>
                </div>
                <div>
                  <p className={styles.fieldLabel}>Fax</p>
                  <p>{displayValue(vendor.contact?.fax)}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-hidden />
      {loadingMore && <p className={styles.loadMoreHint}>Loading more…</p>}
      {!hasMore && vendors.length > 0 && !loading && (
        <p className={styles.loadMoreHint}>All vendors loaded.</p>
      )}

      {mappingVendor && (
        <div
          className={styles.mapModalOverlay}
          role="presentation"
          onClick={() => setMappingVendor(null)}
        >
          <div
            className={styles.mapModalContent}
            role="dialog"
            aria-labelledby="map-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mapModalHeader}>
              <h2 id="map-modal-title" className="text-lg font-semibold text-app-text">
                Material / service groups — {mappingVendor.vendorname}
              </h2>
              <button
                type="button"
                className={styles.mapModalClose}
                onClick={() => setMappingVendor(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className={styles.mapModalSub}>
              Internal ID: <code>{internalId(mappingVendor)}</code> — same mapping
              model as{" "}
              <Link href="/vendors/group-mapping" className="text-app-accent underline">
                Vendor Mapping
              </Link>{" "}
              (SAP vendors), but stored by non-SAP internal ID.
            </p>
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
  );
}
