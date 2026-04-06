const mongoose = require('mongoose');

const agentSessionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [
        {
            role: {
                type: String,
                required: true,
                enum: ['user', 'assistant', 'system']
            },
            content: {
                type: String,
                required: true
            },
            metadata: {
                type: Map,
                of: mongoose.Schema.Types.Mixed
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    mode: {
        type: String,
        enum: ['conversation', 'agent'],
        default: 'conversation'
    },
    step: {
        type: String,
        enum: [
            'idle',
            'collecting_filters',
            'showing_options',
            'awaiting_selection',
            'quoted',
            'awaiting_confirmation',
            'payment_created',
            'payment_pending',
            'payment_verified',
            'order_completed',
            'cancelled',
            'failed'
        ],
        default: 'idle'
    },
    intent: {
        type: String,
        enum: ['browse', 'buy', 'compare']
    },
    category: String,
    query: String,
    budgetMax: Number,
    quantity: Number,
    assetIds: [String],
    selectedAssetId: String,
    reservationId: String,
    quoteId: String,
    paymentIntentId: String,
    orderId: String,
    lastError: String,
    expiresAt: Date,
    deletedAt: {
        type: Date,
        default: null
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for TTL or easy cleanup if needed
agentSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 * 7 }); // 7 days
agentSessionSchema.index({ deletedAt: 1 }); // Optimize list queries

const AgentSession = mongoose.model('AgentSession', agentSessionSchema);

module.exports = AgentSession;
