const bcrypt = require('bcrypt');
const crypto = require('crypto');
const UserModel = require('../models/user.model');
const { generateToken } = require('../utils/token');
const logger = require('../utils/logger');

const RESET_TOKEN_MINUTES = 30;

function hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/auth/register
 * Hashes the password with bcrypt (never stored in plain text), creates the
 * user + student rows in one transaction, then issues a JWT.
 */
async function register(req, res) {
    const { username, full_name, email, password, phone, reg_no, institution, department, year_of_study } = req.body;

    const required = { username, full_name, email, password, phone, reg_no, institution };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    try {
        // --- Hashing: bcrypt with a salt round of 10. Plain-text passwords are never stored. ---
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await UserModel.registerWithStudentProfile({
            username, email, passwordHash, phone,
            student: { fullName: full_name, regNo: reg_no, institution, department, yearOfStudy: year_of_study, phoneNumber: phone },
        });

        // --- JWT: issue a signed token identifying this user for future requests. ---
        const token = generateToken(user);
        logger.info('User registered', { userId: user.id, username: user.username });
        res.status(201).json({ success: true, data: { token, user } });
    } catch (error) {
        if (error.statusCode === 409) {
            logger.warn('Registration blocked', { error: error.message, email, username });
            return res.status(409).json({ success: false, error: error.message });
        }
        logger.error('Registration failed', { error: error.message });
        res.status(503).json({ success: false, error: 'Registration failed (database unavailable)' });
    }
}

/**
 * POST /api/auth/login
 * Authentication: verifies the email exists and the password matches the
 * stored bcrypt hash, then issues a JWT the client will send back on every
 * subsequent request (Authorization: Bearer <token>).
 */
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    try {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            logger.warn('Login failed: no user with this email', { email });
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            logger.warn('Login failed: wrong password', { userId: user.id, email });
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        await UserModel.updateLastLogin(user.id);

        const token = generateToken(user);
        delete user.password_hash;

        logger.info('User logged in', { userId: user.id, email: user.email, role: user.role });
        res.json({ success: true, data: { token, user } });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ success: false, error: 'Login failed' });
    }
}

/**
 * GET /api/auth/me
 * Behind requireAuth — req.user was already populated by the JWT middleware.
 */
function me(req, res) {
    res.json({ success: true, data: req.user });
}

async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const genericResponse = {
        success: true,
        message: 'If that email exists, a password reset link has been prepared.',
    };

    try {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            logger.warn('Password reset requested for unknown email', { email });
            return res.json(genericResponse);
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashResetToken(token);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);
        await UserModel.savePasswordResetToken(user.id, tokenHash, expiresAt);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        logger.info('Password reset token created', { userId: user.id, email });

        res.json({
            ...genericResponse,
            data: {
                reset_url: resetUrl,
                token,
                expires_at: expiresAt,
            },
        });
    } catch (error) {
        logger.error('Forgot password failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to prepare password reset' });
    }
}

async function resetPassword(req, res) {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ success: false, error: 'Token and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    try {
        const tokenHash = hashResetToken(token);
        const user = await UserModel.findByValidPasswordResetToken(tokenHash);
        if (!user) {
            return res.status(400).json({ success: false, error: 'Reset link is invalid or expired' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await UserModel.updatePassword(user.id, passwordHash);

        logger.info('Password reset completed', { userId: user.id, email: user.email });
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        logger.error('Reset password failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to reset password' });
    }
}

module.exports = { register, login, me, forgotPassword, resetPassword };
