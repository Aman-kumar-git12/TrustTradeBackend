const Sales = require('../../models/Sales');
const Asset = require('../../models/Asset');
const Business = require('../../models/Business');

// Helper to get start date
const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
        case '1d': return new Date(now.setDate(now.getDate() - 1));
        case '15d': return new Date(now.setDate(now.getDate() - 15));
        case '1m': return new Date(now.setMonth(now.getMonth() - 1));
        case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
        case 'all': return new Date(0); // Epoch
        default: return new Date(now.setMonth(now.getMonth() - 1)); // Default 1m
    }
};

const getOverviewStats = async (businessId, ownerId, range = '1m') => {
    const business = await Business.findOne({ _id: businessId, owner: ownerId });
    if (!business) {
        throw new Error('Business not found or unauthorized');
    }

    const assets = await Asset.find({ business: businessId });
    const assetIds = assets.map(a => a._id);
    const startDate = getStartDate(range);

    // Fetch Sales
    const sales = await Sales.find({
        asset: { $in: assetIds },
        isDeleted: { $ne: true },
        status: 'sold',
        dealDate: { $gte: startDate }
    }).populate('asset');

    // --- KPI Calculations ---
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let totalDiscount = 0;
    const uniqueBuyers = new Set();
    const productStats = new Map();
    const categoryStats = new Map();
    const locationStats = new Map();

    sales.forEach(sale => {
        const price = sale.price || sale.finalPrice || 0;
        const cost = sale.asset?.costPrice || 0;
        const listingPrice = sale.asset?.price || 0;
        const profit = price - cost;

        totalRevenue += price;
        totalCost += cost;
        totalProfit += profit;

        if (profit < 0) totalLoss += Math.abs(profit);
        totalDiscount += Math.max(0, listingPrice - price);

        uniqueBuyers.add(sale.buyer.toString());

        if (sale.asset) {
            // Product Ranking
            const assetId = sale.asset._id.toString();
            if (!productStats.has(assetId)) {
                productStats.set(assetId, {
                    title: sale.asset.title,
                    count: 0,
                    profit: 0,
                    revenue: 0
                });
            }
            const stat = productStats.get(assetId);
            stat.count += 1;
            stat.profit += profit;
            stat.revenue += price;

            // Market Trends: Category
            const cat = sale.asset.category || 'Other';
            if (!categoryStats.has(cat)) categoryStats.set(cat, { name: cat, revenue: 0, profit: 0 });
            const cStat = categoryStats.get(cat);
            cStat.revenue += price;
            cStat.profit += profit;

            // Market Trends: Location
            const loc = sale.asset.location || 'Unknown';
            locationStats.set(loc, (locationStats.get(loc) || 0) + 1);
        }
    });

    // Computed Averages
    const salesCount = sales.length;
    const netMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgDealSize = salesCount > 0 ? (totalRevenue / salesCount) : 0;
    const avgProfitPerProduct = salesCount > 0 ? (totalProfit / salesCount) : 0;
    const avgDiscount = salesCount > 0 ? (totalDiscount / salesCount) : 0;
    const avgProductsPerCustomer = uniqueBuyers.size > 0 ? (salesCount / uniqueBuyers.size) : 0;

    // Rankings & Performers
    const productArray = Array.from(productStats.values()).map(p => ({
        ...p,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
    }));

    const topSellingProduct = [...productArray].sort((a, b) => b.count - a.count)[0] || { title: 'N/A', count: 0 };
    const leastSellingProduct = [...productArray].sort((a, b) => a.count - b.count)[0] || { title: 'N/A', count: 0 };

    const mostProfitableProduct = [...productArray].sort((a, b) => b.profit - a.profit)[0] || { title: 'N/A', profit: 0 };
    const leastProfitableProduct = [...productArray].sort((a, b) => a.profit - b.profit)[0] || { title: 'N/A', profit: 0 };

    // Best & Worst Performers (Lists)
    const performers = {
        best: {
            byQuantity: [...productArray].sort((a, b) => b.count - a.count).slice(0, 5),
            byRevenue: [...productArray].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
            byProfit: [...productArray].sort((a, b) => b.profit - a.profit).slice(0, 5)
        },
        worst: {
            byQuantity: [...productArray].sort((a, b) => a.count - b.count).slice(0, 5),
            byLoss: [...productArray].sort((a, b) => a.profit - b.profit).slice(0, 5),
            byMargin: [...productArray].sort((a, b) => a.margin - b.margin).slice(0, 5)
        }
    };

    // Market Trends Data
    const trends = {
        categoryRevenue: Array.from(categoryStats.values()).map(c => ({ name: c.name, value: c.revenue })).sort((a, b) => b.value - a.value),
        categoryProfit: Array.from(categoryStats.values()).map(c => ({ name: c.name, value: c.profit })).sort((a, b) => b.value - a.value),
        locations: Array.from(locationStats.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
    };

    // --- Chart Data Preparation ---
    let chartData = [];
    const isHourly = range === '1d';
    const isDaily = ['15d', '1m'].includes(range);

    // 1. Hourly Data (24h)
    if (isHourly) {
        const hourMap = new Map();
        // Generate last 24 hours
        for (let i = 23; i >= 0; i--) {
            const d = new Date();
            d.setHours(d.getHours() - i);
            d.setMinutes(0, 0, 0); // Start of hour
            // Key: YYYY-MM-DD-HH
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
            const label = d.toLocaleTimeString([], { hour: '2-digit', hour12: true });
            hourMap.set(key, { name: label, fullDate: d, revenue: 0, profit: 0, count: 0 });
        }

        sales.forEach(sale => {
            const d = new Date(sale.dealDate || sale.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
            if (hourMap.has(key)) {
                const entry = hourMap.get(key);
                const price = (sale.price || sale.finalPrice || 0);
                const cost = (sale.asset?.costPrice || 0);
                entry.revenue += price;
                entry.profit += (price - cost);
                entry.count += 1;
            }
        });
        chartData = Array.from(hourMap.values());
    }
    // 2. Daily Data (15d, 1m)
    else if (isDaily) {
        const dayMap = new Map();
        const daysToGenerate = range === '15d' ? 14 : 29;
        for (let i = daysToGenerate; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            dayMap.set(key, { name: label, revenue: 0, profit: 0, count: 0 });
        }
        sales.forEach(sale => {
            const d = new Date(sale.dealDate || sale.createdAt);
            const key = d.toISOString().split('T')[0];
            if (dayMap.has(key)) {
                const entry = dayMap.get(key);
                const price = (sale.price || sale.finalPrice || 0);
                const cost = (sale.asset?.costPrice || 0);
                entry.revenue += price;
                entry.profit += (price - cost);
                entry.count += 1;
            }
        });
        chartData = Array.from(dayMap.values());
    }
    // 3. Monthly Data (1y, All)
    else {
        const monthMap = new Map();
        // If 'all', find earliest sale, otherwise 1 year ago
        let start = getStartDate(range);
        const now = new Date();

        // Loop from start month to now
        let current = new Date(start);
        current.setDate(1); // Start of month

        while (current <= now) {
            const key = `${current.getFullYear()}-${current.getMonth()}`;
            const label = current.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            monthMap.set(key, { name: label, monthIndex: current.getMonth(), year: current.getFullYear(), revenue: 0, profit: 0, count: 0 });
            current.setMonth(current.getMonth() + 1);
        }

        sales.forEach(sale => {
            const d = new Date(sale.dealDate || sale.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (monthMap.has(key)) {
                const entry = monthMap.get(key);
                const price = (sale.price || sale.finalPrice || 0);
                const cost = (sale.asset?.costPrice || 0);
                entry.revenue += price;
                entry.profit += (price - cost);
                entry.count += 1;
            }
        });
        chartData = Array.from(monthMap.values());
    }

    // --- Best Performance Calculation ---
    let bestLabel = 'N/A';
    const bestPoint = chartData.reduce((max, curr) => curr.revenue > max.revenue ? curr : max, { revenue: 0, name: 'N/A' });

    if (chartData.reduce((sum, d) => sum + d.revenue, 0) === 0) {
        bestLabel = "No Sales";
    } else {
        bestLabel = bestPoint.name;

        if (range === '1d') {
            bestLabel = `${bestPoint.name}`;
        } else if (range === '15d') {
            bestLabel = `${bestPoint.name}`;
        } else if (range === '1m') {
            // Aggregate into weeks to find best week
            const weeks = [0, 0, 0, 0, 0];
            // chartData is sorted oldest to newest (insertion order)
            chartData.forEach((d, index) => {
                const weekIdx = Math.floor(index / 7);
                if (weeks[weekIdx] !== undefined) weeks[weekIdx] += d.revenue;
            });

            let maxWeekRev = -1;
            let bestWeekIdx = 0;
            weeks.forEach((rev, idx) => {
                if (rev > maxWeekRev) {
                    maxWeekRev = rev;
                    bestWeekIdx = idx;
                }
            });

            const weekNames = ['First Week', 'Second Week', 'Third Week', 'Fourth Week', 'Fifth Week'];
            bestLabel = weekNames[bestWeekIdx];
        }
    }

    return {
        kpi: {
            totalRevenue,
            totalProfit,
            totalLoss,
            netMargin: Math.round(netMargin * 10) / 10,
            totalUnitsSold: sales.length,
            avgDealSize: Math.round(avgDealSize),
            avgProfit: Math.round(avgProfitPerProduct),
            avgDiscount: Math.round(avgDiscount),
            avgProductsPerCustomer: avgProductsPerCustomer.toFixed(1),
            customers: uniqueBuyers.size,
            bestMonth: bestLabel
        },
        rankings: {
            topSelling: topSellingProduct,
            leastSelling: leastSellingProduct,
            mostProfitable: mostProfitableProduct,
            leastProfitable: leastProfitableProduct
        },
        performers,
        trends,
        chartData
    };
};

module.exports = { getOverviewStats };
