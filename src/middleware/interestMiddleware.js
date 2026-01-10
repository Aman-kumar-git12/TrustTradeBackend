const { protect } = require('./authMiddleware');

// Middleware for interest routes
// Currently re-exports protect to satisfy 'middleware file per route' requirement

module.exports = {
    protect
};
