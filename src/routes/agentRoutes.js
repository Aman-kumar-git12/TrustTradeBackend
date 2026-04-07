const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/agentController');
const { protect, protectOrInternalAgent } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAgent);
router.get('/sessions', protect, listSessions);
router.get('/sessions/:id', protect, getSession);
router.delete('/sessions/:id', protect, deleteSession);
router.get('/categories', protectOrInternalAgent, listAgentCategories);
router.post('/search-assets', protectOrInternalAgent, searchAgentAssets);
router.post('/quote', protectOrInternalAgent, createAgentQuote);
router.post('/reserve', protectOrInternalAgent, reserveAgentInventory);
router.post('/payment-order', protectOrInternalAgent, createAgentPaymentOrderController);
router.post('/complete-purchase', protectOrInternalAgent, completeAgentPurchaseController);
router.post('/cancel', protectOrInternalAgent, cancelAgentPurchase);
router.get('/asset/:id', protectOrInternalAgent, getAgentAsset);
router.post('/negotiate', protectOrInternalAgent, recordAgentNegotiation);

module.exports = router;
