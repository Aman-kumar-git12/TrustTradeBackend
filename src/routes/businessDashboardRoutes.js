const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getBusinessStats,
    getBusinessAssets,
    getBusinessLeads
} = require('../controllers/businessDashboardController');

router.get('/:businessId/stats', protect, getBusinessStats);
router.get('/:businessId/assets', protect, getBusinessAssets);
router.get('/:businessId/leads', protect, getBusinessLeads);

module.exports = router;
