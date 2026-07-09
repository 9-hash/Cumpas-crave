const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_crave_secret_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Sign a JWT for a user record
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verify a raw token string (no "Bearer " prefix) -> decoded payload or throws
const verifyToken = (rawToken) => {
    return jwt.verify(rawToken, JWT_SECRET);
};

// Strip "Bearer " prefix if present
const stripBearer = (token = '') => token.replace(/^Bearer\s+/i, '');

// Look up the full user row from an Authorization header value (used by GraphQL context)
const getUserFromToken = async (token) => {
    if (!token) return null;

    try {
        const decoded = verifyToken(stripBearer(token));

        const result = await pool.query(
            'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
            [decoded.id]
        );

        return result.rows[0] || null;
    } catch (error) {
        return null;
    }
};

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    generateToken,
    verifyToken,
    stripBearer,
    getUserFromToken,
};
