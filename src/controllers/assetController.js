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

        const assets = await Asset.find(query)
            .populate('seller', 'fullName companyName')
            .sort({ createdAt: -1 }); // Newest first

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

module.exports = {
    getAssets,
    getAssetById,
    createAsset,
    getMyListings,
};
