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
const { authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, createInterest);
router.get('/me', protect, getBuyerInterests);
router.get('/seller', protect, authorizeRoles('seller'), getSellerLeads);
router.put('/:id/status', protect, authorizeRoles('seller'), updateInterestStatus);
router.delete('/:id', protect, deleteInterest);

module.exports = router;
