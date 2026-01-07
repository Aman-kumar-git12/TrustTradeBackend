const mongoose = require('mongoose');

const salesSchema = mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Asset',
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    finalPrice: {
        type: Number,
        required: true,
    },
    dealDate: {
        type: Date,
        default: Date.now,
    },
    negotiationDuration: {
        type: Number, // In hours or days
        default: 0
    },
    status: {
        type: String,
        enum: ['completed', 'cancelled', 'refunded'],
        default: 'completed'
    }
}, {
    timestamps: true,
});

const Sales = mongoose.model('Sales', salesSchema);

module.exports = Sales;
