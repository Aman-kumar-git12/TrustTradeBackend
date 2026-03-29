const { deactivateExpiredFeaturedEvents } = require('../jobs/featuredEventExpiryJob');

const runFeaturedEventExpiryCron = async (req, res) => {
    const configuredSecret = process.env.CRON_SECRET;
    const providedSecret = req.query.key || req.get('x-cron-secret');

    if (!configuredSecret) {
        return res.status(500).json({
            success: false,
            message: 'CRON_SECRET is not configured'
        });
    }

    if (providedSecret !== configuredSecret) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized cron request'
        });
    }

    try {
        const result = await deactivateExpiredFeaturedEvents();

        res.status(200).json({
            success: true,
            job: 'featured-event-expiry',
            matchedCount: result.matchedCount || 0,
            modifiedCount: result.modifiedCount || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    runFeaturedEventExpiryCron
};
