const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Asset = require('./models/Asset');
const Interest = require('./models/Interest');
const Business = require('./models/Business');
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
            },
            {
                fullName: 'Emily Chen',
                email: 'emily@logistics.io',
                password: 'password123',
                role: 'seller',
                companyName: 'FastTrack Logistics',
                phone: '+1 (555) 444-5555',
                avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80'
            }
        ]);

        const [seller1, seller2, buyer1, buyer2, buyer3, seller3] = users;
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
                description: 'Main headquarters for high-end tech liquidation and server recycling.'
            },
            {
                owner: seller2._id,
                businessName: 'TL Warehouse East',
                imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800',
                location: {
                    city: 'New York',
                    place: 'Brooklyn Navy Yard'
                },
                description: 'East coast distribution center and storage facility.'
            }
        ]);
        const [techHQ, techEast] = businesses;
        console.log('Businesses Created...');

        // Create Assets
        const assets = await Asset.create([
            {
                seller: seller1._id,
                title: 'Caterpillar 320 Excavator',
                description: '2020 model, 1500 hours. Excellent condition, regularly serviced by authorized dealer. Includes all standard buckets.',
                category: 'Industrial',
                condition: 'Used - Like New', // Note: Check enum fit
                price: 85000,
                location: 'Texas, USA',
                images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800'],
                status: 'active'
            },
            {
                seller: seller1._id,
                title: 'Forklift Toyota 8FGU25',
                description: 'Propane powered, 5000lb capacity. Solid pneumatic tires. Ready for warehouse work.',
                category: 'Industrial',
                condition: 'Used - Good',
                price: 18500,
                location: 'Ohio, USA',
                images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800'],
                status: 'active'
            },
            {
                seller: seller2._id,
                business: techHQ._id, // Linked to HQ
                title: 'Server Rack Cluster - Dell PowerEdge',
                description: 'Lot of 10 Dell PowerEdge R740 servers. 2x Intel Xeon Gold, 256GB RAM each. Decommissioned data center equipment.',
                category: 'IT Hardware',
                condition: 'Used - Like New',
                price: 45000,
                location: 'California, USA',
                images: ['https://images.unsplash.com/photo-1558494949-efc5270f9c63?auto=format&fit=crop&w=800'],
                status: 'active'
            },
            {
                seller: seller2._id,
                business: techEast._id, // Linked to East Warehouse
                title: 'Tesla Model S Fleet - 2022',
                description: 'Batch of 5 corporate vehicles. Low mileage (avg 15k). White exterior, black interior.',
                category: 'Vehicles',
                condition: 'Used - Like New',
                price: 250000,
                location: 'New York, USA',
                images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800'],
                status: 'active'
            }
        ]);

        const [excavator, forklift, servers, tesla] = assets;
        console.log('Assets Created...');

        // Create Interests
        await Interest.create([
            {
                buyer: buyer1._id,
                asset: excavator._id,
                seller: seller1._id,
                message: 'Is this unit available for inspection next week?',
                status: 'pending'
            },
            {
                buyer: buyer2._id,
                asset: servers._id,
                seller: seller2._id,
                message: 'Can you provide full specs sheet?',
                status: 'accepted'
            }
        ]);
        console.log('Interests Created...');

        // Businesses created earlier to link assets
        // console.log('Businesses Created...');

        console.log('Database Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
