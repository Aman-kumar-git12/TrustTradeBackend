const express = require('express');
const router = express.Router();
const { getMyBusinesses, createBusiness, updateBusiness, deleteBusiness } = require('../controllers/businessController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMyBusinesses)
    .post(protect, createBusiness);

router.route('/:id')
    .put(protect, updateBusiness)
    .delete(protect, deleteBusiness);

module.exports = router;
