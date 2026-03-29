const path = require('path');

const fallbackReply = (userRole) => ({
    reply: `Your TrustTrade AI agent is temporarily unavailable, so I switched to a fallback reply.\n\nIf you are a ${userRole || 'platform'} user, I can still suggest a strong next step: open the dashboard, review your active items, and ask again with a more specific question about listings, negotiation, or checkout.`,
    quickReplies: [
        'Help me with listings',
        'Guide me on negotiation',
        'Show me the next dashboard step'
    ],
    source: 'fallback'
});

const callAgent = async ({ message, history, user }) => {
    const agentUrl = process.env.PYTHON_AGENT_URL || 'http://localhost:8000/api/chat';
    
    const payload = {
        message,
        history,
        user: {
            fullName: user?.fullName || '',
            role: user?.role || 'member'
        }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s — allows for cold-start model load

    try {
        const response = await fetch(agentUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            let status = 502; // Bad Gateway by default for AI errors
            if (response.status === 503) status = 503;
            
            const error = new Error(`Agent API responded with ${response.status}: ${errorText}`);
            error.status = status;
            throw error;
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            const timeoutError = new Error('AI Agent Strategic Interface timed out');
            timeoutError.status = 504; // Gateway Timeout
            throw timeoutError;
        }
        
        // Ensure error has a status for the controller
        if (!error.status) error.status = 503; // Service Unavailable
        throw error;
    }
};

const chatWithAgent = async (req, res) => {
    try {
        const rawMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        const history = Array.isArray(req.body?.history) ? req.body.history : [];
        const sessionId = req.body?.sessionId || null;

        if (!rawMessage) {
            return res.status(400).json({ message: 'A chat message is required' });
        }

        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");
        
        const payload = {
            message: rawMessage.slice(0, 2000),
            history: history.slice(-8),
            sessionId,
            user: {
                id: req.user?._id || req.user?.id || 'anonymous',
                fullName: req.user?.fullName || '',
                role: req.user?.role || 'member'
            }
        };

        try {
            const response = await fetch(`${agentUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Agent API error: ${response.status}`);
            }

            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            console.error('AI Agent Communication failure:', error.message);
            return res.status(200).json(fallbackReply(req.user?.role));
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const listSessions = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");

        const response = await fetch(`${agentUrl}/api/sessions?userId=${userId}`);
        if (!response.ok) {
            return res.status(200).json([]);
        }
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(200).json([]);
    }
};

const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");
        
        const response = await fetch(`${agentUrl}/api/sessions/${id}`);
        if (!response.ok) return res.status(404).json({ message: 'Session not found' });
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");
        
        const response = await fetch(`${agentUrl}/api/sessions/${id}`, { method: 'DELETE' });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    chatWithAgent,
    listSessions,
    getSession,
    deleteSession
};
