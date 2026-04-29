const express = require('express');
const router = express.Router();
const {
    chatConversation,
    chatStrategic,
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
} = require('../controllers/agentController');
const { protect, protectOrInternalAgent } = require('../middleware/authMiddleware');

router.post('/chat/conversation', protect, chatConversation);
router.post('/chat/strategic', protect, chatStrategic);
router.get('/sessions', protect, listSessions);
router.get('/sessions/:id', protect, getSession);
router.delete('/sessions/:id', protect, deleteSession);
router.get('/categories', protectOrInternalAgent, listAgentCategories);
router.get('/assets', protectOrInternalAgent, searchAgentAssets);
router.get('/assets/:id', protectOrInternalAgent, getAgentAsset);
router.post('/quote', protectOrInternalAgent, createAgentQuote);
router.post('/reserve', protectOrInternalAgent, reserveAgentInventory);
router.post('/payment/create-order', protectOrInternalAgent, createAgentPaymentOrderController);
router.post('/complete-purchase', protectOrInternalAgent, completeAgentPurchaseController);
router.post('/cancel', protectOrInternalAgent, cancelAgentPurchase);
router.post('/negotiate', protectOrInternalAgent, recordAgentNegotiation);

module.exports = router;
