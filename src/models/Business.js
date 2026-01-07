const mongoose = require('mongoose');

const businessSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    businessName: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    location: {
        city: {
            type: String,
            required: true,
        },
        place: { // Specific address or area
            type: String,
            required: true,
        }
    },
    description: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
