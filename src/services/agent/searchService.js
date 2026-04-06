const Asset = require('../../models/Asset');

/**
 * Advanced Search Service for the Strategic Agent
 * Ensures only purchasable and in-stock assets are returned.
 */

const searchAssets = async ({ query, category, budgetMax, limit = 5, userId = null }) => {
    try {
        let matchStage = { status: 'active' };

        // 1. Text Search (title or description)
        if (query) {
            matchStage.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        // 2. Category Filter
        if (category) {
            matchStage.category = category;
        }

        // 3. Budget Filter
        if (budgetMax) {
            matchStage.price = { $lte: Number(budgetMax) };
        }

        // 4. Stock Protection Logic: available = quantity - reservedQuantity
        // We use $expr to compare these fields in the aggregation
        matchStage.$expr = { $gt: [{ $subtract: ["$quantity", "$reservedQuantity"] }, 0] };

        // 5. Build Aggregation
        const pipeline = [
            { $match: matchStage },
            { $sort: { rating: -1, sales: -1, views: -1 } }, // Priority to top-rated
            { $limit: Number(limit) },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    category: 1,
                    price: 1,
                    images: 1,
                    location: 1,
                    rating: 1,
                    reviewCount: 1,
                    availableQuantity: { $subtract: ["$quantity", "$reservedQuantity"] }
                }
            }
        ];

        const assets = await Asset.aggregate(pipeline);

        // Populate seller info (if needed) - aggregation doesn't auto-populate
        return await Asset.populate(assets, [
            { path: 'seller', select: 'fullName rating companyName' }
        ]);

    } catch (error) {
        console.error("Agent Search Service Error:", error);
        throw error;
    }
};

const getCategories = async () => {
    return await Asset.distinct('category', { status: 'active' });
};

module.exports = {
    searchAssets,
    getCategories
};
