const Event = require('../models/Event');
const Sale = require('../models/Sale');
const Interest = require('../models/Interest');
const User = require('../models/User');

// @desc    Get all sales for admin with filters
// @route   GET /api/admin/sales
// @access  Private/Admin
// @desc    Get all sales (Interests/Leads) for admin with filters
// @route   GET /api/admin/sales
// @access  Private/Admin
const getAllSales = async (req, res) => {
    try {
        const { status, seller, buyer, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        let query = {};

        // Status filter: Check both generic status and salesStatus
        // Map 'sold' to salesStatus, others to status
        if (status) {
            if (status === 'sold') {
                query.salesStatus = 'sold';
            } else if (status === 'unsold') {
                query.salesStatus = 'unsold';
            } else {
                // For 'negotiating', 'accepted', 'rejected'
                // We want to exclude items that are already sold, to define them as "Pending but in this state"
                query.status = status;
                query.salesStatus = { $ne: 'sold' };
            }
        }

        if (seller) query.seller = seller;
        if (buyer) query.buyer = buyer;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const sortOptions = {};
        // Handle computed sort for totalAmount, straightforward for createdAt
        let sortStage = {};

        if (sortBy === 'totalAmount') {
            sortStage['effectiveAmount'] = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        const pipeline = [
            { $match: query },
            {
                $addFields: {
                    // Compute amount for sorting: use soldTotalAmount if sold, else price * quantity
                    effectiveAmount: {
                        $ifNull: [
                            "$soldTotalAmount",
                            { $multiply: [{ $ifNull: ["$price", 0] }, { $ifNull: ["$quantity", 1] }] }
                        ]
                    }
                }
            },
            { $sort: sortStage },
            // Populate Fields
            {
                $lookup: { from: 'users', localField: 'seller', foreignField: '_id', as: 'seller' }
            },
            { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
            {
                $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyer' }
            },
            { $unwind: { path: '$buyer', preserveNullAndEmptyArrays: true } },
            {
                $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'asset' }
            },
            { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
            // Lookup Related Sale for Payment ID
            {
                $lookup: { from: 'sales', localField: '_id', foreignField: 'interest', as: 'relatedSale' }
            },
            // Keep relatedSale as array (0 or 1 item)
        ];

        const interests = await Interest.aggregate(pipeline);

        // Map to final structure
        const results = interests.map(i => {
            const relatedSale = i.relatedSale?.[0]; // Access first item if exists

            let displayStatus = i.status;
            if (i.salesStatus === 'sold') displayStatus = 'sold';
            if (relatedSale && relatedSale.status) displayStatus = relatedSale.status;

            return {
                ...i,
                _id: i._id,
                status: displayStatus,
                totalAmount: i.effectiveAmount,
                razorpayPaymentId: relatedSale?.razorpayPaymentId,
                saleId: relatedSale?._id
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update featured event
// @route   POST /api/admin/event
// @access  Private/Admin
const updateFeaturedEvent = async (req, res) => {
    try {
        const { title, subtitle, description, imageUrl, link, expiresAt } = req.body;

        // For now, we only have one featured event. So we find one and update, or create.
        let event = await Event.findOne({ eventType: 'FEATURED EVENT' });

        if (event) {
            event.title = title || event.title;
            event.subtitle = subtitle || event.subtitle;
            event.description = description || event.description;
            event.imageUrl = imageUrl || event.imageUrl;
            event.link = link || event.link;
            event.expiresAt = expiresAt || event.expiresAt;
            const updatedEvent = await event.save();
            res.json(updatedEvent);
        } else {
            const newEvent = await Event.create({
                title, subtitle, description, imageUrl, link, expiresAt,
                eventType: 'FEATURED EVENT'
            });
            res.status(201).json(newEvent);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get featured event
// @route   GET /api/admin/event
// @access  Public (Used by Home page)
const getFeaturedEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ eventType: 'FEATURED EVENT', isActive: true });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats for admin
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalSales = await Sale.countDocuments();
        const totalRevenue = await Sale.aggregate([
            { $match: { status: 'sold' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const recentSales = await Sale.find()
            .populate('buyer', 'fullName')
            .populate('asset', 'title')
            .limit(5)
            .sort({ createdAt: -1 });

        res.json({
            totalSales,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            recentSales
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/admin/sales/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        // Check if ID matches a Sale first (old way) or Interest (new way)
        // Since we pivoted to Interest IDs in list, req.params.id is Interest ID.
        // Try to find a Sale linked to this Interest
        let sale = await Sale.findOne({ interest: req.params.id });

        if (sale) {
            sale.status = status || sale.status;
            const updatedSale = await sale.save();
            res.json(updatedSale);
        } else {
            // If no sale found, check if it's a direct Sale ID (rare fallback)
            sale = await Sale.findById(req.params.id);
            if (sale) {
                sale.status = status || sale.status;
                const updatedSale = await sale.save();
                res.json(updatedSale);
                return;
            }

            // If still no sale, maybe we are updating the Interest status?
            // Only if status is valid for Interest.
            const interest = await Interest.findById(req.params.id);
            if (interest) {
                if (['negotiating', 'accepted', 'rejected'].includes(status)) {
                    interest.status = status;
                    await interest.save();
                    return res.json(interest);
                }
                return res.status(400).json({ message: "Cannot apply sales status to a non-sold lead. Mark as sold first." });
            }

            res.status(404).json({ message: 'Order (Sale) not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const { role, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;
        let query = {};
        if (role) query.role = role;

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const users = await User.find(query).select('-password').sort(sortOptions);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            user.role = role || user.role;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSaleById = async (req, res) => {
    try {
        // Fetch Interest (Lead) which is the base object now
        const interest = await Interest.findById(req.params.id)
            .populate('seller', 'fullName email phone avatarUrl description masteryBadges createdAt')
            .populate('buyer', 'fullName email phone avatarUrl description masteryBadges createdAt')
            .populate('asset', 'title images price description');

        if (!interest) {
            // Fallback: Check if ID provided was a Sale ID
            const sale = await Sale.findById(req.params.id)
                .populate('seller', 'fullName email phone')
                .populate('buyer', 'fullName email phone')
                .populate('asset', 'title images price description')
                .populate('interest');

            if (sale) {
                // Adapt Sale to expected structure
                let result = sale.toObject();
                // result.interest is already populated
                result.saleId = sale._id;
                return res.json(result);
            }

            return res.status(404).json({ message: "Order not found" });
        }

        let result = interest.toObject();

        // Attach nested 'interest' object for frontend compatibility (AdminOrders.jsx expects selectedOrder.interest.message)
        result.interest = {
            message: interest.message,
            quantity: interest.quantity,
            status: interest.status,
            createdAt: interest.createdAt,
            _id: interest._id
        };

        // If sold, attach Sale details
        if (interest.salesStatus === 'sold' || interest.status === 'completed') {
            const sale = await Sale.findOne({ interest: interest._id });
            if (sale) {
                result.razorpayPaymentId = sale.razorpayPaymentId;
                result.saleId = sale._id;
                result.status = sale.status; // Use Sale status (e.g. 'refunded') over Interest status
                result.totalAmount = sale.totalAmount;
            }
        } else {
            // If not sold, totalAmount is offer * qty
            result.totalAmount = (interest.price || 0) * (interest.quantity || 1);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllSales,
    getSaleById,
    updateOrderStatus,
    getAllUsers,
    updateUserRole,
    updateFeaturedEvent,
    getFeaturedEvent,
    getAdminStats
};
