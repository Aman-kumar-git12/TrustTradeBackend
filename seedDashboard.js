const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Asset = require('./src/models/Asset');
const Interest = require('./src/models/Interest');
const Sales = require('./src/models/Sales');
const connectDB = require('./src/config/db');

dotenv.config();
connectDB();

const seedDashboardData = async () => {
    try {
        // Targeted seeding for Sarah
        let seller = await User.findOne({ email: 'sarah@techsell.com' });

        // Fallback if Sarah not found
        if (!seller) {
            console.log('Sarah not found. Picking any seller...');
            seller = await User.findOne({ role: 'seller' });
        }

        let buyer = await User.findOne({ role: 'buyer' });
        // Fallback user check
        if (!seller) seller = await User.findOne({});
        if (!buyer) buyer = await User.findOne({ _id: { $ne: seller._id } });

        if (!seller || !buyer) {
            console.log('Insufficient users to seed dashboard.');
            process.exit(1);
        }

        console.log('Seeding HIGH VOLUME Dashboard Data for Seller:', seller.email);

        // 1. Update Views on Assets
        const assets = await Asset.find({ seller: seller._id });
        for (const asset of assets) {
            asset.views = Math.floor(Math.random() * 200) + 50; // Random views 50-250
            await asset.save();
        }
        console.log('Updated Asset Views');

        // 2. Create Sales History (Last 6 months)
        await Sales.deleteMany({ seller: seller._id }); // Clear old sales

        const salesData = [];
        const months = [0, 1, 2, 3, 4, 5]; // past 6 months

        for (const i of months) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);

            // 5-15 sales per month for better charts
            const numSales = Math.floor(Math.random() * 10) + 5;

            for (let j = 0; j < numSales; j++) {
                salesData.push({
                    seller: seller._id,
                    buyer: buyer._id,
                    asset: assets[0] ? assets[0]._id : new mongoose.Types.ObjectId(),
                    finalPrice: Math.floor(Math.random() * 50000) + 2000,
                    dealDate: new Date(date.getTime() + Math.random() * 86400000 * 20), // Random day in month
                    negotiationDuration: Math.floor(Math.random() * 72) + 2, // 2-74 hours
                    status: 'completed'
                });
            }
        }
        await Sales.insertMany(salesData);
        console.log(`Created ${salesData.length} mock sales records`);

        // 3. Create Interests (Leads)
        await Interest.deleteMany({ seller: seller._id });
        const interestData = [];

        const statuses = ['pending', 'accepted', 'rejected', 'negotiating'];
        for (const asset of assets) {
            // 3-12 interests per asset
            const numInterests = Math.floor(Math.random() * 10) + 3;
            for (let k = 0; k < numInterests; k++) {
                interestData.push({
                    buyer: buyer._id,
                    seller: seller._id,
                    asset: asset._id,
                    message: "I am extremely interested in purchasing this asset. Please contact me.",
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    negotiationStartDate: new Date()
                });
            }
        }
        await Interest.insertMany(interestData);
        console.log(`Created ${interestData.length} mock interest records`);

        console.log('Dashboard Data Seeding Complete');
        process.exit();
    } catch (error) {
        console.error('Error seeding dashboard data:', error);
        process.exit(1);
    }
};

seedDashboardData();
