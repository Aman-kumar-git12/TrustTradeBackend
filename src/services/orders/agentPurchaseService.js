const mongoose = require('mongoose');
const Asset = require('../../models/Asset');
const Sale = require('../../models/Sale');
const InventoryReservation = require('../../models/InventoryReservation');
const PaymentIntent = require('../../models/PaymentIntent');
const { verifyPayment } = require('../payments/paymentService');
const { notifySeller } = require('../notifications/sellerNotificationService');

/**
 * Master Order Orchestration Service for the Strategic Agent (Phase 10)
 * Centrally manages the final transaction loop: Verify -> Record -> Decrement -> Notify.
 */

const completeStrategicPurchase = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Authoritative Backend Verification
        const isValid = await verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
        if (!isValid) throw new Error("Payment verification failed");

        // 2. Fetch dependencies
        const intent = await PaymentIntent.findOne({ razorpayOrderId }).session(session);
        const reservation = await InventoryReservation.findById(intent.reservationId).session(session);
        const asset = await Asset.findById(intent.assetId).session(session);

        if (!reservation || reservation.status !== 'pending') {
            throw new Error("Reservation expired or already processed");
        }

        // 3. Create the Sale record
        const sale = await Sale.create([{
            seller: asset.seller,
            buyer: intent.userId,
            asset: intent.assetId,
            price: intent.amount / intent.quantity, // Unit price
            quantity: intent.quantity,
            totalAmount: intent.amount,
            status: 'completed',
            razorpayPaymentId,
            notes: "Strategic AI Partner Purchase"
        }], { session });

        // 4. Decrement Stock Permanently
        // Subtract from both total quantity AND reservedQuantity
        asset.quantity -= intent.quantity;
        asset.reservedQuantity -= intent.quantity;
        asset.sales += intent.quantity;
        await asset.save({ session });

        // 5. Mark Reservation as confirmed
        reservation.status = 'confirmed';
        await reservation.save({ session });

        await session.commitTransaction();

        // 6. Async Notification (Fire and forget from transaction scope)
        notifySeller(asset.seller, sale[0]._id, intent.assetId);

        return sale[0];
    } catch (error) {
        await session.abortTransaction();
        console.error("Order Orchestration Error:", error);
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    completeStrategicPurchase
};
