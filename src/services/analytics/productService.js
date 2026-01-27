const Sales = require('../../models/Sale');
const Asset = require('../../models/Asset');
const Interest = require('../../models/Interest');

const getAllPerformance = async (businessId, sortBy = 'createdAt', order = 'desc') => {
    const assets = await Asset.find({ business: businessId });
    const assetIds = assets.map(a => a._id);

    // Fetch all sales for these assets
    const sales = await Sales.find({ asset: { $in: assetIds }, isDeleted: { $ne: true } }).populate('asset');
    const interests = await Interest.find({ asset: { $in: assetIds } });

    const products = assets.map(asset => {
        const assetSale = sales.find(s => s.asset._id.toString() === asset._id.toString());
        const assetInterests = interests.filter(i => i.asset.toString() === asset._id.toString());

        let negotiationDays = null;
        if (assetSale) {
            const winningInterest = assetInterests.find(i => i.buyer.toString() === assetSale.buyer.toString());
            if (winningInterest) {
                const created = new Date(winningInterest.createdAt);
                const sold = new Date(assetSale.dealDate || assetSale.createdAt);
                negotiationDays = Math.max(0, Math.ceil((sold - created) / (1000 * 60 * 60 * 24)));
            } else {
                negotiationDays = 0; // Default if interest not found
            }
        }

        const soldPrice = assetSale ? (assetSale.price || assetSale.totalAmount) : null;
        const profit = soldPrice ? (soldPrice - (asset.costPrice || 0)) : null;
        const margin = soldPrice ? ((profit / soldPrice) * 100) : null;

        return {
            id: asset._id,
            title: asset.title,
            category: asset.category,
            status: asset.status === 'active' ? 'Active' : 'Inactive',
            views: asset.views || 0,
            listingPrice: asset.price,
            costPrice: asset.costPrice || 0,
            soldPrice: soldPrice,
            profit: profit,
            margin: margin ? parseFloat(margin.toFixed(1)) : null, // Ensure number for sorting
            negotiationDuration: negotiationDays,
            saleDate: assetSale ? (assetSale.dealDate || assetSale.createdAt) : null,
            createdAt: asset.createdAt // Ensure field exists for default sort
        };
    });

    // Sorting Logic
    if (sortBy) {
        products.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            // Specific handling for 'Active'/'Inactive' to maybe prioritize Active? 
            // Standard string sort is fine for now (Active < Inactive).

            // Handle nulls (treat as -Infinity so they go to bottom in DESC, top in ASC? 
            // Actually usually we want nulls at bottom regardless. 
            // Let's stick to standard behavior: 
            // If DESC (high to low): 100, 50, null. 
            // If ASC (low to high): null, 50, 100.
            if (valA === null || valA === undefined) return order === 'asc' ? -1 : 1;
            if (valB === null || valB === undefined) return order === 'asc' ? 1 : -1;

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return products;
};

const getDetails = async (assetId, range = 'all') => {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new Error('Asset not found');

    // Date Filter Logic
    let startDate = new Date(0);
    if (range === '30d') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch related data
    const sales = await Sales.find({
        asset: assetId,
        isDeleted: { $ne: true },
        dealDate: { $gte: startDate }
    }).sort({ dealDate: 1 });

    const interests = await Interest.find({
        asset: assetId,
        createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Market Benchmark: Avg sold price of category
    const marketSales = await Sales.find({
        isDeleted: { $ne: true },
        status: 'sold'
    }).populate({
        path: 'asset',
        match: { category: asset.category, _id: { $ne: asset._id } }
    });

    const validMarketSales = marketSales.filter(s => s.asset);
    const marketAvgPrice = validMarketSales.length > 0
        ? validMarketSales.reduce((sum, s) => sum + (s.price || s.totalAmount || 0), 0) / validMarketSales.length
        : asset.price;

    // Aggregate Sales Metrics
    // Aggregate Sales Metrics
    const totalOrders = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalCost = totalOrders * (asset.costPrice || 0);
    const totalProfit = totalRevenue - totalCost;
    const avgProfit = totalOrders > 0 ? Math.round(totalProfit / totalOrders) : 0;

    let totalTimeInterestToSold = 0;
    let totalTimeNegToSold = 0;
    let negotiatedSalesCount = 0;
    let totalNegotiatedPrice = 0;
    let dealsWithInterestCount = 0;

    sales.forEach(s => {
        if (s.dealDate) {
            // Find winning interest (approx)
            const winningInterest = interests.find(i => i.buyer.toString() === s.buyer.toString());

            if (winningInterest) {
                dealsWithInterestCount++;
                const interestDate = new Date(winningInterest.createdAt);
                const soldDate = new Date(s.dealDate);
                const diffTime = Math.max(0, soldDate - interestDate);
                totalTimeInterestToSold += diffTime;
            }

            // Negotiation stats (using schema field)
            if (s.negotiationDuration && s.negotiationDuration > 0) {
                // negotiationDuration is in days (float)
                totalTimeNegToSold += s.negotiationDuration;
                negotiatedSalesCount++;
                totalNegotiatedPrice += (s.totalAmount || 0);
            }
        }
    });

    const avgTimeToSell = totalOrders > 0
        ? Math.ceil(sales.reduce((acc, s) => acc + (new Date(s.dealDate) - new Date(asset.createdAt)), 0) / totalOrders / (1000 * 60 * 60 * 24))
        : 0;

    const avgTimeInterestToSold = dealsWithInterestCount > 0
        ? (totalTimeInterestToSold / dealsWithInterestCount / (1000 * 60 * 60 * 24))
        : 0;

    const avgTimeNegToSold = negotiatedSalesCount > 0
        ? (totalTimeNegToSold / negotiatedSalesCount)
        : 0;

    const avgNegotiatedFinalPrice = negotiatedSalesCount > 0
        ? Math.round(totalNegotiatedPrice / negotiatedSalesCount)
        : 0;

    // Negotiation Stats
    const passedNegotiations = negotiatedSalesCount;
    const failedNegotiations = interests.filter(i => i.status === 'rejected').length;

    // Deals per 100 Interests
    const totalInterests = interests.length;
    const dealsPer100 = totalInterests > 0 ? ((totalOrders / totalInterests) * 100).toFixed(1) : 0;

    // Interest Breakdown
    const pendingRequests = interests.filter(i => i.status === 'pending').length;
    const negotiatingRequests = interests.filter(i => i.status === 'negotiating').length;

    // Revenue & Profit Graph Data (Daily Aggregation)
    const revenueMap = new Map();
    sales.forEach(s => {
        if (s.dealDate) {
            const date = s.dealDate.toISOString().split('T')[0];
            const current = revenueMap.get(date) || { revenue: 0, profit: 0 };

            const salePrice = s.totalAmount || 0;
            const saleCost = asset.costPrice || 0;
            const saleProfit = salePrice - saleCost;

            revenueMap.set(date, {
                revenue: current.revenue + salePrice,
                profit: current.profit + saleProfit
            });
        }
    });

    const revenueGraph = Array.from(revenueMap.entries())
        .map(([date, data]) => ({
            date,
            amount: data.revenue,
            profit: data.profit
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // View Trend (Simulated)
    const viewsTrend = [];
    const daysSinceCreation = Math.ceil((new Date() - new Date(asset.createdAt)) / (1000 * 60 * 60 * 24));
    const viewPoints = Math.min(Math.max(daysSinceCreation, 1), 30);
    let currentViews = 0;
    for (let i = 0; i < viewPoints; i++) {
        const date = new Date(asset.createdAt);
        date.setDate(date.getDate() + i);
        const maxDaily = (asset.views / viewPoints) * 2;
        const dailyGain = Math.floor(Math.random() * maxDaily);
        currentViews = Math.min(currentViews + dailyGain, asset.views);
        if (i === viewPoints - 1) currentViews = asset.views;
        viewsTrend.push({ date: date.toISOString().split('T')[0], views: currentViews });
    }

    return {
        asset: {
            id: asset._id,
            title: asset.title,
            price: asset.price,
            views: asset.views,
            status: asset.status,
            availableQty: asset.quantity || 1,
            imageUrl: asset.images[0],
            createdAt: asset.createdAt
        },
        metrics: {
            totalOrders,
            totalRevenue,
            totalProfit,
            avgProfit,
            avgTimeToSell,
            avgTimeInterestToSold,
            avgTimeNegToSold,
            avgNegotiatedFinalPrice,
            dealsPer100,
            conversionRate: asset.views > 0 ? ((totalOrders / asset.views) * 100).toFixed(2) : 0,
        },
        negotiation: {
            passed: passedNegotiations,
            failed: failedNegotiations
        },
        funnel: {
            impressions: asset.views,
            attract: interests.length,
            interact: negotiatingRequests,
            convert: totalOrders
        },
        breakdown: {
            pendingRequests,
            negotiatingRequests,
            rejectedRequests: interests.filter(i => i.status === 'rejected').length
        },
        priceIntelligence: {
            listingPrice: asset.price,
            marketAvgPrice: Math.round(marketAvgPrice),
            pricePosition: asset.price > marketAvgPrice ? 'Overpriced' : 'Underpriced',
            deviation: Math.round(((asset.price - marketAvgPrice) / marketAvgPrice || 1) * 100)
        },
        trends: {
            revenue: revenueGraph,
            views: viewsTrend
        }
    };
};

module.exports = { getAllPerformance, getDetails };
