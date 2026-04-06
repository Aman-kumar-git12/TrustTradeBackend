const mongoose = require('mongoose');

const inventoryReservationSchema = mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    quoteId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'released', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    }
}, {
    timestamps: true
});

// TTL index for auto-expiration from MongoDB collection
inventoryReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const InventoryReservation = mongoose.model('InventoryReservation', inventoryReservationSchema);

module.exports = InventoryReservation;
