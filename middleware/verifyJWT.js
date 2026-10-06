const jwt = require("jsonwebtoken");

/**
 * Express middleware to verify JWT Authorization Bearer token
 */
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token format" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY || "default_jwt_secret";

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};

module.exports = verifyJWT;