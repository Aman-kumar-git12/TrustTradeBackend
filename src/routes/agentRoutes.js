const express = require('express');
const router = express.Router();
const { chatWithAgent, listSessions, getSession, deleteSession } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAgent);
router.get('/sessions', protect, listSessions);
router.get('/sessions/:id', protect, getSession);
router.delete('/sessions/:id', protect, deleteSession);

module.exports = router;
