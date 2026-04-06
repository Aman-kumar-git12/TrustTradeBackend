const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const AssetSchema = new mongoose.Schema({}, { strict: false });
const Asset = mongoose.model('Asset', AssetSchema);

async function run() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trusttrade';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        console.log('Ensuring reservedQuantity: 0 for all assets missing the field...');
        const result = await Asset.updateMany(
            { reservedQuantity: { $exists: false } },
            { $set: { reservedQuantity: 0 } }
        );

        console.log(`Updated ${result.modifiedCount} assets with reservedQuantity: 0.`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
