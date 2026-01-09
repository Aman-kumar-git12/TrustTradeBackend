const express = require('express');
const router = express.Router();
const {
    getOverview24h,
    getOverview15d,
    getOverview1m,
    getOverview1y,
    getOverviewAll,
    getProductPerformance,
    getCustomerInsights,
    getProductAnalytics,
    getProductAnalytics30d,
    getProductAnalyticsAll
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:businessId/overview/24h', protect, getOverview24h);
router.get('/:businessId/overview/15d', protect, getOverview15d);
router.get('/:businessId/overview/1m', protect, getOverview1m);
router.get('/:businessId/overview/1y', protect, getOverview1y);
router.get('/:businessId/overview/all', protect, getOverviewAll);

router.get('/:businessId/products', protect, getProductPerformance);
router.get('/:businessId/customers', protect, getCustomerInsights);
router.get('/product/:assetId', protect, getProductAnalytics);
router.get('/product/:assetId/30d', protect, getProductAnalytics30d); // Added
router.get('/product/:assetId/all', protect, getProductAnalyticsAll); // Added

module.exports = router;
