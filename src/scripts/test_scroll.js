const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const dotenv = require('dotenv');
// Adjust path to .env depending on where this is run. Assuming run from Backend root
dotenv.config();

const test = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is missing in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Fetch first batch
        console.log('Fetching Batch 1 (Limit 5)...');
        const batch1 = await Asset.aggregate([
            { $match: { status: 'active' } },
            { $sample: { size: 5 } }
        ]);

        console.log(`Batch 1 IDs: ${batch1.map(a => a._id).join(', ')}`);

        if (batch1.length === 0) {
            console.log("No assets found in DB. Seed DB first.");
            return;
        }

        // 2. Fetch second batch excluding first batch
        const excludeIds = batch1.map(a => a._id);
        console.log('\nFetching Batch 2 (Limit 5) excluding Batch 1...');

        const matchStage = {
            status: 'active',
            _id: { $nin: excludeIds }
        };

        const batch2 = await Asset.aggregate([
            { $match: matchStage },
            { $sample: { size: 5 } }
        ]);

        console.log(`Batch 2 IDs: ${batch2.map(a => a._id).join(', ')}`);

        const duplicates = batch2.filter(b => excludeIds.some(e => e.equals(b._id)));
        if (duplicates.length > 0) {
            console.error('ERROR: Duplicates found in Batch 2!');
        } else {
            console.log('SUCCESS: No duplicates found.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
    }
};

test();
