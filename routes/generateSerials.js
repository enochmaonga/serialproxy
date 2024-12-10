const express = require("express");
const router = express.Router();
const generateSerialsController = require("../controllers/generateSerialsController");

router.post("/", generateSerialsController.generateSerials);
router.post("/pick", generateSerialsController.pickSerial);

module.exports = router;
