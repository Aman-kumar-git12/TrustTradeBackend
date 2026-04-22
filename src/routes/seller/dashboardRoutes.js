const express = require('express');
const router = express.Router();
const { protect, checkBusinessAccess } = require('../../middleware/seller/dashboardMiddleware');
const { authorizeRoles } = require('../../middleware/authMiddleware');
const {
    getBusinessStats,
    getBusinessAssets,
    getBusinessLeads
} = require('../../controllers/seller/dashboardController');

router.get('/:businessId/stats', protect, authorizeRoles('seller'), checkBusinessAccess, getBusinessStats);
router.get('/:businessId/assets', protect, authorizeRoles('seller'), checkBusinessAccess, getBusinessAssets);
router.get('/:businessId/leads', protect, authorizeRoles('seller'), checkBusinessAccess, getBusinessLeads);

module.exports = router;
