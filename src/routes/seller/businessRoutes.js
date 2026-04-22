const express = require('express');
const router = express.Router();
const { getMyBusinesses, createBusiness, updateBusiness, deleteBusiness, getBusinessById, getBusinessAssets } = require('../../controllers/seller/businessController');
const { protect, checkBusinessOwner, checkBusinessLimit } = require('../../middleware/seller/businessMiddleware');
const { authorizeRoles } = require('../../middleware/authMiddleware');

router.route('/')
    .get(protect, authorizeRoles('seller'), getMyBusinesses)
    .post(protect, authorizeRoles('seller'), checkBusinessLimit, createBusiness);

router.route('/:id')
    .get(getBusinessById)
    .put(protect, authorizeRoles('seller'), checkBusinessOwner, updateBusiness)
    .delete(protect, authorizeRoles('seller'), checkBusinessOwner, deleteBusiness);

router.route('/:id/assets')
    .get(getBusinessAssets);

module.exports = router;
