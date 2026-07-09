const { verifyToken, stripBearer } = require('../utils/token');
const pool = require('../config/database');

// Requires a valid JWT. Attaches the full user row to req.user, or 401s.
const requireAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        const token = stripBearer(header);

        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
            return res.status(401).json({ success: false, error: message });
        }

        const result = await pool.query(
            'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'User no longer exists' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ success: false, error: 'Authentication check failed' });
    }
};

// Attaches req.user if a valid token is present, but doesn't reject the request otherwise.
const optionalAuth = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = stripBearer(header);

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = verifyToken(token);
        const result = await pool.query(
            'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
            [decoded.id]
        );
        req.user = result.rows[0] || null;
    } catch (error) {
        req.user = null;
    }
    next();
};

// Restricts a route to specific roles. Use after requireAuth.
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Not authorized for this action' });
    }
    next();
};

module.exports = { requireAuth, optionalAuth, requireRole };
