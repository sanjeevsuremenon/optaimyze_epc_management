import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {
        // First, get all purchase orders and group by project and PO number
        const purchaseOrders = await db
          .collection("purchaseorders")
          .aggregate([
            {
              $lookup: {
                from: "networks",
                localField: "account.network",
                foreignField: "network-num",
                as: "network_info"
              }
            },
            {
              $addFields: {
                projectId: {
                  $cond: {
                    if: {
                      $and: [
                        { $ifNull: ["$account.wbs", false] },
                        { $ne: ["$account.wbs", ""] }
                      ]
                    },
                    then: { $substr: ["$account.wbs", 0, 12] },
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            { $ifNull: ["$account.network", false] },
                            { $ne: ["$account.network", ""] }
                          ]
                        },
                        then: {
                          $cond: {
                            if: { $gt: [{ $size: "$network_info" }, 0] },
                            then: { $substr: [{ $arrayElemAt: ["$network_info.project-wbs", 0] }, 0, 12] },
                            else: "ignore"
                          }
                        },
                        else: "unassigned"
                      }
                    }
                  }
                }
              }
            },
            {
              $project: {
                network_info: 0
              }
            },
            {
              $match: {
                projectId: { $ne: "ignore" }
              }
            },
            {
              $group: {
                _id: {
                  projectId: "$projectId",
                  ponumber: "$po-number"
                },
                "po-date": { $first: "$po-date" },
                "delivery-date": { $first: "$delivery-date" },
                vendorcode: { $first: { $ifNull: ["$vendorcode", { $ifNull: ["$vendor-code", ""] }] } },
                vendorname: { $first: { $ifNull: ["$vendorname", { $ifNull: ["$vendor-name", ""] }] } },
                poval: { $sum: { $ifNull: ["$po-value-sar", 0] } },
                balgrval: { $sum: { $ifNull: ["$pending-val-sar", 0] } }
              }
            },
            {
              $match: {
                balgrval: { $gt: 100 } // Only open POs (balance > 100)
              }
            }
          ])
          .toArray();

        // Get all unique PO numbers that are open
        const openPONumbers = [...new Set(purchaseOrders.map(po => po._id.ponumber))];

        // Fetch material documents for these POs to cross-reference
        const materialDocs = await db
          .collection("materialdocumentsforpo")
          .find({ ponumber: { $in: openPONumbers } })
          .toArray();

        // Group material documents by PO number to get delivery info
        const materialDocsByPO = {};
        materialDocs.forEach(doc => {
          if (!materialDocsByPO[doc.ponumber]) {
            materialDocsByPO[doc.ponumber] = [];
          }
          materialDocsByPO[doc.ponumber].push(doc);
        });

        // Now group by project
        const projectsMap = {};

        purchaseOrders.forEach(po => {
          const projectId = po._id.projectId;
          
          if (!projectsMap[projectId]) {
            projectsMap[projectId] = {
              projectId: projectId,
              openPOs: [],
              totalPOValue: 0,
              totalOpenValue: 0,
              openPOCount: 0
            };
          }

          // Add PO to project
          const poData = {
            ponum: po._id.ponumber,
            podate: po["po-date"],
            "delivery-date": po["delivery-date"],
            vendorcode: po.vendorcode,
            vendorname: po.vendorname,
            poval: po.poval,
            balgrval: po.balgrval,
            materialDocs: materialDocsByPO[po._id.ponumber] || []
          };

          projectsMap[projectId].openPOs.push(poData);
          projectsMap[projectId].totalPOValue += po.poval;
          projectsMap[projectId].totalOpenValue += po.balgrval;
          projectsMap[projectId].openPOCount += 1;
        });

        // Convert to array and get project details
        const projectsArray = Object.values(projectsMap);

        // Fetch project names from projects collection
        const projectIds = projectsArray.map(p => p.projectId);
        let projectsInfo = [];
        
        if (projectIds.length > 0) {
          // Build regex pattern for matching project WBS
          const regexPatterns = projectIds.map(id => 
            new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
          );
          
          projectsInfo = await db
            .collection("projects")
            .find({
              $or: projectIds.map(id => ({
                "project-wbs": { $regex: `^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` }
              }))
            })
            .toArray();
        }

        // Create a map of project WBS to project name
        const projectInfoMap = {};
        projectsInfo.forEach(proj => {
          const wbs = proj["project-wbs"];
          if (wbs) {
            const projId = wbs.substring(0, 12);
            if (!projectInfoMap[projId]) {
              projectInfoMap[projId] = {
                projectName: proj["project-name"] || "",
                projectWbs: proj["project-wbs"] || ""
              };
            }
          }
        });

        // Add project names to results
        const result = projectsArray.map(proj => ({
          ...proj,
          projectName: projectInfoMap[proj.projectId]?.projectName || "",
          projectWbs: projectInfoMap[proj.projectId]?.projectWbs || proj.projectId
        }));

        // Calculate totals
        const totals = {
          totalProjects: result.length,
          totalPOs: purchaseOrders.length,
          totalPOValue: result.reduce((sum, p) => sum + p.totalPOValue, 0),
          totalOpenValue: result.reduce((sum, p) => sum + p.totalOpenValue, 0)
        };

        return res.json({
          projects: result,
          totals: totals
        });
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log("Error in openprojects API:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export default handler;
