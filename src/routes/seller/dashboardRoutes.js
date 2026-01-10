const express = require('express');
const router = express.Router();
const { protect, checkBusinessAccess } = require('../../middleware/seller/dashboardMiddleware');
const {
    getBusinessStats,
    getBusinessAssets,
    getBusinessLeads
} = require('../../controllers/seller/dashboardController');

router.get('/:businessId/stats', protect, checkBusinessAccess, getBusinessStats);
router.get('/:businessId/assets', protect, checkBusinessAccess, getBusinessAssets);
router.get('/:businessId/leads', protect, checkBusinessAccess, getBusinessLeads);

module.exports = router;
