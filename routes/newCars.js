const express = require('express');
const router = express.Router()
const newCarsControllers = require('../controllers/newCarsControllers');

router.post('/',newCarsControllers.handleNewCars);

module.exports = router;