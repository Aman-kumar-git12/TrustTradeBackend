const Interest = require('../models/Interest');
const Asset = require('../models/Asset');

// @desc    Create new interest (Buyer shows interest)
// @route   POST /api/interests
// @access  Private/Buyer
const createInterest = async (req, res) => {
    if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Only buyers can show interest' });
    }

    const { assetId, message } = req.body;

    try {
        const asset = await Asset.findById(assetId);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const existingInterest = await Interest.findOne({
            buyer: req.user._id,
            asset: assetId
        });

        if (existingInterest) {
            return res.status(400).json({ message: 'You have already shown interest in this asset' });
        }

        const interest = await Interest.create({
            buyer: req.user._id,
            asset: assetId,
            seller: asset.seller,
            message,
            status: 'pending'
        });

        res.status(201).json(interest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get interests sent by buyer
// @route   GET /api/interests/buyer
// @access  Private/Buyer
const getBuyerInterests = async (req, res) => {
    try {
        const interests = await Interest.find({ buyer: req.user._id })
            .populate('asset')
            .populate('seller', 'fullName companyName email'); // Email only shown if accepted, need filtering logic in frontend or here. 
        // For MVP, we send it, frontend can hide if pending. Logic:
        // Ideally we shouldn't send sensitive info if pending.

        res.status(200).json(interests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get leads received by seller
// @route   GET /api/interests/seller
// @access  Private/Seller
// @desc    Get leads received by seller
// @route   GET /api/interests/seller
// @access  Private/Seller
const getSellerLeads = async (req, res) => {
    try {
        const { status, search } = req.query;

        // Base Query
        let query = { seller: req.user._id };
        if (status) {
            query.status = status;
        }

        let interests = await Interest.find(query)
            .populate('asset')
            .populate('buyer', 'fullName email companyName phone')
            .sort({ createdAt: -1 });

        // Search Filter (In-memory because we need to search populated fields)
        if (search) {
            const searchLower = search.toLowerCase();
            interests = interests.filter(interest => {
                const buyerName = interest.buyer?.fullName?.toLowerCase() || '';
                const assetTitle = interest.asset?.title?.toLowerCase() || '';
                return buyerName.includes(searchLower) || assetTitle.includes(searchLower);
            });
        }

        res.status(200).json(interests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update interest status (Accept/Reject/Negotiate)
// @route   PATCH /api/interests/:id/status
// @access  Private/Seller
// @desc    Update interest status (Accept/Reject/Negotiate)
// @route   PATCH /api/interests/:id/status
// @access  Private/Seller
const updateInterestStatus = async (req, res) => {
    const { status } = req.body; // accepted, rejected, negotiating

    if (!['accepted', 'rejected', 'negotiating'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value. Allowed: accepted, rejected, negotiating' });
    }

    try {
        const interest = await Interest.findById(req.params.id);

        if (!interest) {
            return res.status(404).json({ message: 'Interest not found' });
        }

        // Ensure logged in user is the seller
        if (interest.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to manage this lead' });
        }

        // Update status
        interest.status = status;

        // Special handling for negotiation start
        if (status === 'negotiating' && !interest.negotiationStartDate) {
            interest.negotiationStartDate = Date.now();
        }

        // If accepted or rejected, we could potentially clear negotiation start date or keep it for history. 
        // For now, we just update the status.

        await interest.save();

        res.status(200).json(interest);
    } catch (error) {
        console.error('Error updating interest status:', error);
        res.status(500).json({ message: 'Server Error: Could not update status' });
    }
};

module.exports = {
    createInterest,
    getBuyerInterests,
    getSellerLeads,
    updateInterestStatus
};
