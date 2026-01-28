const Razorpay = require("razorpay");
const crypto = require("crypto");
const Sale = require("../models/Sale");
const Interest = require("../models/Interest");
const Asset = require("../models/Asset");
const User = require("../models/User"); // Need User model to get buyer name in processSale
const logActivity = require('../utils/activityLogger');

// CREATE ORDER
const createOrder = async (req, res) => {
    try {
        const { amount, interestId, assetId, quantity } = req.body;

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay keys are missing in backend configuration");
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100, // paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                interestId: interestId || "",
                assetId: assetId || "",
                quantity: quantity || "",
                buyerId: req.user._id.toString()
            }
        });

        // Log Payment Initiated
        logActivity({
            userId: req.user._id,
            action: 'PAYMENT_INITIATED',
            description: `${req.user.fullName} initiated payment of ₹${amount.toLocaleString()}`,
            relatedId: null, // No Sale ID yet
            relatedModel: 'Sale',
            metadata: { amount }
        });

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... (verifyPayment remains mostly the same)
// VERIFY PAYMENT
const verifyPayment = (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Create Sale record and update Interest if interestId or assetId is provided
            const { interestId, assetId, quantity } = req.body;

            if (interestId || assetId) {
                // req.user is available here because it's a protected route?
                // Wait, verifyPayment usually comes from client, which sends token. Yes.
                processSale({
                    interestId,
                    assetId,
                    quantity,
                    buyerId: req.user._id,
                    paymentId: razorpay_payment_id
                }).catch(err => console.error("Process Sale Error:", err));
            }

            res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const processSale = async ({ interestId, assetId, quantity, buyerId, paymentId }) => {
    try {
        let interest;

        if (interestId && interestId !== "") {
            interest = await Interest.findById(interestId).populate("asset");
        } else if (assetId && assetId !== "") {
            // Direct payment flow: Create interest on the fly
            const asset = await Asset.findById(assetId);
            if (!asset) {
                console.error(`Asset not found: ${assetId}`);
                return;
            }

            interest = new Interest({
                buyer: buyerId,
                asset: assetId,
                seller: asset.seller,
                status: 'accepted', // This is correct for paid
                quantity: quantity || 1,
                salesStatus: 'sold',
                soldPrice: asset.price,
                soldQuantity: quantity || 1,
                soldTotalAmount: asset.price * (quantity || 1),
                soldDate: new Date()
            });
            await interest.save();
            interest = await Interest.findById(interest._id).populate("asset");
        }

        if (!interest) {
            console.error(`Interest or Asset info missing`);
            return;
        }

        // Prevents duplicate processing
        if (interestId && interest.salesStatus === "sold") {
            return;
        }

        const amount = interest.soldTotalAmount || (interest.soldPrice * interest.soldQuantity) || (interest.asset?.price * (interest.quantity || 1));

        const newSale = new Sale({
            price: interest.soldPrice || interest.asset?.price,
            quantity: interest.soldQuantity || interest.quantity,
            soldQuantity: interest.soldQuantity || interest.quantity,
            totalAmount: amount,
            status: "sold",
            interest: interest._id,
            asset: interest.asset._id,
            buyer: interest.buyer,
            seller: interest.seller,
            razorpayPaymentId: paymentId
        });

        await newSale.save();

        // Update Interest if it wasn't just created above
        if (interestId) {
            interest.status = "accepted";
            interest.salesStatus = "sold";
            interest.soldDate = new Date();
            if (!interest.soldPrice) interest.soldPrice = interest.asset?.price;
            if (!interest.soldQuantity) interest.soldQuantity = interest.quantity;
            if (!interest.soldTotalAmount) interest.soldTotalAmount = amount;

            await interest.save();
        }

        // Log Activity: Payment Successful
        logActivity({
            userId: buyerId,
            action: 'PAYMENT_SUCCESS',
            description: 'Payment successful for the order',
            relatedId: newSale._id,
            relatedModel: 'Sale'
        });

        // Log Activity: Asset Purchased
        logActivity({
            userId: buyerId,
            action: 'ASSET_PURCHASED',
            description: 'Asset purchased and ownership transferred',
            relatedId: interest.asset._id,
            relatedModel: 'Asset'
        });


    } catch (error) {
        console.error("Critical error in processSale:", error);
    }
};

module.exports = { createOrder, verifyPayment };
