const { searchAssets, getCategories } = require('../services/agent/searchService');
const { createQuote } = require('../services/agent/quoteService');
const { createReservation, releaseReservation } = require('../services/agent/reservationService');
const { createAgentPaymentOrder } = require('../services/agent/paymentOrderService');
const { completeStrategicPurchase } = require('../services/orders/agentPurchaseService');
const AgentSession = require('../models/AgentSession');
const Asset = require('../models/Asset');
const Interest = require('../models/Interest');

const fallbackReply = (userRole) => ({
    reply: `Your TrustTrade AI agent is temporarily unavailable, so I switched to a fallback reply.\n\nIf you are a ${userRole || 'platform'} user, I can still suggest a strong next step: open the dashboard, review your active items, and ask again with a more specific question about listings, negotiation, or checkout.`,
    quickReplies: [
        'Help me with listings',
        'Guide me on negotiation',
        'Show me the next dashboard step'
    ],
    source: 'fallback',
    sessionId: null
});

const requestAgent = async (url, options = {}, timeoutMs = 30000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            signal: controller.signal
        });
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const error = new Error(
                typeof data === 'string'
                    ? data
                    : `Agent API responded with ${response.status}`
            );
            error.status = response.status;
            throw error;
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            const timeoutError = new Error('AI Agent Strategic Interface timed out');
            timeoutError.status = 504;
            throw timeoutError;
        }

        if (!error.status) error.status = 503;
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};

const chatWithAgent = async (req, res) => {
    try {
        const rawMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        let sessionId = req.body?.sessionId || null;
        const mode = req.body?.mode || 'conversation';
        const userId = req.user?._id || req.user?.id;

        if (!rawMessage) {
            return res.status(400).json({ message: 'A chat message is required' });
        }

        // 1. Find or create the session in MongoDB (Node Backend)
        let session = null;
        if (sessionId) {
            session = await AgentSession.findOne({ sessionId, userId });
        }

        if (!session) {
            // Create a new session if not found or not provided
            sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            session = new AgentSession({
                userId,
                sessionId,
                mode,
                title: rawMessage.slice(0, 40) + (rawMessage.length > 40 ? '...' : ''),
                messages: []
            });
        }

        // 2. Append User Message
        session.messages.push({
            role: 'user',
            content: rawMessage,
            timestamp: new Date()
        });

        // 3. Prepare History for Agent (Stateless Inference)
        // Only send the last few messages for context
        const historyForAgent = session.messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));

        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");
        const payload = {
            message: rawMessage,
            history: historyForAgent.slice(0, -1), // Don't include the current message in history yet
            sessionId,
            mode,
            metadata: req.body?.metadata || {},
            user: {
                id: String(userId),
                fullName: req.user?.fullName || '',
                role: req.user?.role || 'member'
            }
        };

        try {
            // 4. Call Intelligence Core (Python)
            const data = await requestAgent(`${agentUrl}/api/chat`, {
                method: 'POST',
                body: JSON.stringify(payload)
            }, 30000);

            // 5. Append Agent Reply
            session.messages.push({
                role: 'assistant',
                content: data.reply,
                metadata: data.metadata || {},
                timestamp: new Date()
            });

            // 6. Persist to MongoDB (Node Backend)
            session.updatedAt = new Date();
            await session.save();

            // Return response to frontend
            return res.status(200).json({
                ...data,
                sessionId: session.sessionId
            });
        } catch (error) {
            console.error('AI Agent Communication failure:', error.message);
            // Save user message even if agent fails to maintain consistency
            await session.save();
            const fallback = fallbackReply(req.user?.role);
            return res.status(200).json({
                ...fallback,
                sessionId: session.sessionId
            });
        }
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ message: error.message });
    }
};

const resolveUserId = (req) => req.user?._id || req.user?.id || req.body?.userId || req.query?.userId || null;

const searchAgentAssets = async (req, res) => {
    try {
        const assets = await searchAssets({
            query: req.body?.query,
            category: req.body?.category,
            budgetMax: req.body?.budgetMax,
            limit: req.body?.limit || 5,
            userId: resolveUserId(req),
        });
        return res.status(200).json(assets);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const listAgentCategories = async (_req, res) => {
    try {
        const categories = await getCategories();
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createAgentQuote = async (req, res) => {
    try {
        const quote = await createQuote({
            assetId: req.body?.assetId,
            quantity: req.body?.quantity || 1,
        });
        return res.status(200).json(quote);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const reserveAgentInventory = async (req, res) => {
    try {
        const userId = resolveUserId(req);
        const reservation = await createReservation({
            assetId: req.body?.assetId,
            userId,
            sessionId: req.body?.sessionId,
            quantity: Number(req.body?.quantity || 1),
            quoteId: req.body?.quoteId,
        });

        return res.status(200).json({
            ...reservation.toObject(),
            _id: String(reservation._id),
            expiresAt: reservation.expiresAt?.toISOString?.() || reservation.expiresAt,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const createAgentPaymentOrderController = async (req, res) => {
    try {
        const userId = resolveUserId(req);
        const paymentOrder = await createAgentPaymentOrder({
            assetId: req.body?.assetId,
            quantity: Number(req.body?.quantity || 1),
            reservationId: req.body?.reservationId,
            sessionId: req.body?.sessionId,
            userId,
        });
        return res.status(200).json(paymentOrder);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const completeAgentPurchaseController = async (req, res) => {
    try {
        const sale = await completeStrategicPurchase({
            razorpayOrderId: req.body?.razorpayOrderId || req.body?.razorpay_order_id,
            razorpayPaymentId: req.body?.razorpayPaymentId || req.body?.razorpay_payment_id,
            razorpaySignature: req.body?.razorpaySignature || req.body?.razorpay_signature,
        });

        return res.status(200).json({
            success: true,
            saleId: String(sale._id),
            orderId: String(sale._id),
            assetId: String(sale.asset),
            quantity: Number(sale.quantity || 0),
            totalAmount: Number(sale.totalAmount || 0),
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const cancelAgentPurchase = async (req, res) => {
    try {
        const reservationId = req.body?.reservationId;
        if (reservationId) {
            await releaseReservation(reservationId);
        }
        return res.status(200).json({
            success: true,
            sessionId: req.body?.sessionId || null,
            reservationReleased: Boolean(reservationId),
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const listSessions = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        // Filter out soft-deleted sessions
        const sessions = await AgentSession.find({ userId, deletedAt: null })
            .select('sessionId title mode updatedAt')
            .sort({ updatedAt: -1 })
            .limit(50);

        // Normalize for frontend expectation
        const normalized = sessions.map(s => ({
            id: s.sessionId,
            title: s.title || 'Untitled',
            mode: s.mode || 'conversation',
            updatedAt: s.updatedAt
        }));

        return res.status(200).json(normalized);
    } catch (error) {
        console.error('List sessions error:', error);
        return res.status(200).json([]);
    }
};

const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id || req.user?.id;

        // Ensure session is not soft-deleted
        const session = await AgentSession.findOne({
            sessionId: id,
            userId,
            deletedAt: null
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found or deleted' });
        }

        return res.status(200).json({
            id: session.sessionId,
            title: session.title,
            mode: session.mode,
            history: session.messages.map(m => ({
                role: m.role,
                content: m.content,
                metadata: m.metadata,
                timestamp: m.timestamp
            }))
        });
    } catch (error) {
        console.error('Get session error:', error);
        return res.status(500).json({ message: error.message });
    }
};

const mongoose = require('mongoose');

const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id || req.user?.id;

        // Perform Soft Delete by setting deletedAt timestamp
        const query = {
            $or: [
                { sessionId: id },
                { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }
            ].filter(q => q !== null),
            userId
        };

        const result = await AgentSession.findOneAndUpdate(query, {
            $set: { deletedAt: new Date() }
        }, { new: true });

        if (!result) {
            return res.status(404).json({ message: 'Session not found or forbidden' });
        }

        // We specifically DO NOT notify the Python Agent for soft-deletion 
        // to preserve its strategic state in the database as well.

        return res.status(200).json({
            message: 'Session soft-deleted successfully',
            sessionId: result.sessionId
        });
    } catch (error) {
        console.error('Delete session error:', error);
        return res.status(500).json({ message: error.message });
    }
};

const getAgentAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await Asset.findById(id).lean();
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.status(200).json(asset);
    } catch (error) {
        console.error('Get agent asset error:', error);
        res.status(500).json({ message: error.message });
    }
};

const recordAgentNegotiation = async (req, res) => {
    try {
        const { assetId, quantity, message, sessionId } = req.body;
        const userId = resolveUserId(req);

        if (!assetId || !userId) {
            return res.status(400).json({ message: 'Asset ID and User ID are required' });
        }

        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // 1. Find or create the Interest record
        let interest = await Interest.findOne({ asset: assetId, buyer: userId });

        if (!interest) {
            interest = new Interest({
                asset: assetId,
                buyer: userId,
                seller: asset.seller,
                quantity: quantity || 1,
                message: message || 'I am interested in this asset.',
                status: 'negotiating',
                negotiationStartDate: new Date()
            });
        } else {
            // Update existing interest with new message
            interest.message = message || interest.message;
            interest.status = 'negotiating';
            interest.quantity = quantity || interest.quantity;
        }

        await interest.save();

        return res.status(200).json({
            success: true,
            interestId: String(interest._id),
            status: interest.status,
            message: interest.message,
            sessionId: sessionId || null
        });
    } catch (error) {
        console.error('Record negotiation error:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    chatWithAgent,
    listSessions,
    getSession,
    deleteSession,
    searchAgentAssets,
    listAgentCategories,
    createAgentQuote,
    reserveAgentInventory,
    createAgentPaymentOrderController,
    completeAgentPurchaseController,
    cancelAgentPurchase,
    getAgentAsset,
    recordAgentNegotiation,
};
