/**
 * Centralized Pricing Service for the Strategic Agent
 * Ensures a single source of truth for all calculations across the platform.
 */

const calculateQuote = async (asset, quantity = 1) => {
    const basePrice = asset.price;
    const subtotal = basePrice * quantity;
    
    // Platform Fee: 3% of subtotal (Adjust as per business logic)
    const platformFee = Math.round(subtotal * 0.03);
    
    // Tax: 18% of subtotal + platform fee (Standard GST example)
    const tax = Math.round((subtotal + platformFee) * 0.18);
    
    const total = subtotal + platformFee + tax;
    
    // Expiry: 15 minutes from now to match Reservation
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return {
        assetId: asset._id,
        quantity,
        basePrice,
        subtotal,
        platformFee,
        tax,
        total,
        currency: 'INR',
        expiresAt
    };
};

module.exports = {
    calculateQuote
};
