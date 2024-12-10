const express = require("express");
const router = express.Router();
const assignSerialController = require("../controllers/assignSerialController");

router.post("/", assignSerialController.selectSerialAndMoveToAirtime);

module.exports = router;
