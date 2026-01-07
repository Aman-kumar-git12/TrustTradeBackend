const express = require('express');
const router = express.Router();
const { getSellerDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/seller', protect, getSellerDashboardStats);

module.exports = router;
