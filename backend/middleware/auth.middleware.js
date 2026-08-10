import { verifyToken } from "../utils/generateToken.js";

export function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // If no token or public API, allow pass-through or set user if token provided
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = null;
    return next();
  }

  req.user = decoded;
  next();
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}
