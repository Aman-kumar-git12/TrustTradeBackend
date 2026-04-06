const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['order_received', 'payment_confirmed', 'stock_low', 'system_alert', 'ai_match'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    },
    relatedModel: {
        type: String,
        enum: ['Asset', 'Order', 'Sale', 'Interest']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
