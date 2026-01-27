const Sales = require('../../models/Sale');
const Asset = require('../../models/Asset');
const Business = require('../../models/Business');

const getInsights = async (businessId, ownerId) => {
    const business = await Business.findOne({ _id: businessId, owner: ownerId });
    if (!business) throw new Error('Unauthorized');

    const assets = await Asset.find({ business: businessId });
    const assetIds = assets.map(a => a._id);

    const sales = await Sales.find({
        asset: { $in: assetIds },
        isDeleted: { $ne: true },
        status: 'sold'
    }).populate('buyer', 'fullName email avatarUrl companyName').populate('asset');

    const buyerMap = new Map();

    sales.forEach(sale => {
        const buyerId = sale.buyer._id.toString();
        if (!buyerMap.has(buyerId)) {
            buyerMap.set(buyerId, {
                buyer: sale.buyer,
                totalSpend: 0,
                totalOrders: 0,
                lastOrderDate: new Date(0),
                firstOrderDate: new Date(8640000000000000)
            });
        }
        const entry = buyerMap.get(buyerId);
        const price = sale.price || sale.totalAmount || 0;

        entry.totalSpend += price;
        entry.totalOrders += 1;

        const dealDate = new Date(sale.dealDate || sale.createdAt);
        if (dealDate > entry.lastOrderDate) entry.lastOrderDate = dealDate;
        if (dealDate < entry.firstOrderDate) entry.firstOrderDate = dealDate;
    });

    const customers = Array.from(buyerMap.values()).map(c => ({
        id: c.buyer._id,
        name: c.buyer.fullName,
        email: c.buyer.email,
        company: c.buyer.companyName,
        avatar: c.buyer.avatarUrl,
        totalSpend: c.totalSpend,
        totalOrders: c.totalOrders,
        lastOrderDate: c.lastOrderDate,
        customerType: c.totalOrders > 1 ? 'Repeating' : 'New'
    }));

    // Sort by total spend
    customers.sort((a, b) => b.totalSpend - a.totalSpend);

    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.customerType === 'Repeating').length;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
        summary: {
            totalCustomers,
            newCustomers: totalCustomers - repeatCustomers,
            repeatCustomers,
            retentionRate: retentionRate.toFixed(1)
        },
        customers
    };
};

module.exports = { getInsights };
