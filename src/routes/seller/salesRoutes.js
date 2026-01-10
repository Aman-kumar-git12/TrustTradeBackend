const express = require('express');
const router = express.Router();
const { createSale, deleteSale, getBuyerOrders } = require('../../controllers/seller/salesController');
const { protect } = require('../../middleware/authMiddleware');

router.get('/buyer', protect, getBuyerOrders);
router.post('/', createSale); // Changed from /sales to /
router.delete('/:id', protect, deleteSale);

module.exports = router;
