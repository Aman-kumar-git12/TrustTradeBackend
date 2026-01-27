const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const Interest = require('../models/Interest');
const Sales = require('../models/Sale');
const { getBuyerOverview } = require('../services/analytics/buyerAnalyticsService');

// ... (existing code)



// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    try {
        const user = await User.create({
            fullName,
            email,
            password,
            role,
            phone: "9999999999"
        });

        if (user) {
            const token = generateToken(user.id);

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                _id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token // Optional: keep sending token for now if needed by client initially
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    console.log(email, password)
    console.log("Login attempted");

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user.id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            _id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            token
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    console.log("getMe hit");
    res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            user.email = req.body.email || user.email;
            user.companyName = req.body.companyName || user.companyName;
            user.phone = req.body.phone || user.phone;
            user.avatarUrl = req.body.avatarUrl || user.avatarUrl;
            user.description = req.body.description || user.description;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            const token = generateToken(updatedUser._id);

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                companyName: updatedUser.companyName,
                phone: updatedUser.phone,
                avatarUrl: updatedUser.avatarUrl,
                description: updatedUser.description,
                token
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get public user profile
// @route   GET /api/auth/public/:id
// @access  Public
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let businesses = [];
        let trustData = null;
        let overview = null;

        if (user.role === 'seller') {
            businesses = await Business.find({ owner: user._id });
        } else if (user.role === 'buyer') {
            try {
                overview = await getBuyerOverview(user._id, 'all');
                trustData = overview.trustScore;
            } catch (error) {
                console.error("Failed to fetch buyer trust data for public profile", error);
            }
        }

        res.status(200).json({
            user: {
                _id: user._id,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                companyName: user.companyName,
                description: user.description,
                email: user.email,
                phone: user.phone,
                trustScore: trustData?.totalScore || null,
                masteryBadges: user.masteryBadges || 0,
                achievements: overview?.achievements || [],
                milestones: overview?.milestones || []
            },
            businesses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivityCounts = async (req, res) => {
    try {
        let interestsCount = 0;
        let ordersCount = 0;

        if (req.user.role === 'buyer') {
            interestsCount = await Interest.countDocuments({ buyer: req.user._id });
            ordersCount = await Sales.countDocuments({ buyer: req.user._id, isDeleted: { $ne: true } });
        } else if (req.user.role === 'seller') {
            interestsCount = await Interest.countDocuments({ seller: req.user._id });
            ordersCount = await Sales.countDocuments({ seller: req.user._id, isDeleted: { $ne: true } });
        }

        res.status(200).json({
            interests: interestsCount,
            orders: ordersCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user theme preference
// @route   PUT /api/auth/theme
// @access  Private
const updateTheme = async (req, res) => {
    try {
        const { mode } = req.body;

        if (!['light', 'dark', 'default'].includes(mode)) {
            return res.status(400).json({ message: 'Invalid theme mode' });
        }

        const user = await User.findById(req.user._id);

        if (user) {
            user.mode = mode;
            const updatedUser = await user.save();

            res.status(200).json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                mode: updatedUser.mode
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    getPublicProfile,
    getActivityCounts,
    updateTheme,
    logoutUser
};
