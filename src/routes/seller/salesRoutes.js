const express = require('express');
const router = express.Router();
const { createSale, deleteSale, getBuyerOrders } = require('../../controllers/seller/salesController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

router.get('/me', protect, getBuyerOrders);
router.post('/', protect, authorizeRoles('seller'), createSale);
router.delete('/:id', protect, authorizeRoles('seller'), deleteSale);

module.exports = router;
