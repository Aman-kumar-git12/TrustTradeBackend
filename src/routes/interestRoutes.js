const express = require('express');
const router = express.Router();
const {
    createInterest,
    getBuyerInterests,
    getSellerLeads,
    updateInterestStatus,
    deleteInterest
} = require('../controllers/interestController');
const { protect } = require('../middleware/interestMiddleware');

router.post('/', protect, createInterest);
router.get('/buyer', protect, getBuyerInterests);
router.get('/seller', protect, getSellerLeads);
router.put('/:id/status', protect, updateInterestStatus);
router.delete('/:id', protect, deleteInterest);

module.exports = router;
