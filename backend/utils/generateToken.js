import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rice_shop_super_secret_jwt_key_2026";

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
