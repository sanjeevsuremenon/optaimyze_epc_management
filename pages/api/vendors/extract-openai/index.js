import { connectToDatabase } from '../../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const VENDOR_EXTRACTS_COLLECTION = 'vendorextracts';

/**
 * GET: trigger extraction for a vendor (vendorcode in query).
 * POST: same with body { vendorcode, vendorName?, source? }.
 * Fetches vendor PO data, computes gap from last purchase;
 * if gap <= 12 months, calls OpenAI to bucket materials into materialgroups/materialsubgroups;
 * saves result to vendorextracts collection.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const vendorcode = req.method === 'POST' ? req.body?.vendorcode : req.query?.vendorcode;
    const vendorName = req.method === 'POST' ? req.body?.vendorName : req.query?.vendorName;
    const source = req.method === 'POST' ? req.body?.source : req.query?.source;

    if (!vendorcode) {
      return res.status(400).json({ error: 'vendorcode is required' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured (OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY)' });
    }

    const { db } = await connectToDatabase();

    // Resolve vendor (same logic as dashboard)
    let vendor = null;
    let vendorDetails = null;
    let registeredVendorDetails = null;
    if (source === 'registeredvendors' && vendorName) {
      registeredVendorDetails = await db.collection('registeredvendors').findOne({ vendorname: vendorName });
    }
    if (!registeredVendorDetails) {
      [vendorDetails, registeredVendorDetails] = await Promise.all([
        db.collection('vendors').findOne({ 'vendor-code': vendorcode }),
        db.collection('registeredvendors').findOne({ vendorcode: vendorcode })
      ]);
    }
    vendor = vendorDetails || registeredVendorDetails;
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const displayName = vendor['vendor-name'] || vendor.vendorname || vendorName || 'N/A';

    // Get all PO line items for this vendor (DB may use vendorcode or vendor-code)
    const poLineItems = await db.collection('purchaseorders')
      .find({
        $or: [
          { vendorcode: vendorcode },
          { 'vendor-code': vendorcode }
        ]
      })
      .toArray();

    const poSummary = {};
    let totalValue = 0;
    poLineItems.forEach(po => {
      const poNumber = po['po-number'];
      if (!poSummary[poNumber]) {
        poSummary[poNumber] = {
          ponum: poNumber,
          podate: po['po-date'],
          poval: 0
        };
        poSummary[poNumber].poval += po['po-value-sar'] || 0;
        totalValue += po['po-value-sar'] || 0;
      } else {
        poSummary[poNumber].poval += po['po-value-sar'] || 0;
        totalValue += po['po-value-sar'] || 0;
      }
    });

    const poCount = Object.keys(poSummary).length;
    const poListSorted = Object.values(poSummary).sort((a, b) => new Date(b.podate) - new Date(a.podate));
    const lastPoDate = poListSorted.length ? poListSorted[0].podate : null;

    const now = new Date();
    const lastDate = lastPoDate ? new Date(lastPoDate) : null;
    const gapMonths = lastDate
      ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24 * 30.44))
      : null;

    let groupsAndSubgroups = [];
    let debugMaterialsCount = 0;
    let debugGroupSubgroupCount = 0;
    let openaiActuallyCalled = false;

    if (gapMonths !== null && gapMonths > 12) {
      // No need to call OpenAI; do not proceed with material bucketing
      groupsAndSubgroups = [];
    } else if (poLineItems.length > 0 && (gapMonths === null || gapMonths <= 12)) {
      // Fetch material groups and subgroups
      const groups = await db.collection('materialgroups').find({}).sort({ name: 1 }).toArray();
      const groupsWithSubgroups = await Promise.all(groups.map(async (group) => {
        const groupId = group._id;
        const subgroups = await db.collection('materialsubgroups')
          .find({
            $or: [
              { groupId: groupId },
              { groupId: groupId.toString() }
            ]
          })
          .sort({ name: 1 })
          .toArray();
        return { ...group, subgroups };
      }));

      // Unique materials from PO line items (description/code) - support multiple field shapes
      const materialsSeen = new Set();
      const materialsList = [];
      for (const po of poLineItems) {
        const desc = (po.material && po.material.matdescription) || po['material.matdescription'] || po.material?.description || po.description || '';
        const code = (po.material && po.material.matcode) || po['material.matcode'] || po.material?.matcode || po.matcode || '';
        const key = `${String(code)}|${String(desc)}`;
        if (materialsSeen.has(key)) continue;
        if (!desc && !code) continue;
        materialsSeen.add(key);
        materialsList.push({
          matcode: code,
          matdescription: desc
        });
      }

      const groupSubgroupList = groupsWithSubgroups.flatMap(g =>
        (g.subgroups || []).map(s => ({ groupName: g.name, subgroupName: s.name }))
      );

      debugMaterialsCount = materialsList.length;
      debugGroupSubgroupCount = groupSubgroupList.length;

      if (materialsList.length === 0 || groupSubgroupList.length === 0) {
        groupsAndSubgroups = [];
      } else {
      openaiActuallyCalled = true;
      const prompt = `You are a classifier. Given:
1) A list of material descriptions/codes purchased from a vendor (each item may have matcode and matdescription).
2) The exact list of allowed group and subgroup names from our materialgroups/materialsubgroups.

Task: For each purchased material, assign exactly one group and one subgroup from the allowed list. Output a single JSON object, no preamble, no markdown, no explanation. Use this exact structure:
{"poCount":<number>,"totalValue":<number>,"gapMonths":<number>,"groups":[{"group":"<groupName>","subgroup":"<subgroupName>"}]}
- poCount, totalValue, gapMonths must be the numbers provided below.
- "groups" is the list of unique group/subgroup pairs that cover all purchased materials (each material bucketed into one group/subgroup; list unique pairs only).

Allowed group and subgroup names (use these strings exactly):
${JSON.stringify(groupSubgroupList)}

Purchased materials (matcode, matdescription):
${JSON.stringify(materialsList)}

Numbers to use: poCount=${poCount}, totalValue=${totalValue}, gapMonths=${gapMonths === null ? 'null' : gapMonths}.

Output only the JSON object.`;

      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 2048
          })
        });

        if (!openaiRes.ok) {
          const errText = await openaiRes.text();
          console.error('OpenAI API error:', openaiRes.status, errText);
          return res.status(502).json({ error: 'OpenAI request failed', details: errText });
        }

        const openaiData = await openaiRes.json();
        let content = openaiData.choices?.[0]?.message?.content?.trim() || '';
        // Strip markdown code block if present
        const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlock) content = codeBlock[1].trim();
        let parsed = null;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (_) {
            parsed = null;
          }
        }
        if (parsed && Array.isArray(parsed.groups)) {
          groupsAndSubgroups = parsed.groups.map(g => ({
            group: g.group || g.groupName || '',
            subgroup: g.subgroup || g.subgroupName || ''
          })).filter(g => g.group || g.subgroup);
        }
      } catch (openaiErr) {
        console.error('OpenAI call error:', openaiErr);
        return res.status(502).json({ error: 'OpenAI request failed', details: openaiErr.message });
      }
      }
    }

    const record = {
      vendorName: displayName,
      numberOfPO: poCount,
      valueOfPurchaseSoFar: totalValue,
      groupAndSubgroup: groupsAndSubgroups,
      dateOfRecordCreated: new Date()
    };

    await db.collection(VENDOR_EXTRACTS_COLLECTION).insertOne(record);

    return res.status(200).json({
      success: true,
      extract: record,
      debug: {
        poLineItemsCount: poLineItems.length,
        gapMonths,
        materialsCount: debugMaterialsCount,
        groupSubgroupOptionsCount: debugGroupSubgroupCount,
        openaiCalled: openaiActuallyCalled
      }
    });
  } catch (error) {
    console.error('Extract OpenAI API error:', error);
    return res.status(500).json({
      error: 'Failed to extract vendor data',
      details: error.message
    });
  }
}
