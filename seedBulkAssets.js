const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Business = require('./src/models/Business');
const Asset = require('./src/models/Asset');
const connectDB = require('./src/config/db');

dotenv.config();

const assets = [
    // --- INDUSTRIAL ---
    { title: "Prime Steel Scrap (HMS 1&2) - 50 Ton Lot", description: "Bulk lot of high-quality heavy melting steel scrap. Sourced from dismantled industrial structures.", category: "Industrial", condition: "Used - Good", price: 2850000, quantity: 50, location: "Navi Mumbai, Maharashtra", images: ["https://images.unsplash.com/photo-1549420556-912b77af60ba?w=800"] },
    { title: "Aluminum Ingots (99.7% Purity, 1 Ton)", description: "High-grade aluminum ingots suitable for casting and alloy production. Standard 20kg bars.", category: "Industrial", condition: "New", price: 185000, quantity: 25, location: "Jharsuguda, Odisha", images: ["https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?w=800"] },
    { title: "Copper Cathodes (Grade A, 5 Tons)", description: "LME Registered Grade A Copper Cathodes. Purity 99.99%. Ideal for electrical wire manufacturing.", category: "Industrial", condition: "New", price: 3200000, quantity: 5, location: "Kolkata, West Bengal", images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"] },
    { title: "Caustic Soda Flakes (Bulk 50kg Bags x 100)", description: "Industrial strength Sodium Hydroxide for soap and paper processing.", category: "Industrial", condition: "New", price: 215000, quantity: 20, location: "Dahej, Gujarat", images: ["https://images.unsplash.com/photo-1603121544414-f710b7119931?w=800"] },
    { title: "Industrial Resin (Epoxy Grade, 200L Drum x 10)", description: "Liquid epoxy resin for industrial flooring and coating. High durability.", category: "Industrial", condition: "New", price: 450000, quantity: 15, location: "Vadodara, Gujarat", images: ["https://images.unsplash.com/photo-1541888941257-182097381cfb?w=800"] },

    // --- AGRICULTURAL ---
    { title: "Guntur Red Chilli (S17 Teja, 500kg Lot)", description: "Premium export quality dried red chillies from Guntur. High spice levels.", category: "Agricultural", condition: "New", price: 125000, quantity: 20, location: "Guntur, Andhra Pradesh", images: ["https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?w=800"] },
    { title: "Export Grade Basmati Rice (1121 Sella, 1 Ton)", description: "Long grain aromatic Basmati rice. Double polished, sortex cleaned.", category: "Agricultural", condition: "New", price: 95000, quantity: 50, location: "Karnal, Haryana", images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800"] },
    { title: "Organic Turmeric Powder (Bulk 25kg Bags x 40)", description: "High curcumin turmeric powder. Pesticide-free, traditionally processed.", category: "Agricultural", condition: "New", price: 160000, quantity: 15, location: "Erode, Tamil Nadu", images: ["https://images.unsplash.com/photo-1615485240384-552e400fd76c?w=800"] },
    { title: "Darjeeling Black Tea (Bulk Wooden Chests, 100kg)", description: "Standard grade black tea for blending. Strong flavor, classic aroma.", category: "Agricultural", condition: "New", price: 45000, quantity: 10, location: "Siliguri, West Bengal", images: ["https://images.unsplash.com/photo-1563911191334-08197775924d?w=800"] },
    { title: "Alfonso Mango Pulp (Bulk Aseptic Tins, 240kg)", description: "Pure Alfonso mango pulp. No added sugar. Export quality.", category: "Agricultural", condition: "New", price: 38000, quantity: 30, location: "Ratnagiri, Maharashtra", images: ["https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800"] },

    // --- TEXTILES ---
    { title: "Combed Cotton Yarn (30s Count, 1000kg)", description: "High-quality combed cotton yarn for knitting. Low hairiness, high strength.", category: "Textiles", condition: "New", price: 260000, quantity: 10, location: "Tiruppur, Tamil Nadu", images: ["https://images.unsplash.com/photo-1605658658452-9426f338d384?w=800"] },
    { title: "Premium Denim Fabric (14oz Indigo, 1000 Meters)", description: "Heavyweight indigo denim fabric. Ready for garment manufacturing.", category: "Textiles", condition: "New", price: 185000, quantity: 20, location: "Surat, Gujarat", images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800"] },
    { title: "Export Quality Buffalo Leather Hides (5000 Sq Ft)", description: "Full grain buffalo leather. Suitable for footwear and bags.", category: "Textiles", condition: "New", price: 750000, quantity: 5, location: "Kanpur, Uttar Pradesh", images: ["https://images.unsplash.com/photo-1533512930330-4ac257c86793?w=800"] },
    { title: "Mulberry Silk Fabric (Wholesale 100 Meters)", description: "Pure Mulberry silk fabric. Vibrant colors, soft texture. High-end retail grade.", category: "Textiles", condition: "New", price: 125000, quantity: 12, location: "Bhagalpur, Bihar", images: ["https://images.unsplash.com/photo-1604928141064-201ce675ac1f?w=800"] },

    // --- CONSTRUCTION ---
    { title: "OPC 53 Grade Cement (Pallet - 1000 Bags)", description: "Standard 53 grade Portland cement for high-strength requirements.", category: "Construction", condition: "New", price: 365000, quantity: 10, location: "Raipur, Chhattisgarh", images: ["https://images.unsplash.com/photo-1530124560676-587cab8a380e?w=800"] },
    { title: "TMT Reinforcement Bars (FE 550, 10 Tons)", description: "High-ductility TMT bars. Grade FE 550. Bundled in standard lengths.", category: "Construction", condition: "New", price: 640000, quantity: 8, location: "Durgapur, West Bengal", images: ["https://images.unsplash.com/photo-1541888941257-182097381cfb?w=800"] },
    { title: "Vitrified Floor Tiles (600x600, 2000 Sq Ft)", description: "Double charge vitrified tiles. High gloss finish, scratch resistant.", category: "Construction", condition: "New", price: 120000, quantity: 15, location: "Morbi, Gujarat", images: ["https://images.unsplash.com/photo-1613233850329-85ae7bc27d14?w=800"] },
    { title: "Sanitaryware Suite (Bulk 50 Units)", description: "Ceramic toilets and washbasins. Modern design, white finish.", category: "Construction", condition: "New", price: 295000, quantity: 6, location: "Thane, Maharashtra", images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800"] },

    // --- RENEWABLE ENERGY ---
    { title: "Mono PERC Solar Panels (540W, Pallet of 31)", description: "High-efficiency monocrystalline solar panels. Tier-1 manufacturer.", category: "Renewable Energy", condition: "New", price: 520000, quantity: 20, location: "Jaipur, Rajasthan", images: ["https://images.unsplash.com/photo-1509391366360-fe5bb65858cf?w=800"] },
    { title: "B2B Lithium Battery Pack (10kWh, Unit of 5)", description: "LiFePO4 battery packs for solar storage. Long cycle life.", category: "Renewable Energy", condition: "New", price: 750000, quantity: 10, location: "Manesar, Haryana", images: ["https://images.unsplash.com/photo-1592659762303-90081d34b277?w=800"] },

    // --- IT HARDWARE ---
    { title: "ThinkPad X1 Carbon Gen 9 (Corporate Lot of 10)", description: "Bulk lot of 10 enterprise laptops. i7 / 16GB / 512GB SSD.", category: "IT Hardware", condition: "New", price: 950000, quantity: 5, location: "Bengaluru, Karnataka", images: ["https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800"] },
    { title: "Dell Latitude 5420 (Corporate Return Lot of 20)", description: "Ex-lease corporate laptops. Professionally tested.", category: "IT Hardware", condition: "Used - Like New", price: 480000, quantity: 5, location: "Hyderabad, Telangana", images: ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800"] },
    { title: "Enterprise SSD 2TB NVMe (Wholesale Case of 24)", description: "Bulk case of 24 high-speed NVMe SSDs for server use.", category: "IT Hardware", condition: "New", price: 384000, quantity: 10, location: "Gurugram, Haryana", images: ["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800"] },
    { title: "Cisco Catalyst 9300 Switches (Pack of 5)", description: "Enterprise networking switches with StackWise technology.", category: "IT Hardware", condition: "New", price: 850000, quantity: 3, location: "Pune, Maharashtra", images: ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800"] },

    // --- MEDICAL ---
    { title: "3-Ply Surgical Masks (Bulk Carton - 10,000 Pcs)", description: "Wholesale supply of high-filtration surgical masks.", category: "Medical", condition: "New", price: 45000, quantity: 100, location: "Chennai, Tamil Nadu", images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800"] },
    { title: "Hospital Bed - Semi-Fowler (Set of 10)", description: "Adjustable hospital beds with mattress and railing.", category: "Medical", condition: "New", price: 185000, quantity: 5, location: "Hyderabad, Telangana", images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800"] },
    { title: "Medical PCR Test Kits (Bulk Case 500 Tests)", description: "Rapid high-accuracy PCR kits for clinical use.", category: "Medical", condition: "New", price: 225000, quantity: 15, location: "Bhubaneshwar, Odisha", images: ["https://images.unsplash.com/photo-1579152276541-11d2e5ed41bb?w=800"] },
    { title: "N95 Respirator Masks (Case of 2000)", description: "High-grade N95 masks for healthcare workers. NIOSH certified.", category: "Medical", condition: "New", price: 150000, quantity: 20, location: "Ahmedabad, Gujarat", images: ["https://images.unsplash.com/photo-1584634731339-252c5aba195e?w=800"] },

    // --- ELECTRONICS ---
    { title: "Premium Mobile Chargers 20W (Wholesale Lot 500)", description: "Bulk lot of 500 PD fast chargers. Type-C port.", category: "Electronics", condition: "New", price: 125000, quantity: 50, location: "Karol Bagh, Delhi", images: ["https://images.unsplash.com/photo-1584006682522-dc17d6c0d9ac?w=800"] },
    { title: "LED Downlight 15W (Wholesale Case 200 Pcs)", description: "Energy-efficient recessed LED lights for commercial projects.", category: "Electronics", condition: "New", price: 68000, quantity: 40, location: "Indore, Madhya Pradesh", images: ["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800"] },
    { title: "Industrial LED Floodlights (50W, Lot of 100)", description: "Weatherproof floodlights for parking and warehouse use.", category: "Electronics", condition: "New", price: 195000, quantity: 10, location: "Surat, Gujarat", images: ["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800"] },

    // --- VEHICLES ---
    { title: "Heavy-Duty Truck Tires (Fleet Pack of 20)", description: "All-season radial tires for commercial trucks. Size 295/80R22.5.", category: "Vehicles", condition: "New", price: 580000, quantity: 20, location: "Transport Nagar, Delhi", images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"] },
    { title: "Premium Engine Oil 15W-40 (Bulk 20L Buckets x 50)", description: "Bulk supply of diesel engine oil for heavy transport.", category: "Vehicles", condition: "New", price: 325000, quantity: 50, location: "Ludhiana, Punjab", images: ["https://images.unsplash.com/photo-1621905252507-b35482cdca4b?w=800"] },
    { title: "Brake Lining Sets (Fleet Wholesale Lot 100)", description: "Heavy transport brake linings for Tata/Leyland trucks.", category: "Vehicles", condition: "New", price: 115000, quantity: 30, location: "Kanpur, Uttar Pradesh", images: ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800"] },

    // --- MANUFACTURING ---
    { title: "Precision Ball Bearings (Carton of 1000)", description: "High-precision 6205-ZZ ball bearings. Chrome steel construction.", category: "Manufacturing", condition: "New", price: 85000, quantity: 20, location: "Pune, Maharashtra", images: ["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800"] },
    { title: "Industrial Conveyor Belt (PVC, 100 Meters)", description: "Durable PVC conveyor belt for food and warehouse processing.", category: "Manufacturing", condition: "New", price: 215000, quantity: 5, location: "Ambala, Haryana", images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"] },

    // --- OFFICE EQUIPMENT ---
    { title: "A4 Photo Copier Paper (Pallet - 500 Reams)", description: "75 GSM bright white paper. Optimal for high-speed printing.", category: "Office Equipment", condition: "New", price: 92000, quantity: 10, location: "Noida, Uttar Pradesh", images: ["https://images.unsplash.com/photo-1517646287270-a5a543633887?w=800"] },
    { title: "Ergonomic Mesh Chairs (Corporate Set of 25)", description: "High-back ergonomic office chairs with lumbar support.", category: "Office Equipment", condition: "New", price: 165000, quantity: 10, location: "Noida, Uttar Pradesh", images: ["https://images.unsplash.com/photo-1505843490701-5be55ccb03a1?w=800"] },
    { title: "Laser Toner Cartridges (Mixed Pack of 100)", description: "High-yield toner cartridges for enterprise printers.", category: "Office Equipment", condition: "New", price: 345000, quantity: 15, location: "Okhla, Delhi", images: ["https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800"] },

    // --- MISC / HARDWARE ---
    { title: "Industrial Storage Racks (Heavy Duty, 10 Units)", description: "Pallet racking system for warehouses. 2-ton capacity per level.", category: "Industrial", condition: "Used - Like New", price: 420000, quantity: 5, location: "Bhiwandi, Maharashtra", images: ["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800"] }
];

const seedBulkAssets = async () => {
    try {
        await connectDB();

        let seller = await User.findOne({ email: 'wholesale@bharat.in' });
        if (!seller) {
            seller = await User.create({
                fullName: 'Bharat Wholesale Corp', email: 'wholesale@bharat.in', password: 'password123', role: 'seller',
                description: 'India\'s leading B2B marketplace supplier for industrial, medical, and office equipment.', phone: '+91 9876543210'
            });
            console.log('Wholesale Seller Created:', seller.email);
        }

        const businessesData = [
            { name: 'Gujarat Industrial Hub', city: 'Ahmedabad', place: 'GIDC Industrial Area', desc: 'Core industrial and manufacturing supply center.' },
            { name: 'Bengaluru Digitech Supply', city: 'Bengaluru', place: 'Electronic City Phase 1', desc: 'Specialized in IT hardware and electronic bulk procurement.' },
            { name: 'Mumbai Healthcare Solutions', city: 'Mumbai', place: 'Bandra-Kurla Complex', desc: 'Premium medical disposables and hospital infrastructure supply.' },
            { name: 'Delhi Logistics & Auto', city: 'Delhi', place: 'Transport Nagar', desc: 'Auto parts, vehicle consumables, and office administration supplies.' },
            { name: 'Kolkata Export Nexus', city: 'Kolkata', place: 'Leather Complex', desc: 'Eastern India center for leather, textiles, and bulk export goods.' },
            { name: 'Jaipur Green Power', city: 'Jaipur', place: 'Sitapura Industrial Area', desc: 'Renewable energy components and specialized engineering supplies.' }
        ];

        const businesses = [];
        for (const biz of businessesData) {
            let b = await Business.findOne({ businessName: biz.name });
            if (!b) {
                b = await Business.create({ owner: seller._id, businessName: biz.name, location: { city: biz.city, place: biz.place }, description: biz.desc });
                console.log('Business Created:', biz.name);
            }
            businesses.push(b);
        }

        await Asset.deleteMany({ seller: seller._id });
        console.log('Cleared existing assets for Bharat Wholesale Corp');

        const assetsToInsert = assets.map((asset, i) => {
            const businessIndex = i % businesses.length;
            return { ...asset, seller: seller._id, business: businesses[businessIndex]._id, status: 'active' };
        });

        const inserted = await Asset.insertMany(assetsToInsert);
        console.log(`Successfully seeded ${inserted.length} bulk assets into the marketplace.`);

        process.exit(0);
    } catch (error) {
        console.error('Seeding ERROR:', error);
        process.exit(1);
    }
};

seedBulkAssets();
