const express = require('express');
const router = express.Router();
const {
    getAssets,
    getAssetById,
    createAsset,
    recordAssetView
} = require('../controllers/assetController');
const {
    getSellerAssets,
    updateAssetStatus,
    deleteAsset,
    getSellerAssetDetails,
    updateAsset
} = require('../controllers/seller/assetController');
const { protect } = require('../middleware/assetMiddleware');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAssets)
    .post(protect, authorizeRoles('seller'), createAsset);

// Seller Management Routes
router.route('/my-listings').get(protect, authorizeRoles('seller'), getSellerAssets);
router.route('/my-listings/:id')
    .get(protect, authorizeRoles('seller'), getSellerAssetDetails)
    .put(protect, authorizeRoles('seller'), updateAsset); // Add PUT for update

// View Count Route - Public (Rate limited by controller)
router.route('/:id/view').post(recordAssetView);

router.route('/:id/status').put((req, res, next) => {
    console.log("Asset Route HIT for PUT status. ID:", req.params.id);
    next();
}, protect, authorizeRoles('seller'), updateAssetStatus); // Changed to PATCH
router.route('/:id').delete(protect, authorizeRoles('seller'), deleteAsset).get(getAssetById);

module.exports = router;
