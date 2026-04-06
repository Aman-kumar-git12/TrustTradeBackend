const Notification = require('../../models/Notification');

/**
 * Seller Notification Service for the Strategic Agent (Phase 11)
 * Centralized logic for multi-channel seller alerts.
 */

const notifySeller = async (sellerId, saleId, assetId) => {
    try {
        // 1. Dashboard Notification record
        const notification = await Notification.create({
            recipient: sellerId,
            type: 'order_received',
            title: 'New Strategic Purchase Order Received!',
            message: `Your asset #${assetId} has been successfully purchased via the Strategic Partner. Review details in your dashboard.`,
            relatedId: saleId,
            relatedModel: 'Sale'
        });

        // 2. Socket event (Placeholder - triggering dashboard update)
        // console.log("Emitting Socket Alert for Seller Dashboard:", sellerId);

        // 3. Email (Later) logic can be plugged here
        
        return notification;
    } catch (error) {
        console.error("Seller Notification Failure:", error);
        // We don't throw here to ensure the transaction doesn't crash 
        // if just the alert fails.
    }
};

module.exports = {
    notifySeller
};
