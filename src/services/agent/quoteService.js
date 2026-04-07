const crypto = require('crypto');
const Asset = require('../../models/Asset');

const InventoryReservation = require('../../models/InventoryReservation');

const PLATFORM_FEE = 10;
const TAX_RATE = 0.18;
const QUOTE_TTL_MS = 15 * 60 * 1000;

const getAvailableQuantity = (asset) =>
    Math.max(0, Number(asset?.quantity || 0) - Number(asset?.reservedQuantity || 0));

const createQuote = async ({ assetId, quantity = 1, reservationId = null }) => {
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);

    const asset = await Asset.findOne({
        _id: assetId,
        status: 'active',
    }).lean();

    if (!asset) {
        throw new Error('Asset not found or inactive');
    }

    let reservationQuantity = 0;
    if (reservationId) {
        const reservation = await InventoryReservation.findById(reservationId).lean();
        if (reservation && reservation.status === 'pending') {
            reservationQuantity = Number(reservation.quantity || 0);
        }
    }

    if ((getAvailableQuantity(asset) + reservationQuantity) < normalizedQuantity) {
        throw new Error('Requested quantity exceeds available stock');
    }

    const basePrice = Number(asset.price || 0) * normalizedQuantity;
    const platformFee = PLATFORM_FEE;
    const tax = Number((basePrice * TAX_RATE).toFixed(2));
    const total = Number((basePrice + platformFee + tax).toFixed(2));

    return {
        quoteId: `quote_${crypto.randomUUID()}`,
        assetId: String(asset._id),
        title: asset.title,
        quantity: normalizedQuantity,
        basePrice,
        platformFee,
        tax,
        total,
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    };
};

module.exports = {
    createQuote,
};
