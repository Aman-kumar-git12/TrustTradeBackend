const mongoose = require('mongoose');

const saleSchema = mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, // Optional if sold outside platform? But here we have buyer.
        ref: 'User',
    },
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Asset',
    },
    interest: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Interest',
    },
    price: { // Unit Price
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    soldQuantity: {
        type: Number, // Explicitly requested field
    },
    totalAmount: { // Total Deal Value
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['sold', 'unsold', 'completed', 'refunded', 'disputed'],
        default: 'sold',
    },
    notes: {
        type: String,
    }
}, {
    timestamps: true,
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
