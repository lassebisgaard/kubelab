const jwt = require('jsonwebtoken');

// Brug samme secret key som i auth.js
const JWT_SECRET = 'development_secret_key_123';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const verifyAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin }; 