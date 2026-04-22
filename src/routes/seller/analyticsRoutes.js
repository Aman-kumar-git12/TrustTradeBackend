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
} = require('../../controllers/seller/analyticsController');
const { protect } = require('../../middleware/seller/analyticsMiddleware');
const { authorizeRoles } = require('../../middleware/authMiddleware');

router.get('/:businessId/overview/24h', protect, authorizeRoles('seller'), getOverview24h);
router.get('/:businessId/overview/15d', protect, authorizeRoles('seller'), getOverview15d);
router.get('/:businessId/overview/1m', protect, authorizeRoles('seller'), getOverview1m);
router.get('/:businessId/overview/1y', protect, authorizeRoles('seller'), getOverview1y);
router.get('/:businessId/overview/all', protect, authorizeRoles('seller'), getOverviewAll);

router.get('/:businessId/products', protect, authorizeRoles('seller'), getProductPerformance);
router.get('/:businessId/customers', protect, authorizeRoles('seller'), getCustomerInsights);
router.get('/product/:assetId', protect, authorizeRoles('seller'), getProductAnalytics);
router.get('/product/:assetId/30d', protect, authorizeRoles('seller'), getProductAnalytics30d); // Added
router.get('/product/:assetId/all', protect, authorizeRoles('seller'), getProductAnalyticsAll); // Added

module.exports = router;
