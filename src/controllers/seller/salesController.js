const Sales = require('../../models/Sale'); // Fixed: singular 'Sale'
const Interest = require('../../models/Interest');
const Asset = require('../../models/Asset');

// @desc    Create a new sale record
// @route   POST /api/sales
// @access  Private/Seller
const createSale = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Only sellers can create sale records' });
        }

        const { price, quantity, status, interestId, assetId, buyerId, sellerId } = req.body;

        if (price === undefined || !status) { // price can be 0
            return res.status(400).json({ message: 'Price and status are required' });
        }

        if (!assetId || !buyerId) {
            return res.status(400).json({ message: 'Asset and buyer are required' });
        }

        if (sellerId && sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only create sale records for your own account' });
        }

        // User Custom Logic: Unsold -> isDeleted: true, Sold -> isDeleted: false
        const isDeleted = status === 'unsold';
        const saleQuantity = quantity || 1;
        const finalPrice = price * saleQuantity;

        const newSale = new Sales({
            price,
            quantity: saleQuantity,
            soldQuantity: saleQuantity, // Populate requested field
            totalAmount: finalPrice, // Fixed: Schema expects totalAmount
            status,
            interest: interestId,
            asset: assetId,
            buyer: buyerId,
            seller: req.user._id,
            isDeleted: isDeleted
        });

        const savedSale = await newSale.save();

        // Update Linked Interest/Lead to reflect the sale
        if (status === 'sold' && interestId) {
            const interest = await Interest.findById(interestId);
            if (interest) {
                interest.status = 'accepted';
                interest.salesStatus = 'sold';
                interest.soldPrice = price;
                interest.soldQuantity = saleQuantity;
                interest.soldTotalAmount = finalPrice;
                interest.soldDate = new Date();
                await interest.save();
            }
        }

        res.status(201).json(savedSale);
    } catch (error) {
        console.error('Create Sale Error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to create sale record', error: error.message });
    }
};

const deleteSale = async (req, res) => {
    try {
        const sale = await Sales.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ message: 'Sale record not found' });
        }

        if (sale.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own sale records' });
        }

        await sale.deleteOne();
        res.status(200).json({ message: 'Sale record deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete sale record', error: error.message });
    }
};

// @desc    Get purchase history for the authenticated user
// @route   GET /api/sales/me
// @access  Private
const getBuyerOrders = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, condition, status } = req.query;

        // Base query: find sold records belonging to the authenticated buyer
        // If status is provided, we use it, otherwise default to 'sold' for the dashboard
        let query = { buyer: req.user._id };
        if (status) {
            query.status = status;
        } else {
            query.status = 'sold';
        }

        let orders = await Sales.find(query)
            .populate({
                path: 'asset',
                populate: { path: 'business', select: 'businessName' }
            })
            .populate('seller', 'fullName email phone')
            .populate('buyer', 'fullName email phone')
            .sort({ createdAt: -1 });

        // Backend Filter Logic
        if (search || category || minPrice || maxPrice || condition || status) {
            const searchLower = search?.toLowerCase();

            orders = orders.filter(item => {
                const asset = item.asset;
                // Note: For orders, we filter by the actual transaction price (item.price)
                const itemPrice = item.price || 0;

                // Search match (title or business name)
                const matchesSearch = !search || (
                    asset?.title?.toLowerCase().includes(searchLower) ||
                    (asset?.business?.businessName || '').toLowerCase().includes(searchLower)
                );

                // Category match
                const matchesCategory = !category || asset?.category === category;

                // Price match
                const matchesMinPrice = !minPrice || itemPrice >= parseFloat(minPrice);
                const matchesMaxPrice = !maxPrice || itemPrice <= parseFloat(maxPrice);

                // Condition match
                const matchesCondition = !condition || asset?.condition === condition;

                return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesCondition;
            });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch buy orders', error: error.message });
    }
};

module.exports = {
    createSale,
    deleteSale,
    getBuyerOrders
};
