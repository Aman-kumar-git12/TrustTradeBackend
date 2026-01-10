const Business = require('../../models/Business');
const { protect } = require('../../middleware/authMiddleware');

const checkBusinessOwner = async (req, res, next) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        if (business.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        req.business = business;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkBusinessLimit = async (req, res, next) => {
    try {
        const count = await Business.countDocuments({ owner: req.user._id });
        if (count >= 4) {
            return res.status(400).json({ message: 'Maximum 4 businesses allowed per account' });
        }
        next();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    protect,
    checkBusinessOwner,
    checkBusinessLimit
};
