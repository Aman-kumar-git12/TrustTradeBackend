const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, getPublicProfile, getActivityCounts } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/activity-counts', protect, getActivityCounts);
router.get('/public/:id', getPublicProfile);

module.exports = router;
