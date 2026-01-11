const Sales = require('../../models/Sales');
const Interest = require('../../models/Interest');
const Asset = require('../../models/Asset');
const User = require('../../models/User');

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

const calculateTrustScore = (stats) => {
    const { reliability, activity, volume, tenure } = stats;

    // 1. Reliability (40%): Conversion Rate
    // (Accepted / (Accepted + Rejected))
    const relScore = reliability * 0.4;

    // 2. Activity (20%): Engagement
    // Benchmark: 10 interests for max score
    const actScore = Math.min(activity / 10, 1) * 20;

    // 3. Volume (20%): Spending
    // Benchmark: $5,000 for max score
    const volScore = Math.min(volume / 5000, 1) * 20;

    // 4. Tenure (20%): Account Age
    // Benchmark: 30 days for max score
    const tenScore = Math.min(tenure / 30, 1) * 20;

    const totalScore = Math.round(relScore + actScore + volScore + tenScore);

    return {
        totalScore,
        breakdown: {
            reliability: Math.round(relScore),
            activity: Math.round(actScore),
            volume: Math.round(volScore),
            tenure: Math.round(tenScore)
        },
        isEligible: totalScore >= 75
    };
};

const getBuyerOverview = async (buyerId, range = '1m') => {
    const startDate = getStartDate(range);

    // 1. Fetch Sales (Orders)
    const orders = await Sales.find({
        buyer: buyerId,
        isDeleted: { $ne: true },
        status: 'sold'
    }).populate('asset');

    // 2. Fetch Interests
    const interests = await Interest.find({
        buyer: buyerId
    }).populate('asset');

    // 3. Fetch User for Tenure
    const user = await User.findById(buyerId);

    // Filter by range for charts/kpis
    const filteredOrders = orders.filter(o => new Date(o.dealDate || o.createdAt) >= startDate);
    const filteredInterests = interests.filter(i => new Date(i.createdAt) >= startDate);

    // --- KPI Calculations ---
    let totalSpent = 0;
    let totalSavings = 0;
    const categorySpend = new Map();

    filteredOrders.forEach(order => {
        const paidPrice = order.price || order.finalPrice || 0;
        const originalPrice = order.asset?.price || paidPrice;
        const savings = Math.max(0, originalPrice - paidPrice);

        totalSpent += paidPrice;
        totalSavings += savings;

        if (order.asset) {
            const cat = order.asset.category || 'Other';
            categorySpend.set(cat, (categorySpend.get(cat) || 0) + paidPrice);
        }
    });

    const acquisitions = filteredOrders.length;
    const totalInterests = filteredInterests.length;
    const acceptedInterests = filteredInterests.filter(i => i.status === 'accepted').length;
    const rejectedInterests = filteredInterests.filter(i => i.status === 'rejected').length;

    const closedInterests = acceptedInterests + rejectedInterests;
    const conversionRate = closedInterests > 0 ? ((acceptedInterests / closedInterests) * 100).toFixed(1) : 0;

    // --- Trust Score Calculation (Always use 'all' time data for trust) ---
    const allTimeOrders = orders;
    const allTimeInterests = interests;
    const allTimeAccepted = allTimeInterests.filter(i => i.status === 'accepted').length;
    const allTimeRejected = allTimeInterests.filter(i => i.status === 'rejected').length;
    const allTimeClosed = allTimeAccepted + allTimeRejected;

    const reliability = allTimeClosed > 0 ? (allTimeAccepted / allTimeClosed) * 100 : 0;
    const activity = allTimeInterests.length;
    const volume = allTimeOrders.reduce((sum, o) => sum + (o.price || o.finalPrice || 0), 0);
    const joinDate = user ? new Date(user.createdAt) : new Date();
    const tenure = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));

    const trustScoreData = calculateTrustScore({ reliability, activity, volume, tenure });

    // --- Elite Mastery Logic ---
    if (user) {
        let userWasModified = false;
        // 1. Award mastery if score hits 100 and they are eligible
        if (trustScoreData.totalScore === 100 && user.isEliteEligible) {
            user.masteryBadges = (user.masteryBadges || 0) + 1;
            user.isEliteEligible = false;
            userWasModified = true;
        }
        // 2. Reset eligibility if score drops below 90
        else if (trustScoreData.totalScore < 90 && !user.isEliteEligible) {
            user.isEliteEligible = true;
            userWasModified = true;
        }

        if (userWasModified) {
            await user.save();
        }
    }

    // --- Achievement Badges Calculation ---
    const achievements = [];

    // 1. Success Streak / First Deal
    if (allTimeOrders.length >= 1) {
        achievements.push({ id: 'first_deal', label: 'First Deal', icon: 'ShoppingBag', desc: 'Successfully completed first purchase' });
    }

    // 2. Active Buyer (5+ purchases)
    if (allTimeOrders.length >= 5) {
        achievements.push({ id: 'active_buyer', label: 'Active Buyer', icon: 'Zap', desc: 'Unlocked after purchasing 5 products' });
    }

    // 3. Negotiation Pro (3+ negotiated deals)
    // Check sales where finalPrice < original price (asset.price)
    const negotiatedDeals = allTimeOrders.filter(o => o.finalPrice && o.asset?.price && o.finalPrice < o.asset.price).length;
    if (negotiatedDeals >= 3) {
        achievements.push({ id: 'negotiation_pro', label: 'Negotiation Pro', icon: 'TrendingUp', desc: 'Completed 3 successful negotiated deals' });
    }

    // 4. High-Value Trader (> 1,00,000 INR / ~1,200 USD)
    if (volume > 1200) { // Using 1200 USD as equivalent for 1,00,000 INR
        achievements.push({ id: 'high_value', label: 'High-Value Trader', icon: 'DollarSign', desc: 'Total transaction value > $1,200' });
    }

    // 5. Fast Mover (3 deals within 1hr)
    // Check if any group of 3 orders happened within 3600000ms
    const sortedOrders = [...allTimeOrders].sort((a, b) => new Date(a.dealDate || a.createdAt) - new Date(b.dealDate || b.createdAt));
    let isFastMover = false;
    for (let i = 0; i <= sortedOrders.length - 3; i++) {
        const timeDiff = new Date(sortedOrders[i + 2].dealDate || sortedOrders[i + 2].createdAt) - new Date(sortedOrders[i].dealDate || sortedOrders[i].createdAt);
        if (timeDiff <= 3600000) {
            isFastMover = true;
            break;
        }
    }
    if (isFastMover) {
        achievements.push({ id: 'fast_mover', label: 'Fast Mover', icon: 'Rocket', desc: 'Completed 3 deals within 1 hour' });
    }

    // 6. Trusted Seller Placeholder (If they have sales)
    // Since this is buyer analytics, we might need a separate check or assume if they have business data
    // For now, let's stick to what we have in this service.

    // --- Milestone Calculation based on Achievement Count ---
    const badgeCount = achievements.length;
    let milestones = [];
    if (badgeCount >= 1) milestones.push({ level: 5, label: "Active Inquirer", threshold: 1 }); // Map 1 achievement to first milestone
    if (badgeCount >= 3) milestones.push({ level: 10, label: "Verified Trader", threshold: 3 });
    if (badgeCount >= 5) milestones.push({ level: 25, label: "Market Stalwart", threshold: 5 });
    if (badgeCount >= 10) milestones.push({ level: 50, label: "Elite Veteran", threshold: 10 });
    if (trustScoreData.totalScore === 100) milestones.push({ level: 100, label: "Sentinel of Truth", threshold: 100 });

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
        filteredOrders.forEach(order => {
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
        filteredOrders.forEach(order => {
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
        filteredOrders.forEach(order => {
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
        trustScore: trustScoreData,
        achievements,
        milestones,
        trends,
        chartData
    };
};

module.exports = { getBuyerOverview };
