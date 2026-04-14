import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "development-secret";

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
