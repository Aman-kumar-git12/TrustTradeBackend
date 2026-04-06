const Asset = require('../../models/Asset');
const InventoryReservation = require('../../models/InventoryReservation');
const mongoose = require('mongoose');

/**
 * Inventory Reservation Service for the Strategic Agent
 * Ensures stock protection during the 15-minute Quote window.
 */

const createReservation = async ({ assetId, userId, sessionId, quantity, quoteId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Transaction-level lock check + increment reservedQuantity
        const asset = await Asset.findOneAndUpdate(
            {
                _id: assetId,
                $expr: { $gte: [{ $subtract: ["$quantity", "$reservedQuantity"] }, quantity] }
            },
            { $inc: { reservedQuantity: quantity } },
            { new: true, session }
        );

        if (!asset) {
            throw new Error("Insufficient stock available for reservation");
        }

        // 2. Create the reservation record
        const reservation = await InventoryReservation.create([{
            assetId,
            userId,
            sessionId,
            quantity,
            quoteId,
            status: 'pending',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }], { session });

        await session.commitTransaction();
        return reservation[0];
    } catch (error) {
        await session.abortTransaction();
        console.error("Reservation Service Error:", error);
        throw error;
    } finally {
        session.endSession();
    }
};

const releaseReservation = async (reservationId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const reservation = await InventoryReservation.findById(reservationId).session(session);
        if (!reservation || reservation.status !== 'pending') return;

        // Decrement reservedQuantity
        await Asset.findByIdAndUpdate(reservation.assetId, {
            $inc: { reservedQuantity: -reservation.quantity }
        }, { session });

        // Mark as released
        reservation.status = 'released';
        await reservation.save({ session });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    createReservation,
    releaseReservation
};
