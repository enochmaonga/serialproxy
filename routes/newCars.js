const express = require('express');
const router = express.Router();
const newCarsControllers = require('../controllers/newCarsControllers');

// Public endpoint: Anyone can issue airtime without login
router.post('/', newCarsControllers.handleNewCars);

module.exports = router;