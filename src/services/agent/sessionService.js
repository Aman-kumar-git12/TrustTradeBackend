const AgentSession = require('../../models/AgentSession');

/**
 * Session Lifecycle Service for the Strategic Agent
 * Manages the explicit transition of the buying wizard state.
 */

const getSession = async (sessionId, userId) => {
    return await AgentSession.findOne({ sessionId, userId });
};

const updateSession = async (sessionId, userId, updateData) => {
    return await AgentSession.findOneAndUpdate(
        { sessionId, userId },
        { ...updateData },
        { new: true, upsert: true }
    );
};

const cancelSession = async (sessionId, userId) => {
    return await AgentSession.findOneAndUpdate(
        { sessionId, userId },
        { step: 'cancelled', lastError: 'User cancelled the session' },
        { new: true }
    );
};

const completeSession = async (sessionId, userId, orderId) => {
    return await AgentSession.findOneAndUpdate(
        { sessionId, userId },
        { step: 'order_completed', orderId },
        { new: true }
    );
};

module.exports = {
    getSession,
    updateSession,
    cancelSession,
    completeSession
};
