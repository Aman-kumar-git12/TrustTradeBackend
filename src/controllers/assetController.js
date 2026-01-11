const Asset = require('../models/Asset');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Public
// @desc    Get all assets with filtering
// @route   GET /api/assets
// @access  Public
const getAssets = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, condition } = req.query;

        let query = { status: 'active' };

        // Category Filter
        if (category) {
            query.category = category;
        }

        // Condition Filter
        if (condition) {
            query.condition = condition;
        }

        // Search Filter (Title or Description)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Price Filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let assets = await Asset.find(query)
            .populate('seller', 'fullName companyName');

        // Randomize order
        for (let i = assets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [assets[i], assets[j]] = [assets[j], assets[i]];
        }

        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Public
const getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('seller', 'fullName companyName email');

        if (asset) {
            res.status(200).json(asset);
        } else {
            res.status(404).json({ message: 'Asset not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private/Seller
const createAsset = async (req, res) => {
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: 'Only sellers can create assets' });
    }

    const {
        title,
        description,
        category,
        condition,
        price,
        location,
        images
    } = req.body;

    try {
        const asset = new Asset({
            seller: req.user._id,
            business: req.body.businessId || null,
            title,
            description,
            category,
            condition,
            price,
            location,
            images,
            status: 'active'
        });

        const createdAsset = await asset.save();
        res.status(201).json(createdAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get logged in user's listings
// @route   GET /api/assets/my-listings
// @access  Private/Seller
const getMyListings = async (req, res) => {
    try {
        const assets = await Asset.find({ seller: req.user._id });
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const AssetView = require('../models/AssetView');

// @desc    Record a view for an asset
// @route   POST /api/assets/:id/view
// @access  Public
const recordAssetView = async (req, res) => {
    try {
        const assetId = req.params.id;
        const userId = req.user ? req.user._id : null; // Can be null if guest
        const ip = req.ip || req.connection.remoteAddress;

        // Check if there is already a view record for this (Asset + User/IP)
        // Since we have a TTL index on `viewedAt`, old records disappear automatically.
        // We just need to check if one exists > it means we are in the "timeout" window.

        const query = { asset: assetId, ip: ip };
        if (userId) {
            query.viewer = userId;
        }

        const existingView = await AssetView.findOne(query);

        if (existingView) {
            // Already viewed in the last hour
            const currentAsset = await Asset.findById(assetId).select('views');
            return res.status(200).json({ views: currentAsset ? currentAsset.views : 0 });
        }

        // No recent view found -> Record it
        await AssetView.create({
            asset: assetId,
            viewer: userId,
            ip: ip
        });

        // Increment asset view count
        const updatedAsset = await Asset.findByIdAndUpdate(
            assetId,
            { $inc: { views: 1 } },
            { new: true }
        ).select('views');

        res.status(200).json({ views: updatedAsset.views });

    } catch (error) {
        console.error("Error recording view:", error);
        res.status(500).json({ message: "Failed to record view" });
    }
};

module.exports = {
    getAssets,
    getAssetById,
    createAsset,
    getMyListings,
    recordAssetView
};
