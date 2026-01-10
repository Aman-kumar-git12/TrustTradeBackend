const mongoose = require('mongoose');

const salesSchema = mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Asset',
    },
    interest: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Interest',
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User',
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User',
    },
    finalPrice: {
        type: Number,
        required: false,
    },
    price: {
        type: Number,
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
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
        enum: ['sold', 'unsold'],
        default: 'sold'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

const Sales = mongoose.model('Sales', salesSchema);

module.exports = Sales;
