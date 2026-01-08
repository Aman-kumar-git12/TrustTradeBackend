const mongoose = require('mongoose');

const assetSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
        // Optional because individual sellers might not have a business entity
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    condition: {
        type: String,
        enum: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'],
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    images: [{
        type: String,
    }],
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    statusHistory: [{
        status: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
}, {
    timestamps: true,
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
