const express = require('express');
const router = express.Router()
const newEntryController = require('../controllers/newEntryControllers');

router.post('/',newEntryController.handleNewEntry);

module.exports = router;