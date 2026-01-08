const Asset = require('../models/Asset');
const Interest = require('../models/Interest');
const Business = require('../models/Business');
const Sales = require('../models/Sales');

// @desc    Get dashboard stats for a specific business
// @route   GET /api/dashboard/business/:businessId/stats
// @access  Private (Seller only, owner only)
const getBusinessStats = async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify ownership
        const business = await Business.findOne({ _id: businessId, owner: req.user._id });
        if (!business) {
            return res.status(404).json({ message: 'Business not found or unauthorized' });
        }

        const assets = await Asset.find({ business: businessId });
        const assetIds = assets.map(a => a._id);

        const activeAssets = assets.filter(a => a.status === 'active').length;
        const totalViews = assets.reduce((acc, curr) => acc + (curr.views || 0), 0);

        const totalLeads = await Interest.countDocuments({ asset: { $in: assetIds } });
        const pendingLeads = await Interest.countDocuments({ asset: { $in: assetIds }, status: 'pending' });

        // Lead Insights
        const acceptedLeads = await Interest.countDocuments({ asset: { $in: assetIds }, status: 'accepted' });

        // Sales logic
        // Find sales where the asset belongs to this business
        // Since Sales -> Asset, and Asset -> Business
        const sales = await Sales.find().populate({
            path: 'asset',
            match: { business: businessId }
        });

        // Filter out null assets (where match failed)
        const businessSales = sales.filter(s => s.asset !== null);

        const completedDeals = businessSales.length;

        // Monthly Sales for chart
        const monthlySales = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize last 6 months
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            monthlySales.push({
                _id: monthNames[d.getMonth()],
                year: d.getFullYear(),
                count: 0,
                revenue: 0,
                monthIndex: d.getMonth()
            });
        }

        businessSales.forEach(sale => {
            const saleDate = new Date(sale.dealDate);
            const monthIndex = saleDate.getMonth();
            const year = saleDate.getFullYear();

            const monthStat = monthlySales.find(m => m.monthIndex === monthIndex && m.year === year);
            if (monthStat) {
                monthStat.count += 1;
                monthStat.revenue += sale.finalPrice;
            }
        });

        res.json({
            activeAssets,
            totalViews, // Asset Performance -> Total Views
            totalLeads, // Lead Insights -> Total Leads
            pendingLeads,
            // Expanded stats for complex dashboard
            assetPerformance: {
                totalViews,
                totalInterests: totalLeads,
                conversionRate: totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : 0,
                sellingPriceTrend: businessSales.map(s => ({
                    date: s.dealDate,
                    price: s.finalPrice
                })).sort((a, b) => new Date(a.date) - new Date(b.date))
            },
            leadInsights: {
                leads: {
                    total: totalLeads,
                    accepted: acceptedLeads
                },
                completedDeals,
                avgNegotiationTime: 24 // Mocked for now, or calculate from Sales.negotiationDuration
            },
            businessHealth: {
                bestPerformingCategory: 'IT Hardware', // Logic could be added to find mode of category in sales
                monthlySales
            }
        });
    } catch (error) {
        console.error('Error fetching business stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get assets for written business
// @route   GET /api/dashboard/business/:businessId/assets
// @access  Private
const getBusinessAssets = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { status, search, category, minPrice, maxPrice } = req.query;

        // Verify ownership
        const business = await Business.findOne({ _id: businessId, owner: req.user._id });
        if (!business) {
            return res.status(404).json({ message: 'Business not found or unauthorized' });
        }

        let query = { business: businessId };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const assets = await Asset.find(query).sort({ createdAt: -1 });
        res.json(assets);
    } catch (error) {
        console.error('Error fetching business assets:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get leads for a specific business
// @route   GET /api/dashboard/business/:businessId/leads
// @access  Private
const getBusinessLeads = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { status, search } = req.query;

        // Verify ownership (indirectly via business assets)
        const business = await Business.findOne({ _id: businessId, owner: req.user._id });
        if (!business) {
            return res.status(404).json({ message: 'Business not found or unauthorized' });
        }

        // Find all assets belonging to this business
        const assets = await Asset.find({ business: businessId }).select('_id');
        const assetIds = assets.map(a => a._id);

        let query = { asset: { $in: assetIds } };

        if (status) {
            query.status = status;
        }

        // Search logic for leads (search by buyer name or asset title)
        // This is complex because Interest references Asset and User. 
        // Simple implementation: Fetch all matching leads then filter in memory or aggregation?
        // Aggregation is better for performance but complexity.
        // Let's stick to population and basic filtering for now or simple pipeline.

        let leads = await Interest.find(query)
            .populate('asset', 'title business')
            .populate('buyer', 'fullName email companyName phone')
            .sort({ createdAt: -1 });

        // Filter by search term if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            leads = leads.filter(lead =>
                searchRegex.test(lead.asset?.title) ||
                searchRegex.test(lead.buyer?.fullName) ||
                searchRegex.test(lead.buyer?.companyName)
            );
        }

        res.json(leads);

    } catch (error) {
        console.error('Error fetching business leads:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getBusinessStats,
    getBusinessAssets,
    getBusinessLeads
};
