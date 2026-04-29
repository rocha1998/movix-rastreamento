const express = require('express');
const controller = require('../controllers/adminTrackingController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/', controller.listTrackings);
router.get('/:id', controller.getTracking);
router.post('/', controller.createTracking);
router.put('/:id', controller.updateTracking);
router.delete('/:id', controller.deleteTracking);
router.patch('/:id/status', controller.updateTrackingStatus);

module.exports = router;
