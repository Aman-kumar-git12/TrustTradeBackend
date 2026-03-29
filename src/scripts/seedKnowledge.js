const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Set root path relative to the script location
const rootPath = path.resolve(__dirname, '../../../Backend');
dotenv.config({ path: path.join(rootPath, '.env') });

const Knowledge = require('../models/Knowledge');

const JSON_PATH = path.resolve(__dirname, '../../../Agent/app/data/website_embeddings.json');

const seedKnowledge = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in the environment.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        if (!fs.existsSync(JSON_PATH)) {
            throw new Error(`Knowledge JSON not found at: ${JSON_PATH}`);
        }

        const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        console.log(`Found ${data.length} records in JSON.`);

        // Clear existing knowledge
        console.log('Clearing existing knowledge collection...');
        await Knowledge.deleteMany({});

        // Prepare records
        const records = data.map(item => ({
            id: item.id,
            title: item.title,
            routes: item.routes || [],
            audience: item.audience || [],
            summary: item.summary,
            features: item.features || [],
            keywords: item.keywords || [],
            sourceText: item.source_text,
            embedding: item.embedding
        }));

        // Insert records
        console.log('Inserting records...');
        await Knowledge.insertMany(records);
        console.log('Successfully seeded knowledge base to MongoDB.');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};

seedKnowledge();
