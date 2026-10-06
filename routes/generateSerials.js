const express = require("express");
const router = express.Router();
const generateSerialsController = require("../controllers/generateSerialsController");
const verifyJWT = require("../middleware/verifyJWT");
const requireAdmin = require("../middleware/requireAdmin");

// Only Admin can upload / generate new serials
router.post("/", verifyJWT, requireAdmin, generateSerialsController.generateSerials);

// Authenticated users (admin & regular users) can pick/issue serials
router.post("/pick", verifyJWT, generateSerialsController.pickSerial);

module.exports = router;
