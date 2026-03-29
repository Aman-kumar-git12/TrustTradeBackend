const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    routes: {
        type: [String],
        default: []
    },
    audience: {
        type: [String],
        default: []
    },
    summary: {
        type: String,
        required: true
    },
    features: {
        type: [String],
        default: []
    },
    keywords: {
        type: [String],
        default: []
    },
    sourceText: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    }
}, {
    timestamps: true
});

// Add text index for keyword/title search fallback
knowledgeSchema.index({ title: 'text', keywords: 'text', summary: 'text' });

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

module.exports = Knowledge;
