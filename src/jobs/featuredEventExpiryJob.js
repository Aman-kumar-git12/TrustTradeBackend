const Event = require('../models/Event');

const deactivateExpiredFeaturedEvents = async () => {
    const now = new Date();

    try {
        const result = await Event.updateMany(
            {
                eventType: 'FEATURED EVENT',
                isActive: true,
                expiresAt: { $ne: null, $lte: now }
            },
            {
                $set: { isActive: false }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Cron] Deactivated ${result.modifiedCount} expired featured event(s) at ${now.toISOString()}`);
        }

        return result;
    } catch (error) {
        console.error('[Cron] Failed to deactivate expired featured events:', error.message);
        throw error;
    }
};

module.exports = {
    deactivateExpiredFeaturedEvents
};
