const express = require('express');
const router = express.Router();
const newCarsControllers = require('../controllers/newCarsControllers');
const verifyJWT = require('../middleware/verifyJWT');

// Any authenticated user (admin or regular issuer) can issue airtime
router.post('/', verifyJWT, newCarsControllers.handleNewCars);

module.exports = router;