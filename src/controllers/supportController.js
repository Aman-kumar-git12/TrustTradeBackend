const Support = require('../models/Support');

// @desc    Submit a support query
// @route   POST /api/support
// @access  Private
const submitQuery = async (req, res) => {
    try {
        const { subject, message, type, priority } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const query = await Support.create({
            user: req.user._id,
            subject,
            message,
            type: type || 'general',
            priority: priority || 'medium'
        });

        res.status(201).json(query);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's support queries
// @route   GET /api/support/my-queries
// @access  Private
const getMyQueries = async (req, res) => {
    try {
        const queries = await Support.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all support queries (Admin only)
// @route   GET /api/support/admin/all
// @access  Private/Admin
const getAllQueries = async (req, res) => {
    try {
        const queries = await Support.find({})
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update support query status/response (Admin only)
// @route   PUT /api/support/admin/:id
// @access  Private/Admin
const updateQuery = async (req, res) => {
    try {
        const { status, adminResponse, priority } = req.body;
        const query = await Support.findById(req.params.id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        if (status) query.status = status;
        if (adminResponse) query.adminResponse = adminResponse;
        if (priority) query.priority = priority;

        if (status === 'resolved' || status === 'closed') {
            query.resolvedAt = Date.now();
        }

        const updatedQuery = await query.save();
        res.json(updatedQuery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete support query (Admin only)
// @route   DELETE /api/support/admin/:id
// @access  Private/Admin
const deleteQuery = async (req, res) => {
    try {
        const query = await Support.findById(req.params.id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        await query.deleteOne();
        res.json({ message: 'Query removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitQuery,
    getMyQueries,
    getAllQueries,
    updateQuery,
    deleteQuery
};
