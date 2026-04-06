const Razorpay = require("razorpay");
const crypto = require("crypto");
const Sale = require("../models/Sale");
const Interest = require("../models/Interest");
const Asset = require("../models/Asset");
const InventoryReservation = require("../models/InventoryReservation");
const logActivity = require('../utils/activityLogger');
const { createQuote: createStrategicQuote } = require('../services/agent/quoteService');

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeQuantity = (value, fallback = 1) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return Math.floor(parsed);
};

const getAvailableQuantity = (asset) =>
    Math.max(0, Number(asset?.quantity ?? 0) - Number(asset?.reservedQuantity ?? 0));

const resolvePaymentRequest = async ({ amount, interestId, assetId, quantity, buyerId, reservationId }) => {
    if (interestId) {
        const interest = await Interest.findById(interestId).populate("asset");

        if (!interest) {
            throw createHttpError(404, "Interest not found");
        }

        if (interest.buyer.toString() !== buyerId.toString()) {
            throw createHttpError(403, "Not authorized to pay for this interest");
        }

        if (!interest.asset) {
            throw createHttpError(404, "Asset not found for this interest");
        }

        const resolvedQuantity = normalizeQuantity(quantity, interest.soldQuantity || interest.quantity || 1);
        const unitPrice = Number(interest.soldPrice || interest.asset.price || 0);

        if (unitPrice <= 0) {
            throw createHttpError(400, "Could not determine payable amount for this interest");
        }

        if (resolvedQuantity > getAvailableQuantity(interest.asset)) {
            throw createHttpError(400, "Requested quantity exceeds available stock");
        }

        return {
            amount: unitPrice * resolvedQuantity,
            quantity: resolvedQuantity,
            interest,
            asset: interest.asset
        };
    }

    if (assetId) {
        const asset = await Asset.findById(assetId);
        let reservation = null;

        if (!asset) {
            throw createHttpError(404, "Asset not found");
        }

        if (asset.seller.toString() === buyerId.toString()) {
            throw createHttpError(400, "You cannot buy your own asset");
        }

        const resolvedQuantity = normalizeQuantity(quantity, 1);
        if (reservationId) {
            reservation = await InventoryReservation.findById(reservationId);

            if (!reservation || reservation.status !== 'pending') {
                throw createHttpError(409, "Reservation is missing or already expired");
            }

            if (reservation.userId.toString() !== buyerId.toString()) {
                throw createHttpError(403, "Reservation does not belong to this buyer");
            }

            if (reservation.assetId.toString() !== assetId.toString()) {
                throw createHttpError(400, "Reservation does not match the selected asset");
            }
        }

        const availableQuantity = getAvailableQuantity(asset) + Number(reservation?.quantity || 0);

        if (resolvedQuantity > availableQuantity) {
            throw createHttpError(400, "Requested quantity exceeds available stock");
        }

        let resolvedAmount = Number(asset.price) * resolvedQuantity;
        if (reservation) {
            const quote = await createStrategicQuote({
                assetId,
                quantity: resolvedQuantity,
            });
            resolvedAmount = Number(quote.total);
        }

        return {
            amount: resolvedAmount,
            quantity: resolvedQuantity,
            asset,
            reservation,
        };
    }

    const fallbackAmount = Number(amount);
    if (!Number.isFinite(fallbackAmount) || fallbackAmount <= 0) {
        throw createHttpError(400, "Amount is required");
    }

    return {
        amount: fallbackAmount,
        quantity: normalizeQuantity(quantity, 1)
    };
};

// CREATE ORDER
const createOrder = async (req, res) => {
    try {
        const { amount, interestId, assetId, quantity, reservationId } = req.body;

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay keys are missing in backend configuration");
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const paymentContext = await resolvePaymentRequest({
            amount,
            interestId,
            assetId,
            quantity,
            reservationId,
            buyerId: req.user._id
        });

        const order = await razorpay.orders.create({
            amount: Math.round(paymentContext.amount * 100), // paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                interestId: interestId || "",
                assetId: assetId || "",
                quantity: paymentContext.quantity || "",
                buyerId: req.user._id.toString(),
                reservationId: reservationId || "",
            }
        });

        // Log Payment Initiated
        logActivity({
            userId: req.user._id,
            action: 'PAYMENT_INITIATED',
            description: `${req.user.fullName} initiated payment of ₹${paymentContext.amount.toLocaleString()}`,
            relatedId: null, // No Sale ID yet
            relatedModel: 'Sale',
            metadata: { amount: paymentContext.amount }
        });

        res.status(200).json(order);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ... (verifyPayment remains mostly the same)
// VERIFY PAYMENT
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification fields" });
        }

        const existingSale = await Sale.findOne({ razorpayPaymentId: razorpay_payment_id }).select('_id');
        if (existingSale) {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                saleId: existingSale._id,
                duplicate: true
            });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Create Sale record and update Interest if interestId or assetId is provided
            const { interestId, assetId, quantity, reservationId } = req.body;
            let sale = null;

            if (interestId || assetId) {
                sale = await processSale({
                    interestId,
                    assetId,
                    quantity,
                    reservationId,
                    buyerId: req.user._id,
                    paymentId: razorpay_payment_id
                });
            }

            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                saleId: sale?._id || null
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

const processSale = async ({ interestId, assetId, quantity, reservationId, buyerId, paymentId }) => {
    const existingSale = await Sale.findOne({ razorpayPaymentId: paymentId });
    if (existingSale) {
        return existingSale;
    }

    let interest;
    let strategicReservation = null;

    if (interestId && interestId !== "") {
        interest = await Interest.findById(interestId).populate("asset");

        if (!interest) {
            throw createHttpError(404, "Interest not found");
        }

        if (interest.buyer.toString() !== buyerId.toString()) {
            throw createHttpError(403, "Not authorized to pay for this interest");
        }

        if (interest.salesStatus === "sold") {
            const saleByInterest = await Sale.findOne({ interest: interest._id }).sort({ createdAt: -1 });
            if (saleByInterest) {
                return saleByInterest;
            }

            throw createHttpError(409, "This interest has already been paid for");
        }
    } else if (assetId && assetId !== "") {
        // Direct payment flow: Create interest on the fly
        const asset = await Asset.findById(assetId);
        if (!asset) {
            throw createHttpError(404, "Asset not found");
        }

        if (asset.seller.toString() === buyerId.toString()) {
            throw createHttpError(400, "You cannot buy your own asset");
        }

        const resolvedQuantity = normalizeQuantity(quantity, 1);
        if (reservationId) {
            strategicReservation = await InventoryReservation.findById(reservationId);
            if (!strategicReservation || strategicReservation.status !== 'pending') {
                throw createHttpError(409, "Reservation expired or already processed");
            }

            if (strategicReservation.userId.toString() !== buyerId.toString()) {
                throw createHttpError(403, "Reservation does not belong to this buyer");
            }

            if (strategicReservation.assetId.toString() !== assetId.toString()) {
                throw createHttpError(400, "Reservation does not match the selected asset");
            }
        }

        const availableQuantity = getAvailableQuantity(asset) + Number(strategicReservation?.quantity || 0);

        if (resolvedQuantity > availableQuantity) {
            throw createHttpError(400, "Requested quantity exceeds available stock");
        }

        interest = new Interest({
            buyer: buyerId,
            asset: assetId,
            seller: asset.seller,
            status: 'accepted',
            quantity: resolvedQuantity,
            salesStatus: 'sold',
            soldPrice: asset.price,
            soldQuantity: resolvedQuantity,
            soldTotalAmount: asset.price * resolvedQuantity,
            soldDate: new Date()
        });
        await interest.save();
        interest = await Interest.findById(interest._id).populate("asset");
    }

    if (!interest || !interest.asset) {
        throw createHttpError(400, "Interest or asset information is missing");
    }

    const saleQuantity = normalizeQuantity(quantity, interest.soldQuantity || interest.quantity || 1);
    const unitPrice = Number(interest.soldPrice || interest.asset.price || 0);

    if (unitPrice <= 0) {
        throw createHttpError(400, "Could not determine sale price");
    }

    const effectiveAvailable = getAvailableQuantity(interest.asset) + Number(strategicReservation?.quantity || 0);
    if (saleQuantity > effectiveAvailable) {
        throw createHttpError(400, "Requested quantity exceeds available stock");
    }

    const amount = unitPrice * saleQuantity;

    const newSale = new Sale({
        price: unitPrice,
        quantity: saleQuantity,
        soldQuantity: saleQuantity,
        totalAmount: amount,
        status: "sold",
        interest: interest._id,
        asset: interest.asset._id,
        buyer: interest.buyer,
        seller: interest.seller,
        razorpayPaymentId: paymentId
    });

    await newSale.save();

    interest.status = "accepted";
    interest.salesStatus = "sold";
    interest.soldDate = new Date();
    interest.soldPrice = unitPrice;
    interest.soldQuantity = saleQuantity;
    interest.soldTotalAmount = amount;
    await interest.save();

    interest.asset.quantity = Math.max(0, Number(interest.asset.quantity || 0) - saleQuantity);
    if (strategicReservation) {
        interest.asset.reservedQuantity = Math.max(
            0,
            Number(interest.asset.reservedQuantity || 0) - saleQuantity
        );
        strategicReservation.status = 'confirmed';
        await strategicReservation.save();
    }
    interest.asset.sales = Number(interest.asset.sales || 0) + saleQuantity;
    if (interest.asset.quantity === 0) {
        interest.asset.status = 'inactive';
    }
    await interest.asset.save();

    // Log Activity: Payment Successful
    await logActivity({
        userId: buyerId,
        action: 'PAYMENT_SUCCESS',
        description: 'Payment successful for the order',
        relatedId: newSale._id,
        relatedModel: 'Sale'
    });

    // Log Activity: Asset Purchased
    await logActivity({
        userId: buyerId,
        action: 'ASSET_PURCHASED',
        description: 'Asset purchased and ownership transferred',
        relatedId: interest.asset._id,
        relatedModel: 'Asset'
    });

    return newSale;
};

module.exports = { createOrder, verifyPayment };
