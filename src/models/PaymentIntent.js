const mongoose = require('mongoose');

const paymentIntentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryReservation',
        required: true
    },
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'pending', 'succeeded', 'failed', 'cancelled'],
        default: 'created'
    },
    idempotencyKey: {
        type: String,
        unique: true
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

const PaymentIntent = mongoose.model('PaymentIntent', paymentIntentSchema);

module.exports = PaymentIntent;
