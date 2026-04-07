const mongoose = require('mongoose');
const Asset = require('../../models/Asset');
const Sale = require('../../models/Sale');
const Interest = require('../../models/Interest');
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

        // 3. Find or Create Interest (Required by Sale model)
        let interest = await Interest.findOne({
            buyer: intent.userId,
            asset: intent.assetId
        }).session(session);

        if (!interest) {
            interest = await Interest.create([{
                buyer: intent.userId,
                asset: intent.assetId,
                seller: asset.seller,
                quantity: intent.quantity || 1,
                status: 'accepted',
                salesStatus: 'sold',
                soldPrice: intent.amount / (intent.quantity || 1),
                soldQuantity: intent.quantity || 1,
                soldTotalAmount: intent.amount,
                soldDate: new Date(),
                message: "Strategic Agent Purchase"
            }], { session });
            interest = interest[0];
        } else {
            // Update existing interest (e.g. from negotiation)
            interest.status = 'accepted';
            interest.salesStatus = 'sold';
            interest.soldPrice = intent.amount / (intent.quantity || 1);
            interest.soldQuantity = intent.quantity || 1;
            interest.soldTotalAmount = intent.amount;
            interest.soldDate = new Date();
            await interest.save({ session });
        }

        // 4. Create the Sale record
        const sale = await Sale.create([{
            seller: asset.seller,
            buyer: intent.userId,
            asset: intent.assetId,
            interest: interest._id,
            price: intent.amount / (intent.quantity || 1), // Unit price
            quantity: intent.quantity || 1,
            soldQuantity: intent.quantity || 1,
            totalAmount: intent.amount,
            status: 'sold',
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
