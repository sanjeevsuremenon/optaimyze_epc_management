import React, { useState, useEffect, useRef, useCallback } from 'react';
import useDebounce from '../../lib/useDebounce';
import styles from './Vendors.module.css';
import Link from 'next/link';
import VendorGroupMapping from '../../components/VendorGroupMapping';

const PAGE_LIMIT = 100;

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        qs.set('search', debouncedSearchTerm);
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
        if (!res.ok) throw new Error('Failed to load vendors');
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
      if (!res.ok) throw new Error('Failed to load more');
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
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const internalId = (vendor) =>
    vendor.internalVendorCode || (vendor._id && String(vendor._id)) || '';

  return (
    <div className={styles.container}>
      <div className="mb-3">
      </div>
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
          'Loading…'
        ) : (
          <>
            Showing {vendors.length} of {total} non-SAP vendor{total === 1 ? '' : 's'}
            {debouncedSearchTerm.length >= 4 ? ` matching “${debouncedSearchTerm}”` : ''}
          </>
        )}
      </p>

      <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Internal ID</th>
            <th>Vendor Name</th>
            <th>Country Code</th>
            <th>City</th>
            <th>Address</th>
            <th>Contact</th>
            <th>Company Registration Number</th>
            <th>Company Email</th>
            <th>SAP vendor code</th>
            <th>Company Website</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor._id} className="border-b border-gray-200 text-sm">
              <td className={styles.monoId} title={internalId(vendor)}>
                {internalId(vendor)}
              </td>
              <td className="font-bold italic text-sky-800">{vendor.vendorname}</td>
              <td className="text-teal-800">{vendor.address?.countrycode}</td>
              <td className="text-teal-800">{vendor.address?.city}</td>
              <td>
                <span className="block font-bold text-red-800">Add1: {vendor.address?.address1} </span>
                {vendor.address?.address2}
                <br />
                {vendor.address?.pobox}
                <br />
                {vendor.address?.zipcode}
              </td>
              <td>
                <span className="block">Tel1: {vendor.contact?.telephone1}</span>
                <span className="block">Tel2: {vendor.contact?.telephone2}</span>
                <span className="block text-red-800 font-semibold">Sales Name: {vendor.contact?.salesname}</span>
                <span className="block text-emerald-800">Sales Email: {vendor.contact?.salesemail}</span>
                <span className="block text-blue-800">Sales Mobile: {vendor.contact?.salesmobile}</span>
                <span className="block">Fax: {vendor.contact?.fax}</span>
              </td>
              <td>{vendor.companyregistrationnumber}</td>
              <td>{vendor.companyemail}</td>
              <td>{vendor.vendorcode || '—'}</td>
              <td>{vendor.companywebsite}</td>
              <td className={styles.actionCell}>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-hidden />
      {loadingMore && <p className={styles.loadMoreHint}>Loading more…</p>}
      {!hasMore && vendors.length > 0 && !loading && (
        <p className={styles.loadMoreHint}>All vendors loaded.</p>
      )}

      {mappingVendor && (
        <div className={styles.mapModalOverlay} role="presentation" onClick={() => setMappingVendor(null)}>
          <div
            className={styles.mapModalContent}
            role="dialog"
            aria-labelledby="map-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mapModalHeader}>
              <h2 id="map-modal-title" className="text-lg font-semibold text-gray-900">
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
              Internal ID: <code>{internalId(mappingVendor)}</code> — same mapping model as{' '}
              <Link href="/vendors/group-mapping" className="text-blue-600 underline">
                Vendor Mapping
              </Link>{' '}
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
