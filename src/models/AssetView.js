const mongoose = require('mongoose');

const assetViewSchema = mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Asset',
    },
    viewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ip: {
        type: String,
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now,
        index: { expires: '1h' } // Automatically delete documents after 1 hour to keep DB clean and act as the "lock"
    }
}, {
    timestamps: true,
});

// Index to quickly check for recent views by a user on an asset
assetViewSchema.index({ asset: 1, viewer: 1, ip: 1 });

const AssetView = mongoose.model('AssetView', assetViewSchema);

module.exports = AssetView;
