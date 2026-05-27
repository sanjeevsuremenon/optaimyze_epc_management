import { getServerSession } from "next-auth";
import { authOptions } from "./[...nextauth]";
import { connectToDatabase } from "../../../lib/mongoconnect";
import bcrypt from "bcrypt";

const PASSWORD_POLICY = {
  minLength: 8,
  requiresNumber: true,
  requiresSpecial: true,
};

function validatePasswordPolicy(password) {
  if (typeof password !== "string") return false;
  if (password.length < PASSWORD_POLICY.minLength) return false;
  if (PASSWORD_POLICY.requiresNumber && !/[0-9]/.test(password)) return false;
  if (PASSWORD_POLICY.requiresSpecial && !/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\/;']/ .test(password)) return false;
  return true;
}

async function verifyCurrentPassword(storedPassword, candidatePassword) {
  if (!storedPassword) return false;
  // Try bcrypt first
  try {
    const ok = await bcrypt.compare(candidatePassword, storedPassword);
    if (ok) return true;
  } catch (e) {
    // ignore
  }
  // Fallback plaintext match for legacy users
  return storedPassword === candidatePassword;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!validatePasswordPolicy(newPassword)) {
    return res.status(400).json({
      error: "Password must be at least 8 chars, include a number and a special character",
    });
  }

  const { db } = await connectToDatabase();
  const email = session.user.email;
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const ok = await verifyCurrentPassword(user.password, currentPassword);
  if (!ok) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  const saltRounds = 10;
  const hashed = await bcrypt.hash(newPassword, saltRounds);

  await db.collection("users").updateOne(
    { email },
    { $set: { password: hashed, passwordUpdatedAt: new Date() } }
  );

  return res.status(200).json({ success: true });
}


