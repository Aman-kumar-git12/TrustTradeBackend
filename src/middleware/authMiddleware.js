const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    console.log("Protect Middleware HIT. Method:", req.method, "URL:", req.originalUrl);
    console.log("--------------------------------------------------");
    console.log("Headers Origin:", req.headers.origin);
    console.log("Headers CookieRaw:", req.headers.cookie);
    console.log("Parsed Cookies:", req.cookies);
    console.log("Protocol:", req.protocol, "Secure:", req.secure);
    console.log("--------------------------------------------------");
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token && req.cookies && (req.cookies.jwt || req.cookies.token)) {
        try {
            token = req.cookies.jwt || req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
            return; // Important to return here to prevent falling through
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
