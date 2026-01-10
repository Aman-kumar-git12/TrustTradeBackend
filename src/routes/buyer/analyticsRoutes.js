const express = require('express');
const router = express.Router();
const { getBuyerOverview } = require('../../controllers/buyer/analyticsController');
const { protect } = require('../../middleware/authMiddleware');

router.get('/overview/:range', protect, getBuyerOverview);

module.exports = router;
