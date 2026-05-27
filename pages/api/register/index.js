import bcrypt from "bcrypt";
import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { db } = await connectToDatabase();
  // handle different methods

  try {
    switch (req.method) {
      case "POST": {
        const data = req.body;
        const { email, password, name, role } = data;
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const trimmedName = String(name || "").trim();
        const normalizedRole = String(role || "user").trim().toLowerCase();

        if (!normalizedEmail || !password) {
          return res.status(400).json({ message: "Email and password are required." });
        }

        const existingUser = await db
          .collection("users")
          .findOne({ email: normalizedEmail });

        if (existingUser) {
          return res.status(409).json({ message: "Email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection("users").insertOne({
          email: normalizedEmail,
          password: hashedPassword,
          name: trimmedName,
          role: normalizedRole,
          createdAt: new Date(),
        });

        return res.status(201).json({ message: "success!" });
      }

      default:
        return res.status(405).json({ error: "Method not supported" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Unable to register user at this time." });
  }
};
export default handler;
