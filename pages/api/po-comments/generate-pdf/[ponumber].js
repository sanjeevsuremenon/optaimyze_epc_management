import { connectToDatabase } from "../../../../lib/mongoconnect";
import { OpenAI } from "openai";
import React from "react";
import ReactPDF from "@react-pdf/renderer";
const { Document, Page, View, Text, Image, StyleSheet } = ReactPDF;

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#1e3a8a",
    padding: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 5,
    color: "#e0e7ff",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e3a8a",
    borderBottom: "2 solid #1e3a8a",
    paddingBottom: 5,
  },
  commentBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    border: "1 solid #e2e8f0",
  },
  commentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  commentContent: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
    marginBottom: 10,
  },
  commentMeta: {
    fontSize: 9,
    color: "#64748b",
    fontStyle: "italic",
  },
  aiSummaryBox: {
    backgroundColor: "#fef3c7",
    padding: 15,
    marginTop: 20,
    borderRadius: 5,
    border: "2 solid #f59e0b",
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  geminiLogo: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  geminiText: {
    fontSize: 10,
    color: "#4285F4",
    fontWeight: "bold",
    marginRight: 6,
  },
  aiSummaryText: {
    fontSize: 10,
    color: "#78350f",
    lineHeight: 1.6,
    marginBottom: 10,
  },
  sentimentBox: {
    backgroundColor: "#dbeafe",
    padding: 12,
    marginTop: 10,
    borderRadius: 5,
    border: "1 solid #3b82f6",
  },
  sentimentTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  sentimentText: {
    fontSize: 10,
    color: "#1e3a8a",
    lineHeight: 1.5,
  },
  metadataBox: {
    backgroundColor: "#f1f5f9",
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
    border: "1 solid #cbd5e1",
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  metadataLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    width: "40%",
  },
  metadataValue: {
    fontSize: 9,
    color: "#0f172a",
    width: "60%",
  },
  scheduleSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 3,
    border: "1 solid #e2e8f0",
  },
  scheduleSubtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e40af",
    marginTop: 8,
    marginBottom: 5,
  },
  delayWarning: {
    fontSize: 8,
    color: "#dc2626",
    fontStyle: "italic",
    marginLeft: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#64748b",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 10,
  },
});

// Helper function to strip HTML tags
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

// Helper function to format currency
function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Helper function to format date
function formatDate(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
}

// Helper function to calculate days difference (positive = delay, negative = ahead)
function calculateDaysDifference(date1, date2) {
  if (!date1 || !date2) return null;
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d2 - d1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

// Helper function to format delay text
function formatDelay(days) {
  if (days === null || days === undefined) return "N/A";
  if (days === 0) return "On time";
  if (days > 0) return `${days} days delay`;
  return `${Math.abs(days)} days ahead`;
}

// PDF Document Component
const POCommentsPDF = ({
  ponumber,
  comments,
  aiSummary,
  sentiment,
  poData,
  scheduleData,
}) => {
  // Extract PO information
  const poDate = poData?.["po-date"] || poData?.podate;
  const vendorCode = poData?.vendorcode || poData?.["vendor-code"] || "N/A";
  const vendorName = poData?.vendorname || poData?.["vendor-name"] || "N/A";
  const pendingQty = poData?.["pending-qty"] || 0;
  const pendingValSar = poData?.["pending-val-sar"] || 0;
  const poValueSar = poData?.["po-value-sar"] || 0;
  const plantCode = poData?.["plant-code"] || "N/A";
  const currency = poData?.currency || "N/A";

  // Extract schedule data
  const generalData = scheduleData?.generaldata || {};
  const bgData = scheduleData?.bgdata || {};
  const lcData = scheduleData?.lcdata || {};
  const paymentData = scheduleData?.paymentdata || {};
  
  // Calculate reference dates
  const poDateObj = poDate ? new Date(poDate) : null;
  const poAckDate = generalData.poackdate ? new Date(generalData.poackdate) : null;
  const referenceDate = poAckDate || poDateObj;
  
  // Calculate delays
  const baseDesignApprDate = generalData.basedesignapprdate ? new Date(generalData.basedesignapprdate) : null;
  const detDesignApprDate = generalData.detdesignaprdate ? new Date(generalData.detdesignaprdate) : null;
  const itpApprDate = generalData.itpapprdate ? new Date(generalData.itpapprdate) : null;
  
  const baseDesignDelay = referenceDate && baseDesignApprDate 
    ? calculateDaysDifference(referenceDate, baseDesignApprDate) 
    : null;
  const detDesignDelay = referenceDate && detDesignApprDate 
    ? calculateDaysDifference(referenceDate, detDesignApprDate) 
    : null;
  const itpDelay = referenceDate && itpApprDate 
    ? calculateDaysDifference(referenceDate, itpApprDate) 
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Purchase Order Comments Report
          </Text>
          <Text style={styles.headerSubtitle}>
            PO Number: {ponumber}
          </Text>
          <Text style={styles.headerSubtitle}>
            Generated on: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* PO Metadata Section */}
        <View style={styles.metadataBox}>
          <Text style={styles.metadataTitle}>PO Information</Text>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>PO Date:</Text>
            <Text style={styles.metadataValue}>{formatDate(poDate)}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Vendor Code:</Text>
            <Text style={styles.metadataValue}>{vendorCode}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Vendor Name:</Text>
            <Text style={styles.metadataValue}>{vendorName}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Plant Code:</Text>
            <Text style={styles.metadataValue}>{plantCode}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Currency:</Text>
            <Text style={styles.metadataValue}>{currency}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>PO Value (SAR):</Text>
            <Text style={styles.metadataValue}>
              {formatCurrency(poValueSar)}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Pending Quantity:</Text>
            <Text style={styles.metadataValue}>{pendingQty}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Pending Value (SAR):</Text>
            <Text style={styles.metadataValue}>
              {formatCurrency(pendingValSar)}
            </Text>
          </View>
        </View>

        {/* Schedule Information Section */}
        <View style={styles.metadataBox}>
          <Text style={styles.metadataTitle}>Schedule Information</Text>
          
          {/* General Data */}
          {Object.keys(generalData).length > 0 && (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSubtitle}>General Schedule</Text>
              {generalData.poackdate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>PO Acknowledgement:</Text>
                  <Text style={styles.metadataValue}>{formatDate(generalData.poackdate)}</Text>
                </View>
              )}
              {generalData.basedesignapprdate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Base Design Approval:</Text>
                  <Text style={styles.metadataValue}>
                    {formatDate(generalData.basedesignapprdate)}
                    {baseDesignDelay !== null && baseDesignDelay > 0 && (
                      <Text style={styles.delayWarning}> ({formatDelay(baseDesignDelay)})</Text>
                    )}
                  </Text>
                </View>
              )}
              {generalData.detdesignaprdate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Detailed Design Approval:</Text>
                  <Text style={styles.metadataValue}>
                    {formatDate(generalData.detdesignaprdate)}
                    {detDesignDelay !== null && detDesignDelay > 0 && (
                      <Text style={styles.delayWarning}> ({formatDelay(detDesignDelay)})</Text>
                    )}
                  </Text>
                </View>
              )}
              {generalData.itpapprdate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>ITP Approval:</Text>
                  <Text style={styles.metadataValue}>
                    {formatDate(generalData.itpapprdate)}
                    {itpDelay !== null && itpDelay > 0 && (
                      <Text style={styles.delayWarning}> ({formatDelay(itpDelay)})</Text>
                    )}
                  </Text>
                </View>
              )}
              {generalData.podelydate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>PO Delivery Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(generalData.podelydate)}</Text>
                </View>
              )}
              {generalData.estdelydate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Estimated Delivery:</Text>
                  <Text style={styles.metadataValue}>{formatDate(generalData.estdelydate)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Bank Guarantee Data */}
          {Object.keys(bgData).length > 0 && (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSubtitle}>Bank Guarantee</Text>
              {bgData.abgamount && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Advance BG Amount:</Text>
                  <Text style={styles.metadataValue}>{formatCurrency(bgData.abgamount)}</Text>
                </View>
              )}
              {bgData.abgactualdate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Advance BG Actual Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(bgData.abgactualdate)}</Text>
                </View>
              )}
              {bgData.abgexpirydate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Advance BG Expiry:</Text>
                  <Text style={styles.metadataValue}>{formatDate(bgData.abgexpirydate)}</Text>
                </View>
              )}
              {bgData.pbgamount && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Performance BG Amount:</Text>
                  <Text style={styles.metadataValue}>{formatCurrency(bgData.pbgamount)}</Text>
                </View>
              )}
              {bgData.pbgactualdate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Performance BG Actual Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(bgData.pbgactualdate)}</Text>
                </View>
              )}
              {bgData.pbgexpirydate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Performance BG Expiry:</Text>
                  <Text style={styles.metadataValue}>{formatDate(bgData.pbgexpirydate)}</Text>
                </View>
              )}
            </View>
          )}

          {/* LC Data */}
          {Object.keys(lcData).length > 0 && (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSubtitle}>Letter of Credit</Text>
              {lcData.lcamount && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>LC Amount:</Text>
                  <Text style={styles.metadataValue}>{formatCurrency(lcData.lcamount)}</Text>
                </View>
              )}
              {lcData.lcestopendate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>LC Est. Open Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(lcData.lcestopendate)}</Text>
                </View>
              )}
              {lcData.lcopeneddate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>LC Opened Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(lcData.lcopeneddate)}</Text>
                </View>
              )}
              {lcData.lcexpirydate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>LC Expiry Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(lcData.lcexpirydate)}</Text>
                </View>
              )}
              {lcData.lcincoterm && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Incoterm:</Text>
                  <Text style={styles.metadataValue}>{lcData.lcincoterm}</Text>
                </View>
              )}
            </View>
          )}

          {/* Payment Data */}
          {Object.keys(paymentData).length > 0 && (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSubtitle}>Payment Schedule</Text>
              {paymentData.advamountpaid && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Advance Amount Paid:</Text>
                  <Text style={styles.metadataValue}>{formatCurrency(paymentData.advamountpaid)}</Text>
                </View>
              )}
              {paymentData.advpaiddate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Advance Paid Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(paymentData.advpaiddate)}</Text>
                </View>
              )}
              {paymentData.milestoneamountpaid && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Milestone Amount Paid:</Text>
                  <Text style={styles.metadataValue}>{formatCurrency(paymentData.milestoneamountpaid)}</Text>
                </View>
              )}
              {paymentData.milestoneamountpaiddate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Milestone Paid Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(paymentData.milestoneamountpaiddate)}</Text>
                </View>
              )}
              {paymentData.finalpaidamt && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Final Amount Paid:</Text>
                  <Text style={styles.metadataValue}>{formatCurrency(paymentData.finalpaidamt)}</Text>
                </View>
              )}
              {paymentData.finalpaiddate && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Final Paid Date:</Text>
                  <Text style={styles.metadataValue}>{formatDate(paymentData.finalpaiddate)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* AI Summary Section */}
        {aiSummary && (
          <View style={styles.aiSummaryBox}>
            <View style={styles.aiSummaryTitle}>
              <Image
                style={styles.geminiLogo}
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNDI4NUY0Ii8+Cjwvc3ZnPgo="
                alt="Gemini logo"
              />
              <Text>Summary</Text>
            </View>
            <Text style={styles.aiSummaryText}>{aiSummary}</Text>
          </View>
        )}

        {/* Sentiment Analysis Section */}
        {sentiment && (
          <View style={styles.sentimentBox}>
            <Text style={styles.sentimentTitle}>Risk Assessment</Text>
            <Text style={styles.sentimentText}>{sentiment}</Text>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Comments ({comments.length})
          </Text>
          {comments.map((comment, index) => (
            <View key={index} style={styles.commentBox}>
              <Text style={styles.commentTitle}>
                {comment.title || "Untitled Comment"}
              </Text>
              <Text style={styles.commentContent}>
                {stripHtml(comment.comment)}
              </Text>
              <Text style={styles.commentMeta}>
                By: {comment.updatedBy || "Unknown"} | Date:{" "}
                {new Date(comment.updatedAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This document was generated automatically from the MM Portal system.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ponumber } = req.query;

  if (!ponumber) {
    return res.status(400).json({ error: "PO number is required" });
  }

  try {
    const { db } = await connectToDatabase();

    // Fetch all comments for this PO
    const comments = await db
      .collection("pocomments")
      .find({ ponumber: ponumber })
      .sort({ updatedAt: 1 }) // Sort by date ascending
      .toArray();

    if (comments.length === 0) {
      return res.status(404).json({ error: "No comments found for this PO" });
    }

    // Fetch PO information from purchaseorders collection
    // Note: purchaseorders uses 'po-number' field, and there may be multiple line items
    const poRecords = await db
      .collection("purchaseorders")
      .find({ "po-number": ponumber })
      .toArray();

    // Aggregate PO data (sum values if multiple line items)
    let poData = null;
    if (poRecords.length > 0) {
      // Use the first record as base, but aggregate values
      poData = { ...poRecords[0] };
      // Sum up values if multiple line items
      const totalPendingQty = poRecords.reduce(
        (sum, record) => sum + (record["pending-qty"] || 0),
        0
      );
      const totalPendingVal = poRecords.reduce(
        (sum, record) => sum + (record["pending-val-sar"] || 0),
        0
      );
      const totalPoValue = poRecords.reduce(
        (sum, record) => sum + (record["po-value-sar"] || 0),
        0
      );
      poData["pending-qty"] = totalPendingQty;
      poData["pending-val-sar"] = totalPendingVal;
      poData["po-value-sar"] = totalPoValue;
    }

    // Fetch schedule information from poschedule collection
    const scheduleData = await db
      .collection("poschedule")
      .findOne({ ponumber: ponumber });

    // Prepare PO context for AI analysis
    const poContext = poData
      ? `PO Details:
- PO Date: ${formatDate(poData["po-date"])}
- Vendor: ${poData.vendorname || poData["vendor-name"] || "N/A"} (Code: ${poData.vendorcode || poData["vendor-code"] || "N/A"})
- PO Value (SAR): ${formatCurrency(poData["po-value-sar"])}
- Pending Quantity: ${poData["pending-qty"] || 0}
- Pending Value (SAR): ${formatCurrency(poData["pending-val-sar"])}
- Plant Code: ${poData["plant-code"] || "N/A"}
- Currency: ${poData.currency || "N/A"}
`
      : "PO Details: Not available";

    // Build detailed schedule context with dates and delays
    let scheduleContext = "Schedule Status: ";
    if (!scheduleData) {
      scheduleContext += "Not available";
    } else {
      const genData = scheduleData.generaldata || {};
      const bgData = scheduleData.bgdata || {};
      const lcData = scheduleData.lcdata || {};
      const payData = scheduleData.paymentdata || {};
      
      const refDate = genData.poackdate || poData?.["po-date"];
      const refDateObj = refDate ? new Date(refDate) : null;
      
      scheduleContext += "\n\nGeneral Schedule:\n";
      if (genData.poackdate) scheduleContext += `- PO Acknowledgement Date: ${formatDate(genData.poackdate)}\n`;
      if (genData.basedesignapprdate) {
        const delay = refDateObj ? calculateDaysDifference(refDateObj, new Date(genData.basedesignapprdate)) : null;
        scheduleContext += `- Base Design Approval: ${formatDate(genData.basedesignapprdate)}${delay !== null && delay > 0 ? ` (${delay} days delay from ${refDate ? "PO Acknowledgement" : "PO Date"})` : ""}\n`;
      }
      if (genData.detdesignaprdate) {
        const delay = refDateObj ? calculateDaysDifference(refDateObj, new Date(genData.detdesignaprdate)) : null;
        scheduleContext += `- Detailed Design Approval: ${formatDate(genData.detdesignaprdate)}${delay !== null && delay > 0 ? ` (${delay} days delay from ${refDate ? "PO Acknowledgement" : "PO Date"})` : ""}\n`;
      }
      if (genData.itpapprdate) {
        const delay = refDateObj ? calculateDaysDifference(refDateObj, new Date(genData.itpapprdate)) : null;
        scheduleContext += `- ITP Approval: ${formatDate(genData.itpapprdate)}${delay !== null && delay > 0 ? ` (${delay} days delay from ${refDate ? "PO Acknowledgement" : "PO Date"})` : ""}\n`;
      }
      if (genData.podelydate) scheduleContext += `- PO Delivery Date: ${formatDate(genData.podelydate)}\n`;
      if (genData.estdelydate) scheduleContext += `- Estimated Delivery: ${formatDate(genData.estdelydate)}\n`;
      
      if (Object.keys(bgData).length > 0) {
        scheduleContext += "\nBank Guarantee:\n";
        if (bgData.abgamount) scheduleContext += `- Advance BG Amount: ${formatCurrency(bgData.abgamount)}\n`;
        if (bgData.abgactualdate) scheduleContext += `- Advance BG Actual Date: ${formatDate(bgData.abgactualdate)}\n`;
        if (bgData.abgexpirydate) scheduleContext += `- Advance BG Expiry: ${formatDate(bgData.abgexpirydate)}\n`;
        if (bgData.pbgamount) scheduleContext += `- Performance BG Amount: ${formatCurrency(bgData.pbgamount)}\n`;
        if (bgData.pbgactualdate) scheduleContext += `- Performance BG Actual Date: ${formatDate(bgData.pbgactualdate)}\n`;
        if (bgData.pbgexpirydate) scheduleContext += `- Performance BG Expiry: ${formatDate(bgData.pbgexpirydate)}\n`;
      }
      
      if (Object.keys(lcData).length > 0) {
        scheduleContext += "\nLetter of Credit:\n";
        if (lcData.lcamount) scheduleContext += `- LC Amount: ${formatCurrency(lcData.lcamount)}\n`;
        if (lcData.lcestopendate) scheduleContext += `- LC Est. Open Date: ${formatDate(lcData.lcestopendate)}\n`;
        if (lcData.lcopeneddate) scheduleContext += `- LC Opened Date: ${formatDate(lcData.lcopeneddate)}\n`;
        if (lcData.lcexpirydate) scheduleContext += `- LC Expiry Date: ${formatDate(lcData.lcexpirydate)}\n`;
        if (lcData.lcincoterm) scheduleContext += `- Incoterm: ${lcData.lcincoterm}\n`;
      }
      
      if (Object.keys(payData).length > 0) {
        scheduleContext += "\nPayment Schedule:\n";
        if (payData.advamountpaid) scheduleContext += `- Advance Amount Paid: ${formatCurrency(payData.advamountpaid)}\n`;
        if (payData.advpaiddate) scheduleContext += `- Advance Paid Date: ${formatDate(payData.advpaiddate)}\n`;
        if (payData.milestoneamountpaid) scheduleContext += `- Milestone Amount Paid: ${formatCurrency(payData.milestoneamountpaid)}\n`;
        if (payData.milestoneamountpaiddate) scheduleContext += `- Milestone Paid Date: ${formatDate(payData.milestoneamountpaiddate)}\n`;
        if (payData.finalpaidamt) scheduleContext += `- Final Amount Paid: ${formatCurrency(payData.finalpaidamt)}\n`;
        if (payData.finalpaiddate) scheduleContext += `- Final Paid Date: ${formatDate(payData.finalpaiddate)}\n`;
      }
    }

    // Prepare comments text for AI analysis
    const commentsText = comments
      .map((c) => {
        const cleanText = stripHtml(c.comment);
        return `Title: ${c.title || "N/A"}\nComment: ${cleanText}\nBy: ${
          c.updatedBy || "Unknown"
        }\nDate: ${new Date(c.updatedAt).toLocaleString()}`;
      })
      .join("\n\n---\n\n");

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    // Generate AI summary and sentiment analysis
    let aiSummary = "";
    let sentiment = "";

    try {
      const prompt = `You are analyzing comments for Purchase Order ${ponumber}. 

${poContext}

${scheduleContext}

Comments:
${commentsText}

IMPORTANT: Pay special attention to schedule delays mentioned in the schedule context above. If there are significant delays in design approvals (Base Design, Detailed Design) or ITP approval from the PO date or PO acknowledgement date, these are critical schedule risks that could lead to project delays.

Please provide:
1. A one-paragraph summary of all the comments, highlighting key concerns, issues, or updates mentioned. Consider:
   - The PO's pending quantity and value
   - Schedule delays (especially design approval delays and ITP approval delays)
   - Payment schedule status
   - Bank guarantee and LC status
   - Vendor information
   - Any delivery or shipment concerns

2. A sentiment analysis indicating whether this PO needs to be monitored closely due to risks of:
   - Schedule overruns (pay special attention to design approval delays, ITP delays, delivery date concerns, and any schedule slippage mentioned in comments)
   - Cost overruns (consider pending value vs PO value, payment schedule concerns, BG/LC amounts)
   - Both schedule and cost overruns
   - Or if it appears to be on track

When analyzing schedule risks, consider:
- Delays in design approvals (Base Design, Detailed Design) from PO date/acknowledgement
- Delays in ITP approval
- Any delays in BG or LC opening
- Payment delays
- Delivery date concerns

Format your response as:
SUMMARY: [your one paragraph summary here, specifically mentioning any significant schedule delays]
SENTIMENT: [your risk assessment here, clearly stating if monitoring is needed and why, with specific focus on schedule delays and their impact on project timeline]`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert project management analyst specializing in procurement and purchase order risk assessment.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseText = completion.choices[0].message.content;

      // Parse the response
      const summaryMatch = responseText.match(/SUMMARY:\s*(.+?)(?=SENTIMENT:|$)/is);
      const sentimentMatch = responseText.match(/SENTIMENT:\s*(.+?)$/is);

      aiSummary = summaryMatch ? summaryMatch[1].trim() : responseText;
      sentiment = sentimentMatch
        ? sentimentMatch[1].trim()
        : "Unable to determine sentiment from comments.";
    } catch (aiError) {
      console.error("OpenAI API Error:", aiError);
      // Continue without AI summary if API fails
      aiSummary = "AI summary unavailable. Please review comments manually.";
      sentiment =
        "Risk assessment unavailable. Please review comments to assess schedule and cost risks.";
    }

    // Generate PDF
    const pdfDoc = React.createElement(POCommentsPDF, {
      ponumber,
      comments,
      aiSummary,
      sentiment,
      poData: poData || {},
      scheduleData: scheduleData || {},
    });

    // Render PDF to stream and convert to buffer
    const stream = await ReactPDF.renderToStream(pdfDoc);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="PO_Comments_${ponumber}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF", details: error.message });
  }
}

