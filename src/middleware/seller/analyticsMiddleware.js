const { protect } = require('../../middleware/authMiddleware');

// Currently analytics controller handles deep logic via services.
// We expose protect here to maintain the "one middleware file per route" structure.
// Future analytics-specific middleware can be added here.

module.exports = {
    protect
};
