const Business = require('../../models/Business');
const { protect } = require('../../middleware/authMiddleware');

const checkBusinessAccess = async (req, res, next) => {
    try {
        const { businessId } = req.params;

        // Check if business exists and user is owner
        const business = await Business.findOne({ _id: businessId, owner: req.user._id });

        if (!business) {
            return res.status(404).json({ message: 'Business not found or unauthorized' });
        }

        req.business = business;
        next();
    } catch (error) {
        console.error('Business Access Middleware Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    protect,
    checkBusinessAccess
};
