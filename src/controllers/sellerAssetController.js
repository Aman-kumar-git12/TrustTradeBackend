const Asset = require('../models/Asset');

// @desc    Get logged in seller's assets (with optional status filter)
// @route   GET /api/assets/my-listings
// @access  Private/Seller
const getSellerAssets = async (req, res) => {
    try {
        const { status, search, category, minPrice, maxPrice } = req.query;
        let query = { seller: req.user._id };

        if (status) {
            query.status = status;
        }

        // Search Filter (Title)
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Category Filter
        if (category) {
            query.category = category;
        }

        // Price Filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Return sorted by newest first
        const assets = await Asset.find(query).sort({ createdAt: -1 });
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch your listings', error: error.message });
    }
};

// @desc    Update asset status (activate/deactivate)
// @route   PATCH /api/assets/:id/status
// @access  Private/Seller
const updateAssetStatus = async (req, res) => {
    try {
        const { status } = req.body;
        console.log(`[Backend] updateAssetStatus CALLED. ID: ${req.params.id}, New Status: ${status}`);

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use "active" or "inactive".' });
        }

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Ensure user owns the asset
        if (asset.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this asset' });
        }

        asset.status = status;

        // Add to history (optional but good practice)
        if (!asset.statusHistory) {
            asset.statusHistory = [];
        }
        asset.statusHistory.push({ status, date: Date.now() });

        await asset.save();

        console.log(`[Backend] Asset ${asset._id} updated to ${status}`);
        res.status(200).json(asset);
    } catch (error) {
        console.error("Error updating asset status:", error);
        res.status(500).json({ message: 'Failed to update asset status', error: error.message });
    }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private/Seller
const getSellerAssetDetails = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Ensure user owns the asset
        if (asset.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to view this asset' });
        }

        res.status(200).json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch asset details', error: error.message });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Ensure user owns the asset
        if (asset.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this asset' });
        }

        await asset.deleteOne();
        res.status(200).json({ message: 'Asset removed' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete asset', error: error.message });
    }
};

module.exports = {
    getSellerAssets,
    updateAssetStatus,
    deleteAsset,
    getSellerAssetDetails
};
