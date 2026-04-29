const express = require('express');
const { lookupTracking } = require('../controllers/publicTrackingController');

const router = express.Router();

router.post('/lookup', lookupTracking);

module.exports = router;
