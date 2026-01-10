const express = require('express');
const router = express.Router();
const { getMyBusinesses, createBusiness, updateBusiness, deleteBusiness, getBusinessById, getBusinessAssets } = require('../../controllers/seller/businessController');
const { protect, checkBusinessOwner, checkBusinessLimit } = require('../../middleware/seller/businessMiddleware');

router.route('/')
    .get(protect, getMyBusinesses)
    .post(protect, checkBusinessLimit, createBusiness);

router.route('/:id')
    .get(getBusinessById)
    .put(protect, checkBusinessOwner, updateBusiness)
    .delete(protect, checkBusinessOwner, deleteBusiness);

router.route('/:id/assets')
    .get(getBusinessAssets);

module.exports = router;
