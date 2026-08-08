import { connectToDatabase } from "../../../../lib/mongoconnect";

// Expected document types (same codes used by upload UI)
const DOCUMENT_TYPES = [
  { code: "CR", label: "CR" },
  { code: "VAT", label: "VAT" },
  { code: "BROCHURE", label: "Brochure" },
  { code: "PROFILE", label: "Profile" },
  { code: "LICENSE", label: "License" },
  { code: "CERTIFICATE", label: "Certificate" },
  { code: "INSURANCE", label: "Insurance" },
  { code: "ZATCA", label: "ZATCA" },
  { code: "BANK_ACCOUNT_LETTER", label: "Bank Account Letter" },
  { code: "CLIENT_REFERENCES", label: "Client References" },
  { code: "APPROVAL_LETTERS", label: "Approval Letters" },
  { code: "PREQUALIFICATION_SHEET", label: "Prequalification" },
  { code: "OTHER", label: "Other" },
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();

    // All vendors (with a vendor-code) that have no uploaded documents
    const pipeline = [
      {
        $match: {
          "vendor-code": { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $lookup: {
          from: "vendordocuments",
          localField: "vendor-code",
          foreignField: "vendorCode",
          as: "docs",
        },
      },
      // no documents uploaded at all
      { $match: { "docs.0": { $exists: false } } },
      {
        $lookup: {
          from: "purchaseorders",
          localField: "vendor-code",
          foreignField: "vendorcode",
          as: "pos",
        },
      },
      {
        $project: {
          _id: 0,
          "vendor-code": 1,
          "vendor-name": 1,
          created_date: 1,
          created_by: 1,
          poCount: { $size: "$pos" },
        },
      },
      { $sort: { "vendor-name": 1, "vendor-code": 1 } },
    ];

    const vendors = await db.collection("vendors").aggregate(pipeline).toArray();

    const result = vendors.map((v) => {
      const missing = DOCUMENT_TYPES.map((t) => ({
        code: t.code,
        label: t.label,
        missing: true,
      }));
      return {
        "vendor-code": v["vendor-code"],
        "vendor-name": v["vendor-name"],
        created_date: v.created_date,
        created_by: v.created_by,
        poCount: v.poCount || 0,
        missingCount: DOCUMENT_TYPES.length,
        missing,
      };
    });

    return res.status(200).json({
      documentTypes: DOCUMENT_TYPES,
      vendors: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Error generating PO missing docs report:", error);
    return res.status(500).json({ error: "Error generating report" });
  }
}
