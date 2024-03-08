const express = require('express');
const router = express.Router()
const deactivateController = require('../controllers/deactivateController');

router.post('/:userId', deactivateController.handleDeactivateUser);

module.exports = router;