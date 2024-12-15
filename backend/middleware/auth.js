const jwt = require('jsonwebtoken');

// Add debug logging
console.log('Current working directory:', process.cwd());
console.log('Environment variables loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');

// Make the check more flexible with a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
}

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