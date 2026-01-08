const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Asset = require('./models/Asset');
const Interest = require('./models/Interest');
const Business = require('./models/Business');
const Sales = require('./models/Sales');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Asset.deleteMany();
        await Interest.deleteMany();
        await Business.deleteMany();
        await Sales.deleteMany();
        console.log('Data Cleared...');

        // Create Users
        const users = await User.create([
            {
                fullName: 'John Seller',
                email: 'seller@demo.com',
                password: 'password123',
                role: 'seller',
                companyName: 'Heavy Machinery Co.',
                phone: '+1 (555) 123-4567',
                avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'
            },
            {
                fullName: 'Sarah Seller',
                email: 'sarah@techsell.com',
                password: 'password123',
                role: 'seller',
                companyName: 'Tech Liquidators Inc.',
                phone: '+1 (555) 987-6543',
                avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
            },
            {
                fullName: 'Mike Buyer',
                email: 'buyer@demo.com',
                password: 'password123',
                role: 'buyer',
                companyName: 'Construction Corp',
                phone: '+1 (555) 456-7890',
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
            },
            {
                fullName: 'Alice Buyer',
                email: 'alice@startups.com',
                password: 'password123',
                role: 'buyer',
                companyName: 'NextGen Startups',
                phone: '+1 (555) 789-0123',
                avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80'
            },
            {
                fullName: 'Robert Davis',
                email: 'robert@investors.com',
                password: 'password123',
                role: 'buyer',
                companyName: 'Global Assets Ltd',
                phone: '+1 (555) 222-3333',
                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
            }
        ]);

        const [seller1, seller2, buyer1, buyer2, buyer3] = users;
        console.log('Users Created...');

        // Create Businesses for Sarah
        const businesses = await Business.create([
            {
                owner: seller2._id,
                businessName: 'Tech Liquidators HQ',
                imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800',
                location: {
                    city: 'San Francisco',
                    place: 'Financial District'
                },
                description: 'Main headquarters for high-end tech liquidation and server recycling.',
                industry: 'IT Hardware'
            },
            {
                owner: seller2._id,
                businessName: 'TL Warehouse East',
                imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800',
                location: {
                    city: 'New York',
                    place: 'Brooklyn Navy Yard'
                },
                description: 'East coast distribution center and storage facility.',
                industry: 'Logistics'
            }
        ]);
        const [techHQ, techEast] = businesses;
        console.log('Businesses Created...');

        // Create Assets
        const assets = await Asset.create([
            // --- Assets for Tech Liquidators HQ (IT Hardware focus) ---
            {
                seller: seller2._id,
                business: techHQ._id,
                title: 'Server Rack Cluster - Dell PowerEdge',
                description: 'Lot of 10 Dell PowerEdge R740 servers. 2x Intel Xeon Gold, 256GB RAM each. Decommissioned data center equipment.',
                category: 'IT Hardware',
                condition: 'Used - Like New',
                price: 45000,
                location: 'California, USA',
                images: ['https://images.unsplash.com/photo-1558494949-efc5270f9c63?auto=format&fit=crop&w=800'],
                status: 'active',
                views: 1250
            },
            {
                seller: seller2._id,
                business: techHQ._id,
                title: 'MacBook Pro Bulk Lot (50 units)',
                description: '2021 M1 Pro models. 16GB RAM, 512GB SSD. Corporate refresh, all wiped and unlocked.',
                category: 'IT Hardware',
                condition: 'Used - Good',
                price: 75000,
                location: 'California, USA',
                images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=800'],
                status: 'inactive',
                views: 890
            },
            {
                seller: seller2._id,
                business: techHQ._id,
                title: 'Office Chairs - Herman Miller Aeron',
                description: 'Lot of 20 chairs. Fully adjustable, size B, graphite color. Minor wear on some armrests.',
                category: 'Office Equipment',
                condition: 'Used - Good',
                price: 8000,
                location: 'California, USA',
                images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800'],
                status: 'inactive',
                views: 2100
            },
            {
                seller: seller2._id,
                business: techHQ._id,
                title: 'Networking Equipment - Cisco Switches',
                description: 'Catalyst 9300 Series. Batch of 15 units. Removed from working environment.',
                category: 'IT Hardware',
                condition: 'Used - Good',
                price: 12000,
                location: 'California, USA',
                images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7f8?auto=format&fit=crop&w=800'],
                status: 'active',
                views: 340
            },
            {
                seller: seller2._id,
                business: techHQ._id,
                title: 'Standing Desks - Electric (10 Units)',
                description: 'Dual motor, memory keypad. White top, grey frame. Disassembled for shipping.',
                category: 'Office Equipment',
                condition: 'Used - Like New',
                price: 3500,
                location: 'California, USA',
                images: ['https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800'],
                status: 'active',
                views: 560
            },

            // --- Assets for TL Warehouse East (Logistics/Industrial focus) ---
            {
                seller: seller2._id,
                business: techEast._id,
                title: 'Tesla Model S Fleet - 2022',
                description: 'Batch of 5 corporate vehicles. Low mileage (avg 15k). White exterior, black interior.',
                category: 'Vehicles',
                condition: 'Used - Like New',
                price: 250000,
                location: 'New York, USA',
                images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800'],
                status: 'active',
                views: 3200
            },
            {
                seller: seller2._id,
                business: techEast._id,
                title: 'Warehouse Pallet Racking',
                description: 'Teardrop style. 500 uprights, 3000 beams. Wire decking included. Buyer must dismantle.',
                category: 'Industrial',
                condition: 'Used - Good',
                price: 25000,
                location: 'New York, USA',
                images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800'],
                status: 'inactive',
                views: 150
            },
            {
                seller: seller2._id,
                business: techEast._id,
                title: 'Forklift - Hyster 50',
                description: 'Electric 3-wheel counterbalanced. New battery installed last month.',
                category: 'Industrial',
                condition: 'Used - Good',
                price: 15000,
                location: 'New York, USA',
                images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800'],
                status: 'inactive',
                views: 980
            }
        ]);

        // Destructure important assets for linking
        const [
            serverCluster,
            macBookLot,
            chairs,
            switches,
            desks,
            teslaFleet,
            racking,
            forklift
        ] = assets;

        console.log('Assets Created...');

        // Helper to get random item from array
        const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Helper to get random subset of array
        const getRandomSubset = (arr, count) => {
            const shuffled = arr.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        // Potential Buyers (Everyone except Sarah)
        const potentialBuyers = users.filter(u => u._id.toString() !== seller2._id.toString());

        // Sarah's Assets
        const sarahsAssets = assets.filter(a => a.seller.toString() === seller2._id.toString());

        console.log('Generating Random Leads...');
        const interestsData = [];

        // Generate 3-5 leads for each of Sarah's active assets
        const activeAssets = sarahsAssets.filter(a => a.status === 'active');

        activeAssets.forEach(asset => {
            // Random number of leads (1 to 4)
            const numLeads = Math.floor(Math.random() * 4) + 1;
            const buyers = getRandomSubset(potentialBuyers, numLeads);

            buyers.forEach(buyer => {
                const statuses = ['pending', 'negotiating', 'rejected', 'accepted'];
                // Weighted status: more pending/negotiating
                const status = Math.random() > 0.3 ?
                    (Math.random() > 0.5 ? 'pending' : 'negotiating') :
                    getRandomItem(statuses);

                interestsData.push({
                    buyer: buyer._id,
                    asset: asset._id,
                    seller: seller2._id,
                    message: `I am interested in this ${asset.title}. Is it still available?`,
                    status: status,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)) // Random time in last 10 days
                });
            });
        });

        await Interest.create(interestsData);
        console.log(`Created ${interestsData.length} Interests (Leads)...`);

        console.log('Generating Sales History...');
        const salesData = [];

        // 1. Create Sales for existing 'sold' assets
        const soldAssets = sarahsAssets.filter(a => a.status === 'inactive');
        soldAssets.forEach(asset => {
            const buyer = getRandomItem(potentialBuyers);
            salesData.push({
                asset: asset._id,
                seller: seller2._id,
                buyer: buyer._id,
                finalPrice: asset.price * (0.8 + Math.random() * 0.2), // 80-100% of asking price
                dealDate: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)), // Random time in last 60 days
                status: 'completed'
            });
        });

        // 2. Generate 6 months of historical sales data (Creating new sold assets for chart population)
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            // Create 1-3 sales per month
            const salesCount = Math.floor(Math.random() * 3) + 1;

            for (let j = 0; j < salesCount; j++) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, Math.floor(Math.random() * 28) + 1);
                const randomBuyer = getRandomItem(potentialBuyers);

                // Varied prices
                const basePrice = Math.floor(Math.random() * 20000) + 5000;

                const dummyAsset = await Asset.create({
                    seller: seller2._id,
                    business: Math.random() > 0.5 ? techHQ._id : techEast._id, // Random business
                    title: `Sold Item #${i}${j} - ${monthDate.toLocaleString('default', { month: 'short' })}`,
                    description: 'Historical sales data for chart visualization.',
                    category: getRandomItem(['IT Hardware', 'Vehicles', 'Industrial', 'Office Equipment']),
                    condition: 'Used - Good',
                    price: basePrice,
                    location: 'California, USA',
                    images: ['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800'],
                    status: 'inactive',
                    views: Math.floor(Math.random() * 1000) + 100,
                    createdAt: monthDate
                });

                salesData.push({
                    asset: dummyAsset._id,
                    seller: seller2._id,
                    buyer: randomBuyer._id,
                    finalPrice: basePrice,
                    dealDate: monthDate,
                    status: 'completed'
                });
            }
        }

        await Sales.create(salesData);
        console.log(`Created ${salesData.length} Sales Records...`);

        console.log('Database Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
