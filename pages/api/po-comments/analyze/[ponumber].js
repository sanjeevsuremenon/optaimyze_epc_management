import { connectToDatabase } from "../../../../lib/mongoconnect";
import { OpenAI } from "openai";

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
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

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

    // Fetch schedule information from poschedule collection
    const scheduleData = await db
      .collection("poschedule")
      .findOne({ ponumber: ponumber });

    // Prepare comprehensive context for AI analysis
    let analysisContext = `Analyze the following conversation logs and dates related to PO ${ponumber}. Your final output must be 2 paras - overall summary, if there is delay suspected causes of delay, if PO is still not delivered then 3rd para should be suggestions to expedite the delivery to be brought back on track\n\n`;

    // Add PO Details
    if (poData) {
      const poDate = poData["po-date"] || poData.podate;
      analysisContext += `PO DETAILS:\n`;
      analysisContext += `- PO Number: ${ponumber}\n`;
      analysisContext += `- PO Date: ${formatDate(poDate)}\n`;
      analysisContext += `- Vendor Name: ${poData.vendorname || poData["vendor-name"] || "N/A"}\n`;
      analysisContext += `- Vendor Code: ${poData.vendorcode || poData["vendor-code"] || "N/A"}\n`;
      analysisContext += `- PO Value (SAR): ${formatCurrency(poData["po-value-sar"])}\n`;
      analysisContext += `- Pending Quantity: ${poData["pending-qty"] || 0}\n`;
      analysisContext += `- Pending Value (SAR): ${formatCurrency(poData["pending-val-sar"])}\n`;
      analysisContext += `- Plant Code: ${poData["plant-code"] || "N/A"}\n`;
      analysisContext += `- Currency: ${poData.currency || "N/A"}\n\n`;
    } else {
      analysisContext += `PO DETAILS: Not available\n\n`;
    }

    // Add Schedule Data with all dates
    if (scheduleData) {
      const genData = scheduleData.generaldata || {};
      const bgData = scheduleData.bgdata || {};
      const lcData = scheduleData.lcdata || {};
      const payData = scheduleData.paymentdata || {};

      analysisContext += `SCHEDULE DATA:\n\n`;

      // General Schedule Dates
      analysisContext += `Key Dates:\n`;
      if (genData.poackdate) {
        analysisContext += `- PO Acknowledgement Date: ${formatDate(genData.poackdate)}\n`;
      }
      if (genData.basedesignapprdate) {
        analysisContext += `- Base Design Approval Date: ${formatDate(genData.basedesignapprdate)}\n`;
      }
      if (genData.detdesignaprdate) {
        analysisContext += `- Detailed Design Approval Date: ${formatDate(genData.detdesignaprdate)}\n`;
      }
      if (genData.mfgclearancedate) {
        analysisContext += `- Manufacturing Clearance Date: ${formatDate(genData.mfgclearancedate)}\n`;
      }
      if (genData.itpapprdate) {
        analysisContext += `- ITP Approval Date: ${formatDate(genData.itpapprdate)}\n`;
      }
      if (genData.podelydate) {
        analysisContext += `- PO Delivery Date: ${formatDate(genData.podelydate)}\n`;
      }
      if (genData.estdelydate) {
        analysisContext += `- Estimated Delivery Date: ${formatDate(genData.estdelydate)}\n`;
      }
      if (genData.grdate) {
        analysisContext += `- Final Delivery/GRN Date: ${formatDate(genData.grdate)}\n`;
      }
      if (genData.finalworkcompleteddate) {
        analysisContext += `- Final Work Completion Date: ${formatDate(genData.finalworkcompleteddate)}\n`;
      }

      // Payment Data
      if (Object.keys(payData).length > 0) {
        analysisContext += `\nPAYMENT DATA:\n`;
        if (payData.advamountpaid) {
          analysisContext += `- Advance Amount Paid: ${formatCurrency(payData.advamountpaid)}\n`;
        }
        if (payData.advpaiddate) {
          analysisContext += `- Advance Paid Date: ${formatDate(payData.advpaiddate)}\n`;
        }
        if (payData.milestoneamountpaid) {
          analysisContext += `- Milestone Amount Paid: ${formatCurrency(payData.milestoneamountpaid)}\n`;
        }
        if (payData.milestoneamountpaiddate) {
          analysisContext += `- Milestone Paid Date: ${formatDate(payData.milestoneamountpaiddate)}\n`;
        }
        if (payData.finalpaidamt) {
          analysisContext += `- Final Amount Paid: ${formatCurrency(payData.finalpaidamt)}\n`;
        }
        if (payData.finalpaiddate) {
          analysisContext += `- Final Paid Date: ${formatDate(payData.finalpaiddate)}\n`;
        }
      }

      // Bank Guarantee Data
      if (Object.keys(bgData).length > 0) {
        analysisContext += `\nBANK GUARANTEE DATA:\n`;
        if (bgData.abgamount) {
          analysisContext += `- Advance BG Amount: ${formatCurrency(bgData.abgamount)}\n`;
        }
        if (bgData.abgactualdate) {
          analysisContext += `- Advance BG Actual Date: ${formatDate(bgData.abgactualdate)}\n`;
        }
        if (bgData.pbgamount) {
          analysisContext += `- Performance BG Amount: ${formatCurrency(bgData.pbgamount)}\n`;
        }
        if (bgData.pbgactualdate) {
          analysisContext += `- Performance BG Actual Date: ${formatDate(bgData.pbgactualdate)}\n`;
        }
      }

      // Letter of Credit Data
      if (Object.keys(lcData).length > 0) {
        analysisContext += `\nLETTER OF CREDIT DATA:\n`;
        if (lcData.lcamount) {
          analysisContext += `- LC Amount: ${formatCurrency(lcData.lcamount)}\n`;
        }
        if (lcData.lcestopendate) {
          analysisContext += `- LC Estimated Open Date: ${formatDate(lcData.lcestopendate)}\n`;
        }
        if (lcData.lcopeneddate) {
          analysisContext += `- LC Opened Date: ${formatDate(lcData.lcopeneddate)}\n`;
        }
        if (lcData.lcexpirydate) {
          analysisContext += `- LC Expiry Date: ${formatDate(lcData.lcexpirydate)}\n`;
        }
      }
    } else {
      analysisContext += `SCHEDULE DATA: Not available\n`;
    }

    // Add Comments/Conversation Logs
    if (comments.length > 0) {
      analysisContext += `\n\nCONVERSATION LOGS (PO Comments):\n\n`;
      comments.forEach((comment, index) => {
        const cleanText = stripHtml(comment.comment);
        analysisContext += `Comment ${index + 1}:\n`;
        analysisContext += `- Title: ${comment.title || "N/A"}\n`;
        analysisContext += `- Date: ${new Date(comment.updatedAt).toLocaleString()}\n`;
        analysisContext += `- Updated By: ${comment.updatedBy || "Unknown"}\n`;
        analysisContext += `- Content: ${cleanText}\n\n`;
      });
    } else {
      analysisContext += `\n\nCONVERSATION LOGS: No comments available\n`;
    }

    // Initialize OpenAI with GPT-4o-mini
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    let analysis = "";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI Procurement Analyst. Your task is to analyze the following set of PO comments.",
          },
          {
            role: "user",
            content: analysisContext,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      analysis = completion.choices[0].message.content;
    } catch (aiError) {
      console.error("OpenAI API Error:", aiError);
      return res.status(500).json({
        error: "Failed to generate analysis",
        details: aiError.message,
      });
    }

    // Return the analysis
    res.status(200).json({
      success: true,
      ponumber: ponumber,
      analysis: analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating analysis:", error);
    res.status(500).json({
      error: "Failed to generate analysis",
      details: error.message,
    });
  }
}

