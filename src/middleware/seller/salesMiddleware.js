const { protect } = require('../../middleware/authMiddleware');

// Middleware for sales routes
// Currently re-exports protect

module.exports = {
    protect
};
