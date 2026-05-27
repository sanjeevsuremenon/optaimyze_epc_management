import { connectToDatabase } from "../../../../lib/mongoconnect";
import React from "react";
import ReactPDF from "@react-pdf/renderer";
const { Document, Page, View, Text, StyleSheet } = ReactPDF;

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#9333ea",
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
    color: "#e9d5ff",
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
    color: "#9333ea",
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
  analysisBox: {
    backgroundColor: "#faf5ff",
    padding: 20,
    marginTop: 20,
    borderRadius: 5,
    border: "2 solid #9333ea",
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b21a8",
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 11,
    color: "#1e1b4b",
    lineHeight: 1.8,
    textAlign: "justify",
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

// Helper function to format date
function formatDate(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

// Helper function to format currency
function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// PDF Document Component
const POAnalysisPDF = ({ ponumber, analysis, poData, generatedAt }) => {
  const poDate = poData?.["po-date"] || poData?.podate;
  const vendorCode = poData?.vendorcode || poData?.["vendor-code"] || "N/A";
  const vendorName = poData?.vendorname || poData?.["vendor-name"] || "N/A";
  const pendingQty = poData?.["pending-qty"] || 0;
  const pendingValSar = poData?.["pending-val-sar"] || 0;
  const poValueSar = poData?.["po-value-sar"] || 0;
  const plantCode = poData?.["plant-code"] || "N/A";
  const currency = poData?.currency || "N/A";

  // Split analysis into paragraphs for better formatting
  const analysisParagraphs = analysis
    ? analysis.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PO Analysis Report</Text>
          <Text style={styles.headerSubtitle}>PO Number: {ponumber}</Text>
          <Text style={styles.headerSubtitle}>
            Generated on: {new Date(generatedAt).toLocaleDateString()}
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

        {/* Analysis Section */}
        <View style={styles.analysisBox}>
          <Text style={styles.analysisTitle}>AI Procurement Analysis</Text>
          {analysisParagraphs.map((paragraph, index) => (
            <Text key={index} style={styles.analysisText}>
              {paragraph.trim()}
              {index < analysisParagraphs.length - 1 ? "\n\n" : ""}
            </Text>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This analysis was generated automatically using AI (OpenAI GPT-4o-mini)
            from the MM Portal system.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ponumber } = req.query;

  if (!ponumber) {
    return res.status(400).json({ error: "PO number is required" });
  }

  try {
    const { db } = await connectToDatabase();

    // Fetch PO information from purchaseorders collection
    const poRecords = await db
      .collection("purchaseorders")
      .find({ "po-number": ponumber })
      .toArray();

    // Aggregate PO data (sum values if multiple line items)
    let poData = null;
    if (poRecords.length > 0) {
      poData = { ...poRecords[0] };
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

    // Get analysis from request body
    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({ error: "Analysis content is required" });
    }

    const generatedAt = new Date().toISOString();

    // Generate PDF
    const pdfDoc = React.createElement(POAnalysisPDF, {
      ponumber,
      analysis,
      poData: poData || {},
      generatedAt,
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
      `attachment; filename="PO_Analysis_${ponumber}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating analysis PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
}

