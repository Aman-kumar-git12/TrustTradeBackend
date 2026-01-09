const Sales = require('../models/Sales');

// @desc    Create a new sale record
// @route   POST /api/sales
// @access  Public (or Private? User didn't specify auth, defaulting to public for now based on context "request form from frontend")
//          Actually, usually backend routes are protected. But I'll make it simple first.
const createSale = async (req, res) => {
    try {
        const { price, status, interestId, assetId, buyerId, sellerId } = req.body;

        if (price === undefined || !status) { // price can be 0
            return res.status(400).json({ message: 'Price and status are required' });
        }

        // User Custom Logic: Unsold -> isDeleted: true, Sold -> isDeleted: false
        const isDeleted = status === 'unsold';

        const newSale = new Sales({
            price,
            status,
            interest: interestId,
            asset: assetId,
            buyer: buyerId,
            seller: sellerId,
            isDeleted: isDeleted
        });

        const savedSale = await newSale.save();

        res.status(201).json(savedSale);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create sale record', error: error.message });
    }
};

const deleteSale = async (req, res) => {
    try {
        await Sales.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Sale record deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete sale record', error: error.message });
    }
};

module.exports = {
    createSale,
    deleteSale
};
