const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllSales,
    getSaleById,
    updateOrderStatus,
    getAllUsers,
    updateUserRole,
    updateUser,
    getUserAssets,
    getUserLeads,
    getUserOrders,

    getFeaturedEvent,
    getAdminStats,
    toggleAssetStatus,
    getAllBusinesses,
    getBusinessById,
    getBusinessProducts,
    getRecentActivity
} = require('../controllers/adminController');

// Public route to get the featured event for Home page
router.get('/event', getFeaturedEvent);

// Admin protected routes

router.get('/sales', protect, admin, getAllSales);
router.get('/sales/:id', protect, admin, getSaleById);
router.put('/sales/:id/status', protect, admin, updateOrderStatus);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.put('/users/:id', protect, admin, updateUser);
router.get('/users/:id/listings', protect, admin, getUserAssets);
router.get('/users/:id/leads', protect, admin, getUserLeads);
router.get('/users/:id/orders', protect, admin, getUserOrders);

router.get('/stats', protect, admin, getAdminStats);
router.put('/assets/:id/toggle-status', protect, admin, toggleAssetStatus);
router.get('/businesses', protect, admin, getAllBusinesses);
router.get('/businesses/:id', protect, admin, getBusinessById);
router.get('/businesses/:id/products', protect, admin, getBusinessProducts);
router.get('/activity', protect, admin, getRecentActivity);

module.exports = router;
