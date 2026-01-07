const express = require('express');
const router = express.Router();
const {
    createInterest,
    getBuyerInterests,
    getSellerLeads,
    updateInterestStatus
} = require('../controllers/interestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createInterest);
router.get('/buyer', protect, getBuyerInterests);
router.get('/seller', protect, getSellerLeads);
router.put('/:id/status', protect, updateInterestStatus);

module.exports = router;
