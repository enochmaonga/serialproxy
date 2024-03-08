const express = require('express');
const router = express.Router()
const deleteController = require('../controllers/deleteController');

router.post('/:userId', deleteController.handleDeleteUser);

module.exports = router;