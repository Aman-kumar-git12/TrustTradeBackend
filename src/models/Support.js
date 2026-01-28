const mongoose = require('mongoose');

const supportSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['general', 'technical', 'billing', 'report', 'other'],
        default: 'general'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    adminResponse: {
        type: String,
        trim: true
    },
    resolvedAt: {
        type: Date
    },
    attachments: [{
        type: String // URLs to any uploaded files
    }]
}, {
    timestamps: true
});

const Support = mongoose.model('Support', supportSchema);

module.exports = Support;
