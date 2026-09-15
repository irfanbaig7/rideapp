const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized. Token required.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (user.isBanned) return res.status(403).json({ error: 'Account suspended.' });

    req.user = user; // single source of truth — req.user.role, req.user._id
    next();
};

// Route ko sirf ek specific role tak restrict karne ke liye
const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ error: `Only ${role}s can access this.` });
    }
    next();
};

module.exports = { protect, requireRole };