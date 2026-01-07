const Business = require('../models/Business');

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
    const { businessName, imageUrl, location, description } = req.body;

    if (!businessName || !location || !location.city || !location.place || !description) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    try {
        // limit check
        const count = await Business.countDocuments({ owner: req.user._id });
        if (count >= 4) {
            return res.status(400).json({ message: 'Maximum 4 businesses allowed per account' });
        }

        const business = await Business.create({
            owner: req.user._id,
            businessName,
            imageUrl,
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

        // Check user ownership
        if (business.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

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

        // Check user ownership
        if (business.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await business.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getMyBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness
};
