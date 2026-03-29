const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const { deactivateExpiredFeaturedEvents } = require('../jobs/featuredEventExpiryJob');

dotenv.config();

const run = async () => {
    try {
        await connectDB();

        const result = await deactivateExpiredFeaturedEvents();
        console.log(`[Cron] Finished featured event expiry job. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('[Cron] Featured event expiry job failed:', error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

void run();
