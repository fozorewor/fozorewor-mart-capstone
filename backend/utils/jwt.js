import jwt from "jsonwebtoken";

// WHY (Functionality): production must require an explicit secret so auth
// tokens stay consistent and valid across deploys instead of using defaults.
const JWT_SECRET =
  process.env.JWT_SECRET ??
  (process.env.NODE_ENV === "production" ? null : "development-secret");

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production.");
}

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
