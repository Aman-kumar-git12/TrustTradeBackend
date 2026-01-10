const express = require('express');
const router = express.Router();
const { getHomeStats } = require('../controllers/homeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getHomeStats);

module.exports = router;
