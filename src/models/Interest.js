const mongoose = require('mongoose');

const interestSchema = mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
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
    message: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'negotiating'],
        default: 'pending',
    },
    quantity: {
        type: Number,
        default: 1,
        required: true,
    },
    negotiationStartDate: {
        type: Date,
    },
    // Sales Data
    salesStatus: {
        type: String,
        enum: ['sold', 'unsold'],
        default: null
    },
    soldPrice: {
        type: Number, // Unit Price at sale
    },
    soldQuantity: {
        type: Number,
    },
    soldTotalAmount: {
        type: Number, // Total Deal Value
    },
    soldDate: {
        type: Date,
    }
}, {
    timestamps: true,
});

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;
