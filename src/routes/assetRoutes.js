const express = require('express');
const router = express.Router();
const {
    getAssets,
    getAssetById,
    createAsset,
    getMyListings,
} = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAssets)
    .post(protect, createAsset);

router.route('/my-listings').get(protect, getMyListings);

router.route('/:id').get(getAssetById);

module.exports = router;
