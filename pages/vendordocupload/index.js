import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Link from "next/link";
import VendorDocumentUpload from "../../components/Vendor/VendorDocumentUpload";
import SubcontractorDocumentsUpload from "../../components/Vendor/SubcontractorDocumentsUpload";
import VendorDocumentViewer from "../../components/Vendor/VendorDocumentViewer";
import VendorAdditionalInfoForm from "../../components/Vendor/VendorAdditionalInfoForm";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-app-border bg-app-bg text-app-text text-sm placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent";

const cardClass =
  "bg-app-surface-muted border border-app-border rounded-2xl p-5 sm:p-6 shadow-sm";

export default function VendorDocUploadPage() {
  const { data: session } = useSession();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualVendorCode, setManualVendorCode] = useState("");
  const [refreshDocuments, setRefreshDocuments] = useState(false);
  const [isSubcontractor, setIsSubcontractor] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      if (searchTerm.length >= 3) {
        try {
          const response = await fetch(
            `/api/vendors/search-enhanced?term=${encodeURIComponent(searchTerm)}`
          );
          const data = await response.json();
          setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching vendors:", error);
        }
      } else {
        setVendors([]);
      }
    };

    fetchVendors();
  }, [searchTerm]);

  const generateVendorCode = (vendorName) => {
    if (!vendorName || vendorName.length < 5) {
      return vendorName;
    }
    const first5 = vendorName.substring(0, 5);
    const last5 = vendorName.substring(vendorName.length - 5);
    return first5 + last5;
  };

  const handleVendorSelect = (vendor) => {
    const processedVendor = {
      ...vendor,
      vendorcode:
        vendor.source === "registeredvendors" && vendor.vendorcode === "NA"
          ? generateVendorCode(vendor.vendorname)
          : vendor.vendorcode,
    };

    setSelectedVendor(processedVendor);
    setRefreshDocuments(false);
  };

  const handleManualVendorCode = () => {
    const code = manualVendorCode.trim();
    if (!code) {
      toast.error("Please enter a vendor code to continue.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setSelectedVendor({
      vendorname: `Vendor ${code}`,
      vendorcode: code,
      source: "manual",
    });
    setRefreshDocuments(false);
  };

  const handleUploadSuccess = () => {
    toast.success("Documents uploaded successfully!", {
      position: "top-right",
      autoClose: 3000,
    });
    setRefreshDocuments((prev) => !prev);
  };

  const handleUploadError = (error) => {
    toast.error(`Upload failed: ${error}`, {
      position: "top-right",
      autoClose: 5000,
    });
  };

  if (!session) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center text-app-text">
        <div className="text-center bg-app-surface border border-app-border rounded-2xl p-8 shadow-sm max-w-md">
          <h1 className="text-2xl font-bold text-app-text mb-4">Access Denied</h1>
          <p className="text-app-text-muted mb-4">Please sign in to access this page.</p>
          <Link href="/auth/login" className="text-app-accent hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen text-app-text py-8">
      <Head>
        <title>Vendor Document Upload | Optaimyze</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-app-surface border border-app-border shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-app-border bg-app-surface-muted/50">
            <h1 className="text-2xl font-bold text-app-text tracking-tight">
              Vendor Document Management
            </h1>
            <p className="mt-1 text-sm text-app-text-muted">
              Upload and manage vendor documents including CR, VAT copies, brochures, and profile
              documents.
            </p>
          </div>

          <div className="p-6">
            {!selectedVendor ? (
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-app-text mb-4">Select Vendor</h2>
                <div className="mb-6">
                  <label
                    htmlFor="vendor-search"
                    className="block text-sm font-medium text-app-text-secondary mb-2"
                  >
                    Search for vendor by name or code:
                  </label>
                  <input
                    type="text"
                    id="vendor-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type vendor name or code (min 3 characters)…"
                    className={inputClass}
                  />
                </div>

                {vendors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-app-text-secondary">Search Results:</h3>
                    <div className="max-h-60 overflow-y-auto border border-app-border rounded-xl bg-app-bg">
                      {vendors.map((vendor, index) => (
                        <button
                          type="button"
                          key={vendor.vendorcode || vendor.vendorname || index}
                          onClick={() => handleVendorSelect(vendor)}
                          className="w-full text-left p-3 hover:bg-app-surface-muted cursor-pointer border-b border-app-border last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="font-medium text-app-text">{vendor.vendorname}</h4>
                              <p className="text-sm text-app-text-muted">
                                Code: {vendor.vendorcode || 'N/A'} | Source: {vendor.source}
                              </p>
                            </div>
                            <span className="text-xs text-app-accent font-semibold shrink-0">
                              Select
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchTerm.length >= 3 && vendors.length === 0 && (
                  <div className="text-center py-8 text-app-text-muted">
                    No vendors found matching &quot;{searchTerm}&quot;
                  </div>
                )}

                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <div className="text-center py-8 text-app-text-muted">
                    Please enter at least 3 characters to search
                  </div>
                )}

                <div className="mt-6 border-t border-app-border pt-6">
                  <h3 className="text-sm font-semibold text-app-text mb-3">
                    Or enter a vendor code directly
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                    <input
                      type="text"
                      value={manualVendorCode}
                      onChange={(e) => setManualVendorCode(e.target.value)}
                      placeholder="Enter vendor code"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={handleManualVendorCode}
                      className="px-4 py-2 rounded-xl bg-app-accent text-app-accent-text font-semibold hover:bg-app-accent-hover transition"
                    >
                      Use Vendor Code
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-app-text">
                      Managing Documents for: {selectedVendor.vendorname}
                    </h2>
                    <p className="text-sm text-app-text-muted">
                      Vendor Code:{" "}
                      <span className="font-mono text-app-accent">{selectedVendor.vendorcode}</span>
                      {selectedVendor.source === "registeredvendors" &&
                        selectedVendor.vendorcode !== "NA" && (
                          <span className="text-xs text-app-accent ml-2">
                            (Generated from vendor name)
                          </span>
                        )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVendor(null);
                      setSearchTerm("");
                      setManualVendorCode("");
                    }}
                    className="px-4 py-2 text-sm font-semibold text-app-text bg-app-surface-muted border border-app-border rounded-xl hover:bg-app-border transition focus:outline-none focus:ring-2 focus:ring-app-accent/30"
                  >
                    Change Vendor
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={cardClass}>
                    <h3 className="text-lg font-medium text-app-text mb-4">Upload Documents</h3>
                    <VendorDocumentUpload
                      vendorCode={selectedVendor.vendorcode}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  </div>

                  <div className={cardClass}>
                    <h3 className="text-lg font-medium text-app-text mb-4">Uploaded Documents</h3>
                    <VendorDocumentViewer
                      vendorCode={selectedVendor.vendorcode}
                      refreshTrigger={refreshDocuments}
                    />
                  </div>
                </div>

                <div className={`${cardClass} p-0 overflow-hidden`}>
                  <div className="px-5 sm:px-6 py-4 border-b border-app-border">
                    <h3 className="text-lg font-semibold text-app-text mb-1">Vendor Type</h3>
                    <p className="text-sm text-app-text-muted mb-4">
                      Select vendor type to show relevant document upload options.
                    </p>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="vendorType"
                          value="regular"
                          checked={!isSubcontractor}
                          onChange={() => setIsSubcontractor(false)}
                          className="mr-2 text-app-accent focus:ring-app-accent"
                        />
                        <span className="text-sm font-medium text-app-text-secondary">
                          Regular Vendor
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="vendorType"
                          value="subcontractor"
                          checked={isSubcontractor}
                          onChange={() => setIsSubcontractor(true)}
                          className="mr-2 text-app-accent focus:ring-app-accent"
                        />
                        <span className="text-sm font-medium text-app-text-secondary">
                          Subcontractor
                        </span>
                      </label>
                    </div>
                  </div>
                  {isSubcontractor && (
                    <div className="p-5 sm:p-6 bg-app-bg">
                      <SubcontractorDocumentsUpload
                        vendorCode={selectedVendor.vendorcode}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                      />
                    </div>
                  )}
                </div>

                <div className={`${cardClass} p-0 overflow-hidden`}>
                  <div className="px-5 sm:px-6 py-4 border-b border-app-border">
                    <h3 className="text-lg font-semibold text-app-text">
                      Additional Company Information
                    </h3>
                    <p className="text-sm text-app-text-muted">
                      Provide company profile details to assist evaluation.
                    </p>
                  </div>
                  <div className="p-5 sm:p-6 bg-app-bg">
                    <VendorAdditionalInfoForm
                      vendorCode={selectedVendor.vendorcode}
                      onSaved={() =>
                        toast.success("Additional information saved", {
                          position: "top-right",
                          autoClose: 2000,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
