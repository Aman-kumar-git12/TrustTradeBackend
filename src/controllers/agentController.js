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
            const data = await requestAgent(`${agentUrl}/api/chat`, {
                method: 'POST',
                body: JSON.stringify(payload)
            }, 30000);
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

        const data = await requestAgent(
            `${agentUrl}/api/sessions?userId=${encodeURIComponent(userId || 'anonymous')}`,
            { method: 'GET', headers: {} },
            10000
        );
        res.status(200).json(data);
    } catch (error) {
        res.status(200).json([]);
    }
};

const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");

        const data = await requestAgent(
            `${agentUrl}/api/sessions/${encodeURIComponent(id)}`,
            { method: 'GET', headers: {} },
            10000
        );
        res.status(200).json(data);
    } catch (error) {
        const status = error.status === 404 ? 404 : 500;
        res.status(status).json({ message: error.message });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const agentUrl = (process.env.PYTHON_AGENT_URL || 'http://localhost:8000').replace(/\/$/, "");

        const data = await requestAgent(
            `${agentUrl}/api/sessions/${encodeURIComponent(id)}`,
            { method: 'DELETE', headers: {} },
            10000
        );
        res.status(200).json(data);
    } catch (error) {
        const status = error.status === 404 ? 404 : 500;
        res.status(status).json({ message: error.message });
    }
};

module.exports = {
    chatWithAgent,
    listSessions,
    getSession,
    deleteSession
};
