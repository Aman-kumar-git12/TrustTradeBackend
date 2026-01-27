const Sales = require('../models/Sale');
const Asset = require('../models/Asset');
const Business = require('../models/Business');

// @desc    Get Home Page Stats (Top Market Leader, Trending, etc.)
// @route   GET /api/home/stats
// @access  Private
const getHomeStats = async (req, res) => {
    try {
        // 1. Top Market Leader (Business with Max Profit in Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topBusinessAgg = await Sales.aggregate([
            {
                $match: {
                    dealDate: { $gte: thirtyDaysAgo },
                    status: 'sold'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'seller',
                    foreignField: '_id',
                    as: 'sellerDetails'
                }
            },
            { $unwind: '$sellerDetails' },
            {
                $group: {
                    _id: '$seller', // Group by Seller User ID
                    sellerName: { $first: '$sellerDetails.name' },
                    totalProfit: { $sum: '$totalAmount' }
                }
            },
            { $sort: { totalProfit: -1 } },
            { $limit: 1 }
        ]);

        let topMarket = null;
        if (topBusinessAgg.length > 0) {
            // Try to find if this seller has a Business Profile
            const business = await Business.findOne({ owner: topBusinessAgg[0]._id });
            topMarket = {
                name: business ? business.businessName : topBusinessAgg[0].sellerName, // Use Business Name if exists, else Seller Name
                profit: topBusinessAgg[0].totalProfit,
                _id: business ? business._id : null, // Add Business ID if exists
                sellerId: topBusinessAgg[0]._id // Add Seller ID as fallback or main reference
            };
        }

        // 2. Trending Assets (Most Viewed)
        const trendingAssets = await Asset.find({ status: 'active' })
            .sort({ views: -1 })
            .limit(5)
            .lean();

        // 3. Just Added (New Arrivals)
        const newArrivals = await Asset.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            topMarket,
            trendingAssets,
            newArrivals
        });

    } catch (error) {
        console.error('Error fetching home stats:', error);
        res.status(500).json({ message: 'Server Error fetching home stats' });
    }
};

module.exports = { getHomeStats };
