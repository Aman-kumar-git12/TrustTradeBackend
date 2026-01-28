const Activity = require('../models/Activity');

/**
 * Logs a new activity to the database.
 * 
 * @param {Object} params - The activity parameters.
 * @param {string} params.userId - The ID of the user performing the action.
 * @param {string} params.action - The action type (e.g., 'USER_REGISTER').
 * @param {string} params.description - Human readable description.
 * @param {string} [params.relatedId] - Optional ID of related entity (Asset, Order, etc.).
 * @param {string} [params.relatedModel] - Optional model name of related entity.
 * @param {Object} [params.metadata] - Optional extra data.
 */
const logActivity = async ({ userId, action, description, relatedId = null, relatedModel = null, metadata = {} }) => {
    try {
        await Activity.create({
            user: userId,
            action,
            description,
            relatedId,
            relatedModel,
            metadata
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // We don't throw here to avoid disrupting the main flow if logging fails
    }
};

module.exports = logActivity;
