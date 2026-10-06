/**
 * Express middleware to restrict access exclusively to users with 'admin' role.
 * Requires `verifyJWT` to run first to populate `req.user`.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Authentication required" });
  }

  const role = String(req.user.userType || req.user.role || "").trim().toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Administrator privileges required to access this resource",
      userType: req.user.userType,
    });
  }

  next();
};

module.exports = requireAdmin;
