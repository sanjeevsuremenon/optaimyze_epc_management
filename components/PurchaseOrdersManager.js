import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { sampleVendors, samplePurchaseOrders } from "./purchaseOrdersData";
import VendorAdditionalInfoForm from "./Vendor/VendorAdditionalInfoForm";
import { 
  FileSpreadsheet, 
  Users, 
  GitBranch, 
  List, 
  Grid, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Download, 
  Upload,
  ChevronRight,
  Eye,
  MessageSquare,
  Activity,
  Star,
  FileCheck,
  ExternalLink,
  Calendar
} from "lucide-react";

const getVal = (val) => (val && val.$numberDecimal ? val.$numberDecimal : val);

const getVendorCode = (row) =>
  row?.["vendor-code"] || row?.vendorcode || row?.vendorCode || "";
const getVendorName = (row) =>
  row?.["vendor-name"] || row?.vendorname || row?.vendorName || "";
const getVendorTel = (row, n = 1) => {
  const c = row?.contact || {};
  if (n === 1) return c.telephone1 || c.telelphone1 || "";
  return c.telephone2 || c.telelphone2 || "";
};

const flattenObject = (ob) => {
  var toReturn = {};
  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if ((typeof ob[i]) == 'object' && ob[i] !== null && !(ob[i] instanceof Date) && !Array.isArray(ob[i])) {
      if (ob[i].$numberDecimal !== undefined) {
        toReturn[i] = ob[i].$numberDecimal;
      } else {
        var flatObject = flattenObject(ob[i]);
        for (var x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[i + '.' + x] = flatObject[x];
        }
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
};

const parseCSV = (text) => {
  const lines = text.split(/\r\n|\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const row = [];
    let inQuotes = false;
    let currentToken = '';
    for (let charIndex = 0; charIndex < lines[i].length; charIndex++) {
      const char = lines[i][charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentToken.trim().replace(/^["']|["']$/g, ''));
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    row.push(currentToken.trim().replace(/^["']|["']$/g, ''));
    
    if (row.length === headers.length) {
      const obj = {};
      headers.forEach((h, index) => {
        obj[h] = row[index];
      });
      result.push(obj);
    }
  }
  return result;
};

export default function PurchaseOrdersManager({ initialTab = "purchaseorders" }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [searchTerm, setSearchTerm] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Edit/Add modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); 
  const [formData, setFormData] = useState({});

  // Hierarchy Explorer states
  const [allVendors, setAllVendors] = useState([]);
  const [selectedVendorCode, setSelectedVendorCode] = useState("");
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [hierarchyPOList, setHierarchyPOList] = useState([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Tab definitions
  const tabs = [
    { id: "purchaseorders", label: "Purchase Orders", icon: FileSpreadsheet, type: "purchaseorders" },
    { id: "vendors", label: "Vendors List", icon: Users, type: "vendors" },
    { id: "explorer", label: "PO-Vendor Explorer", icon: GitBranch, type: "explorer" },
    { id: "poupdates", label: "PO Updates", icon: MessageSquare, type: "poupdates" },
    { id: "poexecution", label: "PO Execution Tracker", icon: Activity, type: "poexecution" },
    { id: "vendorupdates", label: "Vendor Updates", icon: MessageSquare, type: "vendorupdates" },
    { id: "vendorevaluations", label: "Vendor Evaluations", icon: Star, type: "vendorevaluations" },
    { id: "vendorprequalifications", label: "Vendor Prequalifications", icon: FileCheck, type: "vendorprequalifications" }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch list data
  const fetchData = useCallback(async () => {
    if (activeTab === "explorer") return;
    setLoading(true);
    try {
      let endpoint = activeTab;
      // Tracker tabs list master records, then overlay tracker actions
      if (activeTab === "poupdates" || activeTab === "poexecution") {
        endpoint = "purchaseorders";
      }
      if (
        activeTab === "vendorupdates" ||
        activeTab === "vendorevaluations" ||
        activeTab === "vendorprequalifications"
      ) {
        endpoint = "vendors";
      }
      const res = await fetch(
        `/api/data-load/${endpoint}?search=${encodeURIComponent(searchTerm)}&limit=100`
      );
      const json = await res.json();
      let data = json.data || [];

      if (activeTab === "poupdates" || activeTab === "poexecution") {
        data = data.filter((row) => {
          const val = getVal(row["pending-val-sar"]);
          return val !== null && val !== "" && parseFloat(val) > 0;
        });
      }

      setDataList(data);
      setTotalCount(json.total || data.length || 0);
    } catch (err) {
      console.error("Error fetching data:", err);
      setDataList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  // Load all vendors for explorer selection
  const fetchAllVendors = async () => {
    try {
      const res = await fetch("/api/data-load/vendors?limit=500");
      const json = await res.json();
      setAllVendors(json.data || []);
      if (json.data && json.data.length > 0) {
        setSelectedVendorCode(json.data[0]["vendor-code"]);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  // Load hierarchy info
  const fetchHierarchy = useCallback(async () => {
    if (!selectedVendorCode) return;
    setLoadingHierarchy(true);
    try {
      // Find details from local list or API
      const vendor = allVendors.find(v => v["vendor-code"] === selectedVendorCode);
      setSelectedVendorDetails(vendor || null);

      // Fetch grouped POs
      const res = await fetch(`/api/purchaseorders/vendor/${selectedVendorCode}`);
      const json = await res.json();
      setHierarchyPOList(json || []);
    } catch (err) {
      console.error("Error loading hierarchy:", err);
    } finally {
      setLoadingHierarchy(false);
    }
  }, [selectedVendorCode, allVendors]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "explorer") {
      fetchAllVendors();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "explorer" && selectedVendorCode) {
      fetchHierarchy();
    }
  }, [activeTab, selectedVendorCode, fetchHierarchy]);

  // Delete handler
  const handleDelete = async (record) => {
    if (!confirm(`Are you sure you want to delete this record?`)) return;
    try {
      const res = await fetch(`/api/data-load/${activeTab}?id=${record._id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error}`);
      }
    } catch (err) {
      alert("Error deleting record.");
    }
  };

  // Save handler (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    const isTracker =
      activeTab === "poupdates" ||
      activeTab === "poexecution" ||
      activeTab === "vendorupdates" ||
      activeTab === "vendorevaluations" ||
      activeTab === "vendorprequalifications";

    // For tracker tabs, editingRecord is the tracker doc (may be new stub without _id)
    const trackerId = isTracker
      ? formData._id || editingRecord?._id
      : editingRecord?._id;
    const method = trackerId ? "PUT" : "POST";
    const bodyData = trackerId ? { ...formData, _id: trackerId } : { ...formData };
    delete bodyData._id;
    if (trackerId) bodyData._id = trackerId;

    try {
      const res = await fetch(`/api/data-load/${activeTab}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Save failed: ${err.error}`);
      }
    } catch (err) {
      alert("Error saving record.");
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    const newForm = {};
    if (activeTab === "purchaseorders") {
      newForm["po-number"] = "";
      newForm["po-line-item"] = "10";
      newForm["po-date"] = "";
      newForm["vendorcode"] = "";
      newForm["vendorname"] = "";
      newForm["material.matcode"] = "";
      newForm["material.matdescription"] = "";
      newForm["material.matgroup"] = "";
      newForm["plant-code"] = "1100";
      newForm["po-quantity"] = "";
      newForm["po-unit-of-measure"] = "EA";
      newForm["po-unit-price"] = "";
      newForm["currency"] = "SAR";
      newForm["po-value-sar"] = "";
      newForm["pending-qty"] = "";
      newForm["pending-val-sar"] = "";
      newForm["pending-inv-qty"] = "";
      newForm["pending-inv-val"] = "";
      newForm["delivery-date"] = "";
      newForm["account.wbs"] = "";
      newForm["account.network"] = "";
      newForm["account.network-activity"] = "";
      newForm["account.costcenter"] = "";
      newForm["account.order"] = "";
      newForm["account.salesdoc"] = "";
      newForm["account.salesdoc-item"] = "";
    } else if (activeTab === "vendors") {
      newForm["vendor-code"] = "";
      newForm["vendor-name"] = "";
      newForm["address.countrycode"] = "SA";
      newForm["address.city"] = "";
      newForm["address.street"] = "";
      newForm["address.district"] = "";
      newForm["address.pobox"] = "";
      newForm["address.zipcode"] = "";
      newForm["created_by"] = "";
      newForm["contact.telephone1"] = "";
      newForm["contact.telephone2"] = "";
      newForm["contact.fax"] = "";
      newForm["vat-number"] = "";
    } else if (activeTab === "poupdates") {
      newForm["ponumber"] = "";
      newForm["title"] = "";
      newForm["comment"] = "";
      newForm["updatedBy"] = "";
    } else if (activeTab === "poexecution") {
      newForm["ponumber"] = "";
      newForm["bgdata.abgestdate"] = "";
      newForm["bgdata.abgactualdate"] = "";
      newForm["bgdata.abgexpirydate"] = "";
      newForm["bgdata.abgamount"] = "";
      newForm["bgdata.pbgestdate"] = "";
      newForm["bgdata.pbgactualdate"] = "";
      newForm["bgdata.pbgreturneddate"] = "";
      newForm["bgdata.abgreturneddate"] = "";
      newForm["bgdata.pbgamount"] = "";
      newForm["bgdata.bgremarks"] = "";
      newForm["bgdata.pbgexpirydate"] = "";
      newForm["generaldata.poackdate"] = "";
      newForm["generaldata.podelydate"] = "";
      newForm["generaldata.estdelydate"] = "";
      newForm["generaldata.delysch"] = "";
      newForm["generaldata.basedesignrecdate"] = "";
      newForm["generaldata.basedesignapprdate"] = "";
      newForm["generaldata.basedesigncomments"] = "";
      newForm["generaldata.generalcomments"] = "";
      newForm["generaldata.detdesignrecdate"] = "";
      newForm["generaldata.detdesignaprdate"] = "";
      newForm["generaldata.mfgclearancedate"] = "";
      newForm["generaldata.itpapprdate"] = "";
      newForm["generaldata.finalworkcompleteddate"] = "";
      newForm["generaldata.grdate"] = "";
      newForm["lcdata.lcestopendate"] = "";
      newForm["lcdata.lcopeneddate"] = "";
      newForm["lcdata.lcdatadate"] = "";
      newForm["lcdata.lclastshipdate"] = "";
      newForm["lcdata.lcexpirydate"] = "";
      newForm["lcdata.lcincoterm"] = "";
      newForm["lcdata.lcdocuments"] = "";
      newForm["lcdata.lcamount"] = "";
      newForm["lcdata.lcremarks"] = "";
      newForm["lcdata.lcswift"] = "";
      newForm["inspectiondata.itpSubmittedDate"] = "";
      newForm["inspectiondata.itpApprovedDate"] = "";
      newForm["inspectiondata.tpiRequestedDate"] = "";
      newForm["inspectiondata.tpiPoIssuedDate"] = "";
      newForm["inspectiondata.tpiPoNumber"] = "";
      newForm["inspectiondata.fatInspectionDate"] = "";
      newForm["inspectiondata.tpiDraftReportReceivedDate"] = "";
      newForm["inspectiondata.tpiReportApprovedDate"] = "";
      newForm["progressdata.mfgstart"] = "";
      newForm["progressdata.Bldate"] = "";
      newForm["progressdata.Fatdate"] = "";
      newForm["progressdata.Fatreportdate"] = "";
      newForm["progressdata.vesselreacheddate"] = "";
      newForm["progressdata.customscleareddate"] = "";
      newForm["shipdata.shipmentbookeddate"] = "";
      newForm["shipdata.grossweight"] = "";
      newForm["shipdata.saberapplieddate"] = "";
      newForm["shipdata.saberreceiveddate"] = "";
      newForm["shipdata.ffnoMinateddate"] = "";
      newForm["shipdata.finalremarks"] = "";
      newForm["paymentdata.advancePayments"] = [];
      newForm["paymentdata.milestonePayments"] = [];
      newForm["paymentdata.finalPayment"] = { date: "", amount: "", comments: "" };
    }
    setFormData(newForm);
    setIsModalOpen(true);
  };

  const openEditModal = async (record) => {
    const isPOTracker = activeTab === "poexecution" || activeTab === "poupdates";
    const isVendorTracker =
      activeTab === "vendorupdates" ||
      activeTab === "vendorevaluations" ||
      activeTab === "vendorprequalifications";

    // Evaluations / feedback / dashboard — use existing pages
    if (activeTab === "vendorevaluations") {
      const code = getVendorCode(record);
      if (code) {
        window.open(`/vendorevaluation/webformat/${encodeURIComponent(code)}`, "_blank");
      }
      return;
    }

    if (activeTab === "vendorprequalifications") {
      setEditingRecord(null);
      setFormData({
        vendorCode: getVendorCode(record),
        vendorName: getVendorName(record),
        _prequalMode: true,
      });
      setIsModalOpen(true);
      return;
    }

    if (isPOTracker || isVendorTracker) {
      let searchVal = isPOTracker
        ? record["po-number"]
        : getVendorCode(record) || getVendorName(record);

      const res = await fetch(
        `/api/data-load/${activeTab}?search=${encodeURIComponent(searchVal || "")}`
      );
      const json = await res.json();

      let targetRecord;
      if (isPOTracker) {
        targetRecord = (json.data || []).find(
          (r) => String(r.ponumber) === String(record["po-number"])
        );
      } else if (activeTab === "vendorupdates") {
        const code = getVendorCode(record);
        const name = getVendorName(record);
        targetRecord = (json.data || []).find(
          (r) =>
            String(r.vendorcode || r.vendorCode || "") === String(code) ||
            String(r.vendorname || "").toLowerCase() === String(name || "").toLowerCase()
        );
      } else {
        targetRecord = (json.data || []).find(
          (r) => String(r.vendorCode) === String(getVendorCode(record))
        );
      }

      if (!targetRecord) {
        if (isPOTracker) {
          targetRecord = { ponumber: record["po-number"] };
        } else if (activeTab === "vendorupdates") {
          targetRecord = {
            vendorname: getVendorName(record),
            vendorcode: getVendorCode(record),
          };
        } else {
          targetRecord = {
            vendorCode: getVendorCode(record),
            vendorName: getVendorName(record),
          };
        }
      }

      // editingRecord must be the TRACKER doc (for correct _id on save), not the master row
      setEditingRecord(targetRecord);

      const flattened = flattenObject(targetRecord);
      Object.keys(flattened).forEach((key) => {
        let val = flattened[key];
        if (val && typeof val === "object" && val.$numberDecimal) {
          flattened[key] = val.$numberDecimal;
        } else if (val && typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
          flattened[key] = val.substring(0, 10);
        }
      });

      const newForm = {};
      if (activeTab === "poupdates") {
        newForm["ponumber"] = targetRecord.ponumber || record["po-number"];
        newForm["title"] = flattened["title"] || "";
        newForm["comment"] = flattened["comment"] || "";
        newForm["updatedBy"] = flattened["updatedBy"] || "";
        if (targetRecord._id) newForm._id = targetRecord._id;
      } else if (activeTab === "poexecution") {
        newForm["ponumber"] = targetRecord.ponumber || record["po-number"];
        if (targetRecord._id) newForm._id = targetRecord._id;
        const keys = [
          "bgdata.abgestdate",
          "bgdata.abgactualdate",
          "bgdata.abgexpirydate",
          "bgdata.abgamount",
          "bgdata.pbgestdate",
          "bgdata.pbgactualdate",
          "bgdata.pbgreturneddate",
          "bgdata.abgreturneddate",
          "bgdata.pbgamount",
          "bgdata.bgremarks",
          "bgdata.pbgexpirydate",
          "generaldata.poackdate",
          "generaldata.podelydate",
          "generaldata.estdelydate",
          "generaldata.delysch",
          "generaldata.basedesignrecdate",
          "generaldata.basedesignapprdate",
          "generaldata.basedesigncomments",
          "generaldata.generalcomments",
          "generaldata.detdesignrecdate",
          "generaldata.detdesignaprdate",
          "generaldata.mfgclearancedate",
          "generaldata.itpapprdate",
          "generaldata.finalworkcompleteddate",
          "generaldata.grdate",
          "lcdata.lcestopendate",
          "lcdata.lcopeneddate",
          "lcdata.lcdatadate",
          "lcdata.lclastshipdate",
          "lcdata.lcexpirydate",
          "lcdata.lcincoterm",
          "lcdata.lcdocuments",
          "lcdata.lcamount",
          "lcdata.lcremarks",
          "lcdata.lcswift",
          "inspectiondata.itpSubmittedDate",
          "inspectiondata.itpApprovedDate",
          "inspectiondata.tpiRequestedDate",
          "inspectiondata.tpiPoIssuedDate",
          "inspectiondata.tpiPoNumber",
          "inspectiondata.fatInspectionDate",
          "inspectiondata.tpiDraftReportReceivedDate",
          "inspectiondata.tpiReportApprovedDate",
          "progressdata.mfgstart",
          "progressdata.Bldate",
          "progressdata.Fatdate",
          "progressdata.Fatreportdate",
          "progressdata.vesselreacheddate",
          "progressdata.customscleareddate",
          "shipdata.shipmentbookeddate",
          "shipdata.grossweight",
          "shipdata.saberapplieddate",
          "shipdata.saberreceiveddate",
          "shipdata.ffnoMinateddate",
          "shipdata.finalremarks",
        ];
        keys.forEach((k) => (newForm[k] = flattened[k] || ""));
      } else if (activeTab === "vendorupdates") {
        newForm["vendorname"] = targetRecord.vendorname || getVendorName(record);
        newForm["vendorcode"] = targetRecord.vendorcode || getVendorCode(record);
        newForm["title"] = flattened["title"] || "";
        newForm["comment"] = flattened["comment"] || "";
        newForm["updatedBy"] = flattened["updatedBy"] || "";
        if (targetRecord._id) newForm._id = targetRecord._id;
      }
      setFormData(newForm);
      setIsModalOpen(true);
      return;
    }

    setEditingRecord(record);
    const flattened = flattenObject(record);
    Object.keys(flattened).forEach((key) => {
      let val = flattened[key];
      if (val && typeof val === "object" && val.$numberDecimal) {
        flattened[key] = val.$numberDecimal;
      } else if (val && typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        flattened[key] = val.substring(0, 10);
      }
    });
    setFormData(flattened);
    setIsModalOpen(true);
  };

  // CSV Export/Template Download
  const handleDownloadTemplate = () => {
    let headers = [];
    let rows = [];
    if (activeTab === "purchaseorders") {
      headers = [
        "po-number", "po-line-item", "po-date", "vendorcode", "vendorname", 
        "material.matcode", "material.matdescription", "material.matgroup", "plant-code", 
        "po-quantity", "po-unit-of-measure", "po-unit-price", "currency", 
        "po-value-sar", "pending-qty", "pending-val-sar", "pending-inv-qty", "pending-inv-val", 
        "delivery-date", "account.wbs", "account.network", "account.network-activity",
        "account.costcenter", "account.order", "account.salesdoc", "account.salesdoc-item"
      ];
      rows = samplePurchaseOrders;
    } else if (activeTab === "vendors") {
      headers = [
        "vendor-code", "vendor-name", "address.countrycode", "address.city", 
        "address.street", "address.district", "address.pobox", "address.zipcode", 
        "created_date", "created_by", "contact.telephone1", "contact.telephone2", "contact.fax", "vat-number"
      ];
      rows = sampleVendors;
    }

    const csvLines = [headers.join(",")];
    rows.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === undefined || val === null) {
          val = "";
        }
        val = String(val);
        // Always wrap in quotes to handle commas, quotes, newlines in data
        val = '"' + val.replace(/"/g, '""') + '"';
        return val;
      });
      csvLines.push(values.join(","));
    });

    const csvString = csvLines.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  // CSV Import handler
  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedData = parseCSV(text);
      if (parsedData.length === 0) {
        alert("The CSV file is empty or invalid.");
        return;
      }

      try {
        const res = await fetch(`/api/data-load/${activeTab}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, data: parsedData })
        });
        const result = await res.json();
        if (res.ok) {
          alert(`Successfully uploaded ${result.matchedCount + result.upsertedCount} records.`);
          fetchData();
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      } catch (err) {
        alert("Upload error.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-app-border gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                active 
                  ? "border-app-accent text-app-accent" 
                  : "border-transparent text-app-text-muted hover:text-app-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== "explorer" ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-surface border border-app-border p-4 rounded-2xl backdrop-blur">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={`Search ${
                  activeTab === "vendorupdates" ||
                  activeTab === "vendorevaluations" ||
                  activeTab === "vendorprequalifications"
                    ? "vendors"
                    : activeTab === "poupdates" || activeTab === "poexecution"
                    ? "purchase orders"
                    : activeTab
                }...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text placeholder:text-app-text-disabled focus:outline-none focus:border-app-accent text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Card / Table Toggle */}
              <div className="flex bg-app-bg border border-app-border rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "table" ? "bg-app-surface text-app-accent shadow-sm" : "text-app-text-muted"}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "card" ? "bg-app-surface text-app-accent shadow-sm" : "text-app-text-muted"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* CSV Upload/Download — master lists only */}
              {(activeTab === "purchaseorders" || activeTab === "vendors") && (
                <>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-app-surface-muted hover:bg-app-border text-app-text text-sm font-semibold rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                Template
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleUploadCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button 
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-app-surface-muted hover:bg-app-border text-app-text text-sm font-semibold rounded-xl transition"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </button>
              </div>
                </>
              )}

              {/* Add New */}
              {(activeTab === "purchaseorders" || activeTab === "vendors") && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              )}
            </div>
          </div>

          {/* List display based on viewMode */}
          {loading ? (
            <div className="text-center py-12 text-app-text-muted font-medium">Loading data...</div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto bg-app-surface border border-app-border rounded-2xl">
              <table className="min-w-full divide-y divide-app-border">
                <thead className="bg-app-surface-muted">
                  {(activeTab === "purchaseorders" || activeTab === "poupdates" || activeTab === "poexecution") && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Line Item</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Delivery Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Plant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Material Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Material Desc</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">UOM</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Total (SAR)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Pending Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Pending Val</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Network</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Sales Doc</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-app-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  {(activeTab === "vendors" || activeTab === "vendorupdates" || activeTab === "vendorevaluations" || activeTab === "vendorprequalifications") && (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vendor Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Country</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">City</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">District</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">PO Box</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Vat Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Tel 1</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Tel 2</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Fax</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-app-text-muted uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-app-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  )}
                  
                </thead>
                <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
                  {dataList.map((row) => (
                    <tr key={row._id} className="hover:bg-app-surface-muted/70 transition-colors">
                      {(activeTab === "purchaseorders" || activeTab === "poupdates" || activeTab === "poexecution") && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-app-accent">{row["po-number"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["po-line-item"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["po-date"] ? new Date(row["po-date"]).toLocaleDateString() : "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["delivery-date"] ? new Date(row["delivery-date"]).toLocaleDateString() : "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["vendorcode"]}</td>
                          <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">{row["vendorname"]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["plant-code"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["material"]?.matcode || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-app-text-secondary max-w-xs truncate">{row["material"]?.matdescription || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{getVal(row["po-quantity"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["po-unit-of-measure"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{getVal(row["po-unit-price"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["currency"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-accent font-bold">{getVal(row["po-value-sar"]) ? Number(getVal(row["po-value-sar"])).toLocaleString() : "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{getVal(row["pending-qty"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{getVal(row["pending-val-sar"]) ?? "0"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["account"]?.network || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-secondary">{row["account"]?.salesdoc || "N/A"}</td>
                        </>
                      )}
                      {(activeTab === "vendors" || activeTab === "vendorupdates" || activeTab === "vendorevaluations" || activeTab === "vendorprequalifications") && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-violet-500">{getVendorCode(row)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-app-text-secondary max-w-md truncate">{getVendorName(row)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["address"]?.countrycode || "SA"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["address"]?.city || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["address"]?.district || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["address"]?.pobox || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["vat-number"] || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{getVendorTel(row, 1) || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{getVendorTel(row, 2) || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["contact"]?.fax || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-app-text-muted">{row["created_by"] || "N/A"}</td>
                        </>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        {(activeTab === "purchaseorders" ||
                          activeTab === "poupdates" ||
                          activeTab === "poexecution") && (
                          <>
                            {activeTab !== "poexecution" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const po = row["po-number"];
                                  if (!po) return;
                                  window.open(
                                    `/openpurchaseorders1/schedule/${encodeURIComponent(po)}`,
                                    "_blank"
                                  );
                                }}
                                className="text-app-text-muted hover:text-app-accent transition p-1"
                                title="PO schedule"
                              >
                                <Calendar className="w-4 h-4 inline" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const po = row["po-number"];
                                if (!po) return;
                                window.open(
                                  `/openpurchaseorders1/view/${encodeURIComponent(po)}`,
                                  "_blank"
                                );
                              }}
                              className="text-app-text-muted hover:text-app-accent transition p-1"
                              title="PO view"
                            >
                              <Eye className="w-4 h-4 inline" />
                            </button>
                          </>
                        )}
                        {(activeTab === "vendors" ||
                          activeTab === "vendorupdates" ||
                          activeTab === "vendorevaluations" ||
                          activeTab === "vendorprequalifications") && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `/vendor-dashboard?vendorcode=${encodeURIComponent(getVendorCode(row))}`,
                                  "_blank"
                                )
                              }
                              className="text-app-text-muted hover:text-app-accent transition p-1"
                              title="Vendor dashboard"
                            >
                              <Eye className="w-4 h-4 inline" />
                            </button>
                            {(activeTab === "vendorevaluations" || activeTab === "vendors") && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(
                                      `/vendorevaluation/webformat/${encodeURIComponent(getVendorCode(row))}`,
                                      "_blank"
                                    )
                                  }
                                  className="text-app-text-muted hover:text-amber-500 transition p-1"
                                  title="Vendor evaluation"
                                >
                                  <Star className="w-4 h-4 inline" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(
                                      `/vendor-feedback?vendorCode=${encodeURIComponent(getVendorCode(row))}`,
                                      "_blank"
                                    )
                                  }
                                  className="text-app-text-muted hover:text-violet-500 transition p-1"
                                  title="Vendor feedback"
                                >
                                  <MessageSquare className="w-4 h-4 inline" />
                                </button>
                              </>
                            )}
                            {activeTab === "vendorprequalifications" && (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    `/vendorevaluation/webformat/${encodeURIComponent(getVendorCode(row))}`,
                                    "_blank"
                                  )
                                }
                                className="text-app-text-muted hover:text-amber-500 transition p-1"
                                title="Vendor evaluation"
                              >
                                <Star className="w-4 h-4 inline" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            // PO Execution Tracker → full schedule page (working route)
                            if (activeTab === "poexecution") {
                              const po = row["po-number"];
                              if (!po) return;
                              window.open(
                                `/openpurchaseorders1/schedule/${encodeURIComponent(po)}`,
                                "_blank"
                              );
                              return;
                            }
                            openEditModal(row);
                          }}
                          className="text-app-text-muted hover:text-amber-500 transition p-1"
                          title={
                            activeTab === "poupdates" || activeTab === "vendorupdates"
                              ? "Add/Edit Update"
                              : activeTab === "poexecution"
                              ? "Open PO schedule"
                              : activeTab === "vendorprequalifications"
                              ? "Prequalification / additional info"
                              : activeTab === "vendorevaluations"
                              ? "Open evaluation"
                              : "Edit"
                          }
                        >
                          {activeTab === "poupdates" || activeTab === "vendorupdates" ? (
                            <MessageSquare className="w-4 h-4 inline" />
                          ) : activeTab === "poexecution" ? (
                            <Calendar className="w-4 h-4 inline" />
                          ) : activeTab === "vendorprequalifications" ? (
                            <FileCheck className="w-4 h-4 inline" />
                          ) : activeTab === "vendorevaluations" ? (
                            <ExternalLink className="w-4 h-4 inline" />
                          ) : (
                            <Edit className="w-4 h-4 inline" />
                          )}
                        </button>
                        {(activeTab === "purchaseorders" || activeTab === "vendors") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="text-app-text-muted hover:text-rose-500 transition p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dataList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-app-text-muted text-sm">No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card view */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dataList.map((row) => (
                <div key={row._id} className="app-card rounded-[1.5rem] p-6 shadow-md border border-app-border hover:border-app-accent/40 flex flex-col justify-between space-y-4">
                  <div>
                    {(activeTab === "purchaseorders" ||
                      activeTab === "poupdates" ||
                      activeTab === "poexecution") && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-app-accent bg-app-accent-soft border border-app-accent/30 px-2.5 py-0.5 rounded-full">
                          PO: {row["po-number"]} (Item {row["po-line-item"]})
                        </span>
                        <h4 className="text-base font-bold text-app-text mt-3 line-clamp-2">{row["material"]?.matdescription || "Purchase Order Item"}</h4>
                        <p className="text-xs text-app-text-muted mt-2">Vendor: <span className="font-semibold text-app-text-secondary">{row["vendorname"]}</span></p>
                      </>
                    )}
                    {(activeTab === "vendors" || activeTab === "vendorupdates" || activeTab === "vendorevaluations" || activeTab === "vendorprequalifications") && (
                      <>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                          Vendor: {getVendorCode(row)}
                        </span>
                        <h4 className="text-base font-bold text-app-text mt-3 line-clamp-2">{getVendorName(row)}</h4>
                        <p className="text-xs text-app-text-muted mt-2">City: <span className="font-semibold text-app-text-secondary">{row["address"]?.city || "N/A"}</span></p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-app-border pt-4">
                    <span className="text-xs font-bold text-app-accent">
                      {(activeTab === "purchaseorders" ||
                        activeTab === "poupdates" ||
                        activeTab === "poexecution")
                        ? `SAR ${Number(getVal(row["po-value-sar"]) || 0).toLocaleString()}`
                        : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {(activeTab === "purchaseorders" ||
                        activeTab === "poupdates" ||
                        activeTab === "poexecution") && (
                        <button
                          type="button"
                          onClick={() => {
                            const po = row["po-number"];
                            if (!po) return;
                            window.open(
                              `/openpurchaseorders1/schedule/${encodeURIComponent(po)}`,
                              "_blank"
                            );
                          }}
                          className="p-1.5 bg-app-surface-muted hover:bg-app-border text-app-text-secondary hover:text-app-accent rounded-lg transition"
                          title="PO schedule"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {activeTab !== "poexecution" && (
                      <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 bg-app-surface-muted hover:bg-app-border text-app-text-secondary hover:text-amber-400 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      )}
                      {(activeTab === "purchaseorders" || activeTab === "vendors") && (
                      <button
                        onClick={() => handleDelete(row)}
                        className="p-1.5 bg-app-surface-muted hover:bg-app-border text-app-text-secondary hover:text-rose-500 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {dataList.length === 0 && (
                <div className="col-span-full text-center py-12 text-app-text-muted">No records found.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Hierarchy explorer nodes mapping view */
        <div className="space-y-6">
          <div className="bg-app-surface border border-app-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-app-text">PO-Vendor Explorer Linkage</h3>
              <p className="text-xs text-app-text-muted mt-1">Select a Vendor to view their details, primary address, and list of purchase orders.</p>
            </div>
            <div>
              <select
                value={selectedVendorCode}
                onChange={(e) => setSelectedVendorCode(e.target.value)}
                className="w-full md:w-80 px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
              >
                {allVendors.map((v) => (
                  <option key={v._id} value={v["vendor-code"]}>
                    {v["vendor-code"]} - {v["vendor-name"]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingHierarchy ? (
            <div className="text-center py-16 text-app-text-muted font-medium">Loading mapped orders...</div>
          ) : selectedVendorDetails ? (
            <div className="bg-app-surface border border-app-border p-8 rounded-[2rem] flex flex-col items-center">
              
              {/* Visual Node Hierarchy */}
              <div className="w-full max-w-4xl flex flex-col items-center gap-10">
                {/* 1. Vendor Node */}
                <div className="relative flex flex-col items-center w-full">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-xl text-center border border-purple-400/20 max-w-md w-full">
                    <span className="text-[10px] uppercase font-black tracking-widest text-purple-200 font-mono">Vendor Master Node</span>
                    <h2 className="text-lg font-black text-white mt-1">{selectedVendorDetails["vendor-name"]}</h2>
                    <p className="text-xs text-purple-100 mt-2 font-medium">Code: {selectedVendorDetails["vendor-code"]}</p>
                    {selectedVendorDetails.address && (
                      <p className="text-[11px] text-purple-200 mt-2">
                        {selectedVendorDetails.address.city}, {selectedVendorDetails.address.countrycode}
                      </p>
                    )}
                    <div className="mt-3 text-[10px] text-indigo-200 border-t border-indigo-500/30 pt-2 flex justify-around">
                      <span>VAT: {selectedVendorDetails["vat-number"] || "N/A"}</span>
                      <span>Tel: {selectedVendorDetails.contact?.telephone1 || selectedVendorDetails.contact?.telelphone1 || "N/A"}</span>
                    </div>
                  </div>
                  {/* Stem Down */}
                  <div className="w-0.5 h-10 bg-app-border"></div>
                </div>

                {/* 2. Grouped Purchase Orders List */}
                <div className="flex flex-col items-center bg-app-surface-muted border border-app-border p-6 rounded-2xl w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-5 h-5 text-app-accent" />
                    <h3 className="text-base font-bold text-app-text">Grouped Purchase Orders</h3>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 w-full">
                    {hierarchyPOList.map((po) => (
                      <button
                        type="button"
                        key={po.ponum}
                        onClick={() => {
                          if (!po.ponum) return;
                          window.open(
                            `/openpurchaseorders1/schedule/${encodeURIComponent(po.ponum)}`,
                            "_blank"
                          );
                        }}
                        className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex flex-col gap-1 justify-between text-left hover:border-app-accent/50 hover:shadow-md transition cursor-pointer"
                        title="Open PO schedule"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-app-accent">PO: {po.ponum}</span>
                            <span className="text-[10px] text-app-text-muted">{po.podate ? new Date(po.podate).toLocaleDateString() : ""}</span>
                          </div>
                          <span className="text-[11px] text-app-text-muted">Delivery: {po["delivery-date"] ? new Date(po["delivery-date"]).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-app-border pt-2 mt-3 text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">SAR {getVal(po.poval) ? Number(getVal(po.poval)).toLocaleString() : "0"}</span>
                          <span className="text-app-text-muted inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Schedule
                          </span>
                        </div>
                      </button>
                    ))}
                    {hierarchyPOList.length === 0 && (
                      <p className="col-span-full text-xs text-app-text-muted text-center py-8">No purchase orders found for this vendor.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>
      )}

      {/* CRUD Add/Edit Modal */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div
            className={`bg-app-surface border border-app-border rounded-2xl w-full shadow-xl flex flex-col max-h-[85vh] overflow-hidden ${
              formData._prequalMode ? "max-w-3xl" : "max-w-2xl"
            }`}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-app-border flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-app-text">
                  {formData._prequalMode
                    ? "Vendor Prequalification"
                    : editingRecord
                    ? "Edit Record"
                    : "Add New Record"}
                </h3>
                <p className="text-xs text-app-text-muted mt-1">
                  {formData._prequalMode
                    ? `${formData.vendorName || ""} (${formData.vendorCode || ""})`
                    : "Fill in the fields to save to database."}
                </p>
              </div>
              {formData._prequalMode && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-app-text-muted hover:text-app-text text-sm font-semibold"
                >
                  Close
                </button>
              )}
            </div>

            {formData._prequalMode ? (
              <div className="p-6 overflow-y-auto flex-1">
                <VendorAdditionalInfoForm
                  vendorCode={formData.vendorCode}
                  onSaved={() => {
                    setIsModalOpen(false);
                    fetchData();
                  }}
                  onCancel={() => setIsModalOpen(false)}
                />
              </div>
            ) : (
            <form 
              onSubmit={handleSave} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                {activeTab === "purchaseorders" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Number (Required)</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingRecord}
                          value={formData["po-number"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "po-number": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Line Item (Required)</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingRecord}
                          value={formData["po-line-item"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "po-line-item": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Date</label>
                        <input
                          type="date"
                          value={formData["po-date"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "po-date": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Delivery Date</label>
                        <input
                          type="date"
                          value={formData["delivery-date"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "delivery-date": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Plant Code</label>
                        <input
                          type="text"
                          value={formData["plant-code"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "plant-code": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Vendor Code</label>
                        <input
                          type="text"
                          value={formData["vendorcode"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vendorcode": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Vendor Name</label>
                        <input
                          type="text"
                          value={formData["vendorname"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vendorname": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 mt-1">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">Material Info</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Material Code</label>
                          <input
                            type="text"
                            value={formData["material.matcode"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "material.matcode": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Material Group</label>
                          <input
                            type="text"
                            value={formData["material.matgroup"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "material.matgroup": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Material Description</label>
                        <input
                          type="text"
                          value={formData["material.matdescription"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "material.matdescription": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 mt-1">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">Pricing & Quantities</span>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Quantity</label>
                          <input
                            type="text"
                            value={formData["po-quantity"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-quantity": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">UOM</label>
                          <input
                            type="text"
                            value={formData["po-unit-of-measure"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-unit-of-measure": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Unit Price</label>
                          <input
                            type="text"
                            value={formData["po-unit-price"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-unit-price": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Currency</label>
                          <input
                            type="text"
                            value={formData["currency"] ?? "SAR"}
                            onChange={(e) => setFormData({ ...formData, "currency": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Value (SAR)</label>
                          <input
                            type="text"
                            value={formData["po-value-sar"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "po-value-sar": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Pending Qty</label>
                          <input
                            type="text"
                            value={formData["pending-qty"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-qty": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Pending Val (SAR)</label>
                          <input
                            type="text"
                            value={formData["pending-val-sar"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-val-sar": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Pending Inv Qty</label>
                          <input
                            type="text"
                            value={formData["pending-inv-qty"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-inv-qty": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Pending Inv Val</label>
                          <input
                            type="text"
                            value={formData["pending-inv-val"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "pending-inv-val": e.target.value })}
                            className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 mt-1">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">Accounting Mapping</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">WBS Element Link</label>
                          <input
                            type="text"
                            value={formData["account.wbs"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.wbs": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Network Number</label>
                          <input
                            type="text"
                            value={formData["account.network"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.network": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Network Activity</label>
                          <input
                            type="text"
                            value={formData["account.network-activity"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.network-activity": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Cost Center</label>
                          <input
                            type="text"
                            value={formData["account.costcenter"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.costcenter": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Order</label>
                          <input
                            type="text"
                            value={formData["account.order"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.order": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Sales Doc</label>
                          <input
                            type="text"
                            value={formData["account.salesdoc"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.salesdoc": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Sales Doc Item</label>
                          <input
                            type="text"
                            value={formData["account.salesdoc-item"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "account.salesdoc-item": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "vendors" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Vendor Code (Required)</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingRecord}
                          value={formData["vendor-code"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vendor-code": e.target.value })}
                          className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">VAT Number</label>
                        <input
                          type="text"
                          value={formData["vat-number"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "vat-number": e.target.value })}
                          className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Vendor Name (Required)</label>
                      <input
                        type="text"
                        required
                        value={formData["vendor-name"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "vendor-name": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>

                    <div className="border-t border-app-border pt-3 mt-1">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">Address Details</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">City</label>
                          <input
                            type="text"
                            value={formData["address.city"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.city": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Country Code</label>
                          <input
                            type="text"
                            value={formData["address.countrycode"] ?? "SA"}
                            onChange={(e) => setFormData({ ...formData, "address.countrycode": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Street Address</label>
                          <input
                            type="text"
                            value={formData["address.street"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.street": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">District</label>
                          <input
                            type="text"
                            value={formData["address.district"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.district": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Box</label>
                          <input
                            type="text"
                            value={formData["address.pobox"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.pobox": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Zip Code</label>
                          <input
                            type="text"
                            value={formData["address.zipcode"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "address.zipcode": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 mt-1">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">Contact Information</span>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Telephone 1</label>
                          <input
                            type="text"
                            value={formData["contact.telephone1"] ?? formData["contact.telelphone1"] ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                "contact.telephone1": e.target.value,
                                "contact.telelphone1": e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Telephone 2</label>
                          <input
                            type="text"
                            value={formData["contact.telephone2"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "contact.telephone2": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Fax</label>
                          <input
                            type="text"
                            value={formData["contact.fax"] ?? ""}
                            onChange={(e) => setFormData({ ...formData, "contact.fax": e.target.value })}
                            className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Created By</label>
                        <input
                          type="text"
                          value={formData["created_by"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "created_by": e.target.value })}
                          className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === "poupdates" && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Number</label>
                        <input
                          type="text"
                          required
                          value={formData["ponumber"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "ponumber": e.target.value })}
                          className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Title</label>
                        <input
                          type="text"
                          required
                          value={formData["title"] ?? ""}
                          onChange={(e) => setFormData({ ...formData, "title": e.target.value })}
                          className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Comment (HTML Support)</label>
                      <textarea
                        rows="6"
                        value={formData["comment"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "comment": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Updated By</label>
                      <input
                        type="text"
                        required
                        value={formData["updatedBy"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "updatedBy": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>
                  </>
                )}

                {activeTab === "poexecution" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Number</label>
                      <input
                        type="text"
                        required
                        value={formData["ponumber"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "ponumber": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>

                    <div className="border-t border-app-border pt-3 mt-3">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">General Data</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Ack Date</label>
                          <input type="date" value={formData["generaldata.poackdate"] ?? ""} onChange={(e) => setFormData({ ...formData, "generaldata.poackdate": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PO Delivery Date</label>
                          <input type="date" value={formData["generaldata.podelydate"] ?? ""} onChange={(e) => setFormData({ ...formData, "generaldata.podelydate": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Delivery Schedule</label>
                        <input type="text" value={formData["generaldata.delysch"] ?? ""} onChange={(e) => setFormData({ ...formData, "generaldata.delysch": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">General Comments</label>
                        <textarea rows="2" value={formData["generaldata.generalcomments"] ?? ""} onChange={(e) => setFormData({ ...formData, "generaldata.generalcomments": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 mt-3">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">BG / LC Data</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">ABG Amount</label>
                          <input type="number" value={formData["bgdata.abgamount"] ?? ""} onChange={(e) => setFormData({ ...formData, "bgdata.abgamount": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">PBG Amount</label>
                          <input type="number" value={formData["bgdata.pbgamount"] ?? ""} onChange={(e) => setFormData({ ...formData, "bgdata.pbgamount": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">LC Amount</label>
                          <input type="number" value={formData["lcdata.lcamount"] ?? ""} onChange={(e) => setFormData({ ...formData, "lcdata.lcamount": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">LC Opened Date</label>
                          <input type="date" value={formData["lcdata.lcopeneddate"] ?? ""} onChange={(e) => setFormData({ ...formData, "lcdata.lcopeneddate": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 mt-3">
                      <span className="text-xs font-bold text-app-accent uppercase tracking-wider block mb-3">Shipping & Progress</span>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">MFG Start Date</label>
                          <input type="date" value={formData["progressdata.mfgstart"] ?? ""} onChange={(e) => setFormData({ ...formData, "progressdata.mfgstart": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">FAT Date</label>
                          <input type="date" value={formData["progressdata.Fatdate"] ?? ""} onChange={(e) => setFormData({ ...formData, "progressdata.Fatdate": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Shipment Booked Date</label>
                          <input type="date" value={formData["shipdata.shipmentbookeddate"] ?? ""} onChange={(e) => setFormData({ ...formData, "shipdata.shipmentbookeddate": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Customs Cleared</label>
                          <input type="date" value={formData["progressdata.customscleareddate"] ?? ""} onChange={(e) => setFormData({ ...formData, "progressdata.customscleareddate": e.target.value })} className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "vendorupdates" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Vendor Name</label>
                      <input
                        type="text"
                        required
                        value={formData["vendorname"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "vendorname": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Title</label>
                      <input
                        type="text"
                        required
                        value={formData["title"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "title": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Comment</label>
                      <textarea
                        rows="4"
                        value={formData["comment"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "comment": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase text-app-text-muted mb-1.5">Updated By</label>
                      <input
                        type="text"
                        required
                        value={formData["updatedBy"] ?? ""}
                        onChange={(e) => setFormData({ ...formData, "updatedBy": e.target.value })}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-sm font-semibold"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-app-border bg-app-surface-muted/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-app-surface-muted hover:bg-app-border text-app-text-secondary text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition"
                >
                  Save
                </button>
              </div>
            </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
