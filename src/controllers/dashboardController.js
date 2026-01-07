const Asset = require('../models/Asset');
const Interest = require('../models/Interest');
const Sales = require('../models/Sales');
const mongoose = require('mongoose');

// @desc    Get Seller Dashboard Statistics
// @route   GET /api/dashboard/seller
// @access  Private/Seller
const getSellerDashboardStats = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // 1. Asset Performance
        const assets = await Asset.find({ seller: sellerId });
        const totalViews = assets.reduce((acc, curr) => acc + (curr.views || 0), 0);

        const totalInterests = await Interest.countDocuments({ seller: sellerId });

        // Conversion Rate: (Interests / Views) * 100
        const conversionRate = totalViews > 0 ? ((totalInterests / totalViews) * 100).toFixed(1) : 0;

        // Final Selling Price Trend (Last 6 sales)
        const recentSales = await Sales.find({ seller: sellerId })
            .sort({ dealDate: -1 })
            .limit(6)
            .select('finalPrice dealDate');

        const sellingPriceTrend = recentSales.map(sale => ({
            date: sale.dealDate,
            price: sale.finalPrice
        })).reverse();


        // 2. Lead & Deal Insights
        const interests = await Interest.find({ seller: sellerId });
        const leads = {
            total: interests.length,
            accepted: interests.filter(i => i.status === 'accepted').length,
            rejected: interests.filter(i => i.status === 'rejected').length,
            pending: interests.filter(i => i.status === 'pending').length
        };

        const completedDeals = await Sales.countDocuments({ seller: sellerId, status: 'completed' });

        // Avg Negotiation Time (from Sales)
        // If Sales capture duration directly
        const salesWithDuration = await Sales.find({ seller: sellerId, negotiationDuration: { $exists: true } });
        const totalDuration = salesWithDuration.reduce((acc, curr) => acc + curr.negotiationDuration, 0);
        const avgNegotiationTime = salesWithDuration.length > 0 ? (totalDuration / salesWithDuration.length).toFixed(1) : 0;


        // 3. Business Health
        // Monthly Performance (Sales count by month)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySales = await Sales.aggregate([
            {
                $match: {
                    seller: new mongoose.Types.ObjectId(sellerId),
                    dealDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: "$dealDate" },
                    count: { $sum: 1 },
                    revenue: { $sum: "$finalPrice" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Best Performing Category (by Interests received)
        // Need to aggregate Interests -> Asset -> Category
        // This is complex, easier to fetch Assets and map interests since we have assets array
        const assetInterests = await Interest.aggregate([
            { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
            {
                $lookup: {
                    from: 'assets',
                    localField: 'asset',
                    foreignField: '_id',
                    as: 'assetDetails'
                }
            },
            { $unwind: '$assetDetails' },
            {
                $group: {
                    _id: '$assetDetails.category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const bestPerformingCategory = assetInterests.length > 0 ? assetInterests[0]._id : 'N/A';

        res.status(200).json({
            assetPerformance: {
                totalViews,
                totalInterests,
                conversionRate,
                sellingPriceTrend
            },
            leadInsights: {
                leads,
                completedDeals,
                avgNegotiationTime,
                // buyerDistribution placeholder (complex to get city from user -> address)
            },
            businessHealth: {
                monthlySales, // [{ _id: monthNum, count, revenue }]
                bestPerformingCategory
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSellerDashboardStats
};
