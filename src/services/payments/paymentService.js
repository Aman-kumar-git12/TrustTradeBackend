const crypto = require('crypto');
const PaymentIntent = require('../../models/PaymentIntent');

/**
 * Payment Service for the Strategic Agent
 * Handles authoritative backend verification of Razorpay transactions.
 */

const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    try {
        const paymentIntent = await PaymentIntent.findOne({ razorpayOrderId });
        if (!paymentIntent) {
            throw new Error("Payment intent not found for this order");
        }

        // 1. Authoritative verification using Razorpay secret logic
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");

        const isValid = expectedSignature === razorpaySignature;

        if (isValid) {
            paymentIntent.status = 'succeeded';
            paymentIntent.razorpayPaymentId = razorpayPaymentId;
            paymentIntent.razorpaySignature = razorpaySignature;
            await paymentIntent.save();
            return true;
        } else {
            paymentIntent.status = 'failed';
            await paymentIntent.save();
            return false;
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        throw error;
    }
};

module.exports = {
    verifyPayment
};
