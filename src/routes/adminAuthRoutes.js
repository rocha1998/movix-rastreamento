const express = require('express');
const { login, me } = require('../controllers/adminAuthController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', authMiddleware, me);

module.exports = router;
