const { MongoClient } = require("mongodb");

async function run() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("mmportal");
    const doc = await db.collection("materialdocuments").findOne({});
    console.log("Document structure:", JSON.stringify(doc, null, 2));
    
    // Check types
    console.log("Type of po-number:", typeof doc["po-number"]);
    console.log("Type of material-code:", typeof doc["material-code"]);
    console.log("Type of account.wbs:", typeof doc.account?.wbs);
    
    // Test the regex query
    const regex = new RegExp("porta", "i");
    const testDocs = await db.collection("materialdocuments").find({ "material-text": regex }).limit(1).toArray();
    console.log("Docs found with 'porta':", testDocs.length);

    // Test a PO number regex if po-number is numeric
    const poRegex = new RegExp("4500", "i");
    const testPoDocs = await db.collection("materialdocuments").find({ "po-number": poRegex }).limit(1).toArray();
    console.log("Docs found with PO '4500':", testPoDocs.length);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
