const Interest = require('../models/Interest');
const Asset = require('../models/Asset');

// @desc    Create new interest (Buyer shows interest)
// @route   POST /api/interests
// @access  Private/Buyer
const createInterest = async (req, res) => {
    const { assetId, message, status } = req.body;

    // Optional status validation
    const validInitialStatuses = ['negotiating'];
    const finalStatus = validInitialStatuses.includes(status) ? status : 'negotiating';

    try {
        const asset = await Asset.findById(assetId);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Prevent showing interest in own asset
        if (asset.seller.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot show interest in your own asset' });
        }

        const interest = await Interest.create({
            buyer: req.user._id,
            asset: assetId,
            seller: asset.seller,
            message,
            status: finalStatus
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
        const { search, category, minPrice, maxPrice, condition, status } = req.query;

        // Base query: find interests belonging to the authenticated buyer
        // Exclude interests that have been converted to sales (salesStatus: 'sold')
        let query = {
            buyer: req.user._id,
            salesStatus: { $ne: 'sold' }
        };

        // We'll populate everything first, then filter in-memory if needed for cross-collection searches, 
        // OR use aggregation if performance becomes an issue. For now, following the pattern in getSellerLeads.
        let interests = await Interest.find(query)
            .populate({
                path: 'asset',
                populate: { path: 'business', select: 'businessName' }
            })
            .populate('seller', 'fullName companyName email phone')
            .sort({ createdAt: -1 });

        // Backend Filter Logic
        if (search || category || minPrice || maxPrice || condition || status) {
            const searchLower = search?.toLowerCase();

            interests = interests.filter(item => {
                const asset = item.asset;
                if (!asset) return false;

                // Search match (title or business name)
                const matchesSearch = !search || (
                    asset.title?.toLowerCase().includes(searchLower) ||
                    (asset.business?.businessName || '').toLowerCase().includes(searchLower)
                );

                // Category match
                const matchesCategory = !category || asset.category === category;

                // Price match
                const matchesMinPrice = !minPrice || asset.price >= parseFloat(minPrice);
                const matchesMaxPrice = !maxPrice || asset.price <= parseFloat(maxPrice);

                // Status match
                const matchesStatus = !status || status.split(',').includes(item.status);

                // Condition match
                const matchesCondition = !condition || asset.condition === condition;

                return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesCondition && matchesStatus;
            });
        }

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

        const updatedInterest = await Interest.findById(interest._id)
            .populate('asset')
            .populate('buyer', 'fullName email companyName phone');

        res.status(200).json(updatedInterest);
    } catch (error) {
        console.error('Error updating interest status:', error);
        res.status(500).json({ message: 'Server Error: Could not update status' });
    }
};

// @desc    Delete/Retract interest (Buyer retracts interest)
// @route   DELETE /api/interests/:id
// @access  Private/Buyer
const deleteInterest = async (req, res) => {
    try {
        const interest = await Interest.findById(req.params.id);

        if (!interest) {
            return res.status(404).json({ message: 'Interest record not found' });
        }

        // Ensure logged in user is the buyer who sent it
        if (interest.buyer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this interest' });
        }

        // Only allow deletion if status is negotiating
        if (interest.status !== 'negotiating') {
            return res.status(400).json({ message: `Cannot delete a record that is already ${interest.status}` });
        }

        await interest.deleteOne();

        res.status(200).json({ message: 'Interest retracted successfully', id: req.params.id });
    } catch (error) {
        console.error('Error deleting interest:', error);
        res.status(500).json({ message: 'Server Error: Could not retract interest' });
    }
};

module.exports = {
    createInterest,
    getBuyerInterests,
    getSellerLeads,
    updateInterestStatus,
    deleteInterest
};
