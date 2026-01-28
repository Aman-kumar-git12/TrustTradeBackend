const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllSales,
    getSaleById,
    updateOrderStatus,
    getAllUsers,
    updateUserRole,
    updateFeaturedEvent,
    getFeaturedEvent,
    getAdminStats
} = require('../controllers/adminController');

// Public route to get the featured event for Home page
router.get('/event', getFeaturedEvent);

// Admin protected routes

router.get('/sales', protect, admin, getAllSales);
router.get('/sales/:id', protect, admin, getSaleById);
router.put('/sales/:id/status', protect, admin, updateOrderStatus);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.post('/event', protect, admin, updateFeaturedEvent);
router.get('/stats', protect, admin, getAdminStats);

module.exports = router;
