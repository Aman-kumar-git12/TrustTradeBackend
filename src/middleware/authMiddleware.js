const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isInternalAgentRequest = (req) => {
    const expectedKey = process.env.AGENT_INTERNAL_KEY || 'trusttrade-local-agent';
    const incomingKey = req.headers['x-agent-internal-key'];
    return Boolean(incomingKey && incomingKey === expectedKey);
};

const protect = async (req, res, next) => {
    console.log(`[PROTECT] Request: ${req.method} ${req.originalUrl}`);
    console.log(`[PROTECT] Cookies count: ${Object.keys(req.cookies || {}).length}`);
    console.log(`[PROTECT] Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log("[PROTECT] Verifying Bearer Token...");
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`[PROTECT] Token Verified for ID: ${decoded.id}. Querying DB...`);
            req.user = await User.findById(decoded.id).select('-password');
            console.log(`[PROTECT] DB Query Complete. User Found: ${!!req.user}`);

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            return next();
        } catch (error) {
            console.error('Auth Error (Bearer):', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token && req.cookies && (req.cookies.jwt || req.cookies.token)) {
        try {
            token = req.cookies.jwt || req.cookies.token;
            console.log(`[PROTECT] Verifying Cookie Token (${req.cookies.jwt ? 'jwt' : 'token'})...`);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`[PROTECT] Token Verified for ID: ${decoded.id}. Querying DB...`);
            req.user = await User.findById(decoded.id).select('-password');
            console.log(`[PROTECT] DB Query Complete. User Found: ${!!req.user}`);
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            return next();
        } catch (error) {
            console.error('Auth Error (Cookie):', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const protectOrInternalAgent = async (req, res, next) => {
    if (isInternalAgentRequest(req)) {
        return next();
    }
    return protect(req, res, next);
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin, protectOrInternalAgent, isInternalAgentRequest };
