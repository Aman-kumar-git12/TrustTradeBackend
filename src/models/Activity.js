const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'USER_REGISTER',
            'USER_LOGIN',
            'ASSET_LISTED',
            'ORDER_INITIATED',
            'ORDER_ACCEPTED',
            'PAYMENT_INITIATED',
            'PAYMENT_SUCCESS',
            'ASSET_PURCHASED',
            'ACCOUNT_BECAME_SELLER',
            'OTHER'
        ]
    },
    description: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        // Can reference User, Asset, Interest, or Sale depending on context
    },
    relatedModel: {
        type: String,
        enum: ['User', 'Asset', 'Interest', 'Sale', 'Business', null]
    },
    metadata: {
        type: Object
        // For localized snapshots (e.g. price at time of sale)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast retrieval of latest activities
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
