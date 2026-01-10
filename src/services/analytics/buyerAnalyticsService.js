const Sales = require('../../models/Sales');
const Interest = require('../../models/Interest');
const Asset = require('../../models/Asset');

// Helper to get start date
const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
        case '24h': return new Date(now.setDate(now.getDate() - 1));
        case '15d': return new Date(now.setDate(now.getDate() - 15));
        case '1m': return new Date(now.setMonth(now.getMonth() - 1));
        case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
        case 'all': return new Date(0);
        default: return new Date(now.setMonth(now.getMonth() - 1));
    }
};

const getBuyerOverview = async (buyerId, range = '1m') => {
    const startDate = getStartDate(range);

    // 1. Fetch Sales (Orders)
    const orders = await Sales.find({
        buyer: buyerId,
        isDeleted: { $ne: true },
        status: 'sold',
        dealDate: { $gte: startDate }
    }).populate('asset');

    // 2. Fetch Interests
    const interests = await Interest.find({
        buyer: buyerId,
        createdAt: { $gte: startDate }
    });

    // --- KPI Calculations ---
    let totalSpent = 0;
    let totalSavings = 0;
    const categorySpend = new Map();

    orders.forEach(order => {
        const paidPrice = order.price || order.finalPrice || 0;
        const originalPrice = order.asset?.price || paidPrice; // Fallback to paid if original not found
        const savings = Math.max(0, originalPrice - paidPrice);

        totalSpent += paidPrice;
        totalSavings += savings;

        if (order.asset) {
            const cat = order.asset.category || 'Other';
            categorySpend.set(cat, (categorySpend.get(cat) || 0) + paidPrice);
        }
    });

    const acquisitions = orders.length;
    const totalInterests = interests.length;
    const acceptedInterests = interests.filter(i => i.status === 'accepted').length;
    const rejectedInterests = interests.filter(i => i.status === 'rejected').length;

    // Calculate Success Rate based on closed interactions (Accepted vs Rejected)
    // Formula: (Accepted / (Accepted + Rejected)) * 100
    const closedInterests = acceptedInterests + rejectedInterests;
    const conversionRate = closedInterests > 0 ? ((acceptedInterests / closedInterests) * 100).toFixed(1) : 0;

    // --- Chart Data Preparation ---
    let chartData = [];
    const isHourly = range === '24h';
    const isDaily = ['15d', '1m'].includes(range);

    if (isHourly) {
        const hourMap = new Map();
        for (let i = 23; i >= 0; i--) {
            const d = new Date();
            d.setHours(d.getHours() - i);
            d.setMinutes(0, 0, 0);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
            const label = d.toLocaleTimeString([], { hour: '2-digit', hour12: true });
            hourMap.set(key, { name: label, spent: 0, savings: 0 });
        }
        orders.forEach(order => {
            const d = new Date(order.dealDate || order.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
            if (hourMap.has(key)) {
                const entry = hourMap.get(key);
                const paid = (order.price || order.finalPrice || 0);
                const orig = order.asset?.price || paid;
                entry.spent += paid;
                entry.savings += Math.max(0, orig - paid);
            }
        });
        chartData = Array.from(hourMap.values());
    } else if (isDaily) {
        const dayMap = new Map();
        const daysToGenerate = range === '15d' ? 14 : 29;
        for (let i = daysToGenerate; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            dayMap.set(key, { name: label, spent: 0, savings: 0 });
        }
        orders.forEach(order => {
            const d = new Date(order.dealDate || order.createdAt);
            const key = d.toISOString().split('T')[0];
            if (dayMap.has(key)) {
                const entry = dayMap.get(key);
                const paid = (order.price || order.finalPrice || 0);
                const orig = order.asset?.price || paid;
                entry.spent += paid;
                entry.savings += Math.max(0, orig - paid);
            }
        });
        chartData = Array.from(dayMap.values());
    } else {
        const monthMap = new Map();
        let start = getStartDate(range);
        const now = new Date();
        let current = new Date(start);
        current.setDate(1);
        while (current <= now) {
            const key = `${current.getFullYear()}-${current.getMonth()}`;
            const label = current.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            monthMap.set(key, { name: label, spent: 0, savings: 0 });
            current.setMonth(current.setMonth() + 1);
        }
        orders.forEach(order => {
            const d = new Date(order.dealDate || order.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (monthMap.has(key)) {
                const entry = monthMap.get(key);
                const paid = (order.price || order.finalPrice || 0);
                const orig = order.asset?.price || paid;
                entry.spent += paid;
                entry.savings += Math.max(0, orig - paid);
            }
        });
        chartData = Array.from(monthMap.values());
    }

    // --- Trends Data ---
    const trends = {
        categorySpend: Array.from(categorySpend.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    };

    return {
        kpi: {
            totalSpent,
            totalSavings,
            acquisitions,
            totalInterests,
            acceptedInterests,
            conversionRate
        },
        trends,
        chartData
    };
};

module.exports = { getBuyerOverview };
