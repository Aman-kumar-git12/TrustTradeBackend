const express = require('express');
const router = express.Router();
const {
    submitQuery,
    getMyQueries,
    getAllQueries,
    updateQuery,
    deleteQuery
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.post('/', protect, submitQuery);
router.get('/my-queries', protect, getMyQueries);

// Admin routes
router.get('/admin/all', protect, admin, getAllQueries);
router.put('/admin/:id', protect, admin, updateQuery);
router.delete('/admin/:id', protect, admin, deleteQuery);

module.exports = router;
