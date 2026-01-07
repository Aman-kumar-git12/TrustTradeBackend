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
    negotiationStartDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;
