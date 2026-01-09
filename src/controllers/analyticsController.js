const overviewService = require('../services/analytics/overviewService');
const productService = require('../services/analytics/productService');
const customerService = require('../services/analytics/customerService');

// @desc    Get 24h Overview (Hourly)
// @route   GET /api/analytics/:businessId/overview/24h
// @access  Private
const getOverview24h = async (req, res) => {
    try {
        const { businessId } = req.params;
        const data = await overviewService.getOverviewStats(businessId, req.user._id, '1d');
        res.json(data);
    } catch (error) {
        console.error("Analytics 24h Error:", error);
        if (error.message === 'Business not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get 15 Days Overview (Daily)
// @route   GET /api/analytics/:businessId/overview/15d
// @access  Private
const getOverview15d = async (req, res) => {
    try {
        const { businessId } = req.params;
        const data = await overviewService.getOverviewStats(businessId, req.user._id, '15d');
        res.json(data);
    } catch (error) {
        console.error("Analytics 15d Error:", error);
        if (error.message === 'Business not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get 1 Month Overview (Daily)
// @route   GET /api/analytics/:businessId/overview/1m
// @access  Private
const getOverview1m = async (req, res) => {
    try {
        const { businessId } = req.params;
        const data = await overviewService.getOverviewStats(businessId, req.user._id, '1m');
        res.json(data);
    } catch (error) {
        console.error("Analytics 1m Error:", error);
        if (error.message === 'Business not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get 1 Year Overview (Monthly)
// @route   GET /api/analytics/:businessId/overview/1y
// @access  Private
const getOverview1y = async (req, res) => {
    try {
        const { businessId } = req.params;
        const data = await overviewService.getOverviewStats(businessId, req.user._id, '1y');
        res.json(data);
    } catch (error) {
        console.error("Analytics 1y Error:", error);
        if (error.message === 'Business not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Time Overview (Monthly)
// @route   GET /api/analytics/:businessId/overview/all
// @access  Private
const getOverviewAll = async (req, res) => {
    try {
        const { businessId } = req.params;
        const data = await overviewService.getOverviewStats(businessId, req.user._id, 'all');
        res.json(data);
    } catch (error) {
        console.error("Analytics All Error:", error);
        if (error.message === 'Business not found or unauthorized') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get detailed product performance
// @route   GET /api/analytics/:businessId/products
// @access  Private
const getProductPerformance = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { sortBy, order } = req.query;
        const products = await productService.getAllPerformance(businessId, sortBy, order);
        res.json(products);
    } catch (error) {
        console.error("Product Performance Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Customer Insights & Retention
// @route   GET /api/analytics/:businessId/customers
// @access  Private
const getCustomerInsights = async (req, res) => {
    try {
        const { businessId } = req.params;
        const insights = await customerService.getInsights(businessId, req.user._id);
        res.json(insights);
    } catch (error) {
        console.error("Customer Insights Error:", error);
        if (error.message === 'Unauthorized') return res.status(404).json({ message: 'Unauthorized' });
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get individual product analytics (Deep Dive)
// @route   GET /api/analytics/product/:assetId
// @access  Private
const getProductAnalytics = async (req, res) => {
    try {
        const { assetId } = req.params;
        const analytics = await productService.getDetails(assetId, 'all');
        res.json(analytics);
    } catch (error) {
        console.error("Product Analytics Error:", error);
        if (error.message === 'Asset not found') return res.status(404).json({ message: 'Asset not found' });
        res.status(500).json({ message: 'Server Error' });
    }
};

const getProductAnalytics30d = async (req, res) => {
    try {
        const { assetId } = req.params;
        const analytics = await productService.getDetails(assetId, '30d');
        res.json(analytics);
    } catch (error) {
        console.error("Product Analytics 30d Error:", error);
        if (error.message === 'Asset not found') return res.status(404).json({ message: 'Asset not found' });
        res.status(500).json({ message: 'Server Error' });
    }
};

const getProductAnalyticsAll = async (req, res) => {
    try {
        const { assetId } = req.params;
        const analytics = await productService.getDetails(assetId, 'all');
        res.json(analytics);
    } catch (error) {
        console.error("Product Analytics All Error:", error);
        if (error.message === 'Asset not found') return res.status(404).json({ message: 'Asset not found' });
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getOverview24h,
    getOverview15d,
    getOverview1m,
    getOverview1y,
    getOverviewAll,
    getProductPerformance,
    getCustomerInsights,
    getProductAnalytics,
    getProductAnalytics30d,
    getProductAnalyticsAll
};
