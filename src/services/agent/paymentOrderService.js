const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

const Asset = require('../../models/Asset');
const InventoryReservation = require('../../models/InventoryReservation');
const PaymentIntent = require('../../models/PaymentIntent');
const { createQuote } = require('./quoteService');

const normalizeQuantity = (value, fallback = 1) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
};

const createAgentPaymentOrder = async ({ assetId, quantity = 1, reservationId, sessionId, userId }) => {
    if (!mongoose.Types.ObjectId.isValid(String(userId || ''))) {
        throw new Error('A valid buyer userId is required to create a payment order');
    }

    if (!assetId || !reservationId || !sessionId) {
        throw new Error('assetId, reservationId, and sessionId are required');
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are missing in backend configuration');
    }

    const reservation = await InventoryReservation.findById(reservationId);
    if (!reservation || reservation.status !== 'pending') {
        throw new Error('Reservation is missing or already expired');
    }

    if (String(reservation.assetId) !== String(assetId)) {
        throw new Error('Reservation does not match the selected asset');
    }

    if (String(reservation.userId) !== String(userId)) {
        throw new Error('Reservation does not belong to this buyer');
    }

    const asset = await Asset.findOne({ _id: assetId, status: 'active' }).lean();
    if (!asset) {
        throw new Error('Asset not found or inactive');
    }

    const normalizedQuantity = normalizeQuantity(quantity, Number(reservation.quantity || 1));
    const quote = await createQuote({
        assetId,
        quantity: normalizedQuantity,
        reservationId,
    });

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
        amount: Math.round(Number(quote.total || 0) * 100),
        currency: 'INR',
        receipt: `agent_receipt_${Date.now()}`,
        notes: {
            assetId: String(assetId),
            reservationId: String(reservationId),
            quantity: String(normalizedQuantity),
            buyerId: String(userId),
            sessionId: String(sessionId),
            quoteId: String(quote.quoteId || ''),
        },
    });

    const paymentIntent = await PaymentIntent.create({
        userId,
        sessionId,
        assetId,
        reservationId,
        razorpayOrderId: order.id,
        amount: Number(quote.total || 0),
        quantity: normalizedQuantity,
        currency: order.currency || 'INR',
        status: 'created',
        idempotencyKey: crypto.randomUUID(),
        metadata: {
            quoteId: String(quote.quoteId || ''),
            quantity: String(normalizedQuantity),
        },
    });

    return {
        paymentIntentId: String(paymentIntent._id),
        razorpayOrderId: order.id,
        amount: Number(quote.total || 0),
        amountPaise: Number(order.amount || 0),
        currency: order.currency || 'INR',
        reservationId: String(reservation._id),
        assetId: String(asset._id),
        quantity: normalizedQuantity,
        keyId: process.env.RAZORPAY_KEY_ID,
        quote,
        checkoutOrder: order,
    };
};

module.exports = {
    createAgentPaymentOrder,
};
