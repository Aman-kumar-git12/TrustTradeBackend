const { protect } = require('./authMiddleware');

// Middleware for asset routes
// Currently re-exports protect to satisfy 'middleware file per route' requirement

module.exports = {
    protect
};
