const express = require('express');
const router = express.Router();
const {
    getAssets,
    getAssetById,
    createAsset,
} = require('../controllers/assetController');
const {
    getSellerAssets,
    updateAssetStatus,
    deleteAsset,
    getSellerAssetDetails
} = require('../controllers/sellerAssetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAssets)
    .post(protect, createAsset);

// Seller Management Routes
router.route('/my-listings').get(protect, getSellerAssets);
router.route('/my-listings/:id').get(protect, getSellerAssetDetails);
router.route('/:id/status').put((req, res, next) => {
    console.log("Asset Route HIT for PATCH status. ID:", req.params.id);
    next();
}, protect, updateAssetStatus);
router.route('/:id').delete(protect, deleteAsset).get(getAssetById);

module.exports = router;
