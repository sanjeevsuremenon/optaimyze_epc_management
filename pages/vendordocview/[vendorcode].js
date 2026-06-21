import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiX, FiFolder, FiUploadCloud } from 'react-icons/fi';
import VendorDocumentViewer from '../../components/Vendor/VendorDocumentViewer';
import VendorDocumentUpload from '../../components/Vendor/VendorDocumentUpload';

export default function VendorDocViewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { vendorcode } = router.query;
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewTab, setIsNewTab] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  useEffect(() => {
    if (window.opener) {
      setIsNewTab(true);
    }
  }, []);

  useEffect(() => {
    if (vendorcode) {
      fetchVendorInfo();
    }
  }, [vendorcode]);

  const fetchVendorInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendors/overview/${encodeURIComponent(vendorcode)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vendor information');
      }
      
      const vendor = await response.json();
      
      if (!vendor) {
        // Fallback for vendors without an overview
        setVendorInfo({
          vendorname: 'Vendor ' + vendorcode,
          vendorcode: vendorcode
        });
      } else {
        setVendorInfo({
          vendorname: vendor['vendor-name'] || vendor.vendorname || vendor.vendorName || 'Unknown Vendor',
          vendorcode: vendor['vendor-code'] || vendor.vendorcode || vendor.vendorCode || vendorcode
        });
      }
      
    } catch (err) {
      console.error('Error fetching vendor info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="app-page min-h-screen flex flex-col font-sans">
        <Head><title>Access Denied</title></Head>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-rose-500 mb-4">Access Denied</h1>
          <p className="text-app-text-muted mb-8">Please sign in to access this page.</p>
          <Link href="/auth/signin" className="px-6 py-2 bg-app-accent hover:bg-app-accent text-white rounded-lg transition-colors font-medium">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-page min-h-screen flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent"></div>
          <span className="ml-4 text-app-text-secondary font-medium">Loading vendor documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page min-h-screen flex flex-col font-sans">
        <Head><title>Error</title></Head>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-rose-400 mb-4">Error Loading Vendor</h1>
            <p className="text-app-text-secondary mb-8">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => isNewTab ? window.close() : router.back()}
                className="px-4 py-2 bg-app-surface hover:bg-app-surface-muted text-app-text-secondary rounded-lg transition-colors border border-app-border"
              >
                {isNewTab ? 'Close Tab' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen flex flex-col font-sans">
      <Head>
        <title>{vendorInfo.vendorname} - Documents | MM Portal</title>
      </Head>
      
      <main className="w-full max-w-full px-4 py-8">
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-app-text flex items-center gap-3">
                <button 
                  onClick={() => isNewTab ? window.close() : router.back()}
                  className="p-2 hover:bg-app-surface rounded-lg transition-colors text-app-text-muted hover:text-app-text"
                  title={isNewTab ? "Close Tab" : "Go Back"}
                >
                  {isNewTab ? <FiX size={24} /> : <FiArrowLeft size={24} />}
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <FiFolder className="text-emerald-400 text-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-emerald-400 tracking-wider uppercase">Vendor Documents</span>
                    <span className="text-app-text">{vendorInfo.vendorname}</span>
                  </div>
                </div>
              </h1>

              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-emerald-900/20"
              >
                <FiUploadCloud className="mr-2" /> Upload Documents
              </button>
            </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-xl">
            <VendorDocumentViewer
              vendorCode={vendorcode}
              refreshTrigger={refreshTrigger}
            />
          </div>
          
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in-up">
          <div className="bg-app-surface border border-app-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-app-border">
              <div>
                <h2 className="text-xl font-bold text-app-text flex items-center gap-2">
                  <FiUploadCloud className="text-emerald-400" />
                  Upload Documents
                </h2>
                <p className="text-app-text-muted text-sm mt-1">
                  Upload files for {vendorInfo.vendorname} ({vendorcode})
                </p>
              </div>
              <button
                type="button"
                className="p-2 text-app-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                onClick={() => setShowUploadModal(false)}
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto upload-modal-container bg-app-surface">
              <style jsx global>{`
                /* Restyle the VendorDocumentUpload specifically for this dark modal without modifying the original component */
                .upload-modal-container form label {
                  color: #94a3b8 !important; /* slate-400 */
                }
                .upload-modal-container form select,
                .upload-modal-container form textarea,
                .upload-modal-container form input[type="file"] {
                  background-color: #0f172a !important; /* slate-900 */
                  border-color: #334155 !important; /* slate-700 */
                  color: #f1f5f9 !important; /* slate-100 */
                }
                .upload-modal-container form p {
                  color: #64748b !important; /* slate-500 */
                }
                .upload-modal-container .bg-blue-50 {
                  background-color: #022c22 !important; /* emerald-950 */
                }
                .upload-modal-container .text-blue-900,
                .upload-modal-container .text-blue-800 {
                  color: #34d399 !important; /* emerald-400 */
                }
                .upload-modal-container button[type="submit"] {
                  background-color: #059669 !important; /* emerald-600 */
                  border: 1px solid #065f46 !important;
                }
                .upload-modal-container button[type="submit"]:hover {
                  background-color: #10b981 !important; /* emerald-500 */
                }
              `}</style>
              <VendorDocumentUpload
                vendorCode={vendorcode}
                onUploadSuccess={() => {
                  setRefreshTrigger(prev => !prev);
                  setShowUploadModal(false);
                }}
                onUploadError={(err) => alert(`Upload Error: ${err}`)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
