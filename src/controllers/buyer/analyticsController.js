const buyerAnalyticsService = require('../../services/analytics/buyerAnalyticsService');

// @desc    Get Buyer Overview Analytics
// @route   GET /api/analytics/buyer/overview/:range
// @access  Private/Buyer
const getBuyerOverview = async (req, res) => {
    try {
        const { range } = req.params;
        const buyerId = req.user._id;

        const data = await buyerAnalyticsService.getBuyerOverview(buyerId, range);
        res.json(data);
    } catch (error) {
        console.error("Buyer Analytics Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getBuyerOverview
};
