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
    cancelAgentPurchase,
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
router.post('/cancel', protectOrInternalAgent, cancelAgentPurchase);

module.exports = router;
