const Business = require('../../models/Business');
const Asset = require('../../models/Asset');

// @desc    Get my businesses
// @route   GET /api/businesses
// @access  Private
const getMyBusinesses = async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.user._id });
        res.status(200).json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new business
// @route   POST /api/businesses
// @access  Private
const createBusiness = async (req, res) => {
    const { businessName, images, location, description } = req.body;

    if (!businessName || !location || !location.city || !location.place || !description) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    try {
        // limit check handled by middleware

        const business = await Business.create({
            owner: req.user._id,
            businessName,
            images,
            location,
            description
        });

        res.status(201).json(business);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update business
// @route   PUT /api/businesses/:id
// @access  Private
const updateBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Check user ownership (handled by middleware)
        // if (business.owner.toString() !== req.user.id) {
        //     return res.status(401).json({ message: 'User not authorized' });
        // }

        const updatedBusiness = await Business.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedBusiness);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete business
// @route   DELETE /api/businesses/:id
// @access  Private
const deleteBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Check user ownership (handled by middleware)
        // if (business.owner.toString() !== req.user.id) {
        //     return res.status(401).json({ message: 'User not authorized' });
        // }

        await business.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get business by ID (Public)
// @route   GET /api/businesses/:id
// @access  Public
const getBusinessById = async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid business ID format' });
        }

        const business = await Business.findById(req.params.id).populate('owner', 'fullName avatarUrl email phone');

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        res.status(200).json(business);
    } catch (error) {
        console.error("Error in getBusinessById:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active assets for a specific business
// @route   GET /api/businesses/:id/assets
// @access  Public
const getBusinessAssets = async (req, res) => {
    try {
        const { limit = 12, page = 1 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const assets = await Asset.find({
            business: req.params.id,
            status: 'active'
        })
            .populate('seller', 'fullName companyName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessById,
    getBusinessAssets
};
