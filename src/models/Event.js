const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
    },
    description: {
        type: String,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    link: {
        type: String,
    },
    eventType: {
        type: String,
        default: 'FEATURED EVENT',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    expiresAt: {
        type: Date,
    }
}, {
    timestamps: true,
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
