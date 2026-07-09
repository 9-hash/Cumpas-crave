const pool = require('../config/database');

/**
 * User model — the ONLY place in the codebase that should write raw SQL
 * against the `users` table. Controllers call these methods; they never
 * touch `pool` directly. This is the "M" in MVC.
 */
const UserModel = {
    async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    },

    async findByUsername(username) {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await pool.query(
            'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    // Same as findById but including the password hash — only used internally
    // during login, never returned to the client.
    async findByIdWithPassword(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async create({ username, email, passwordHash, phone, role = 'student' }, client = pool) {
        const result = await client.query(
            `INSERT INTO users (username, email, password_hash, phone, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email, phone, role, created_at`,
            [username, email, passwordHash, phone, role]
        );
        return result.rows[0];
    },

    async updateLastLogin(id) {
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    },

    async savePasswordResetToken(userId, tokenHash, expiresAt) {
        await pool.query(
            `UPDATE users
             SET password_reset_token_hash = $1,
                 password_reset_expires_at = $2
             WHERE id = $3`,
            [tokenHash, expiresAt, userId]
        );
    },

    async findByValidPasswordResetToken(tokenHash) {
        const result = await pool.query(
            `SELECT *
             FROM users
             WHERE password_reset_token_hash = $1
               AND password_reset_expires_at > CURRENT_TIMESTAMP`,
            [tokenHash]
        );
        return result.rows[0] || null;
    },

    async updatePassword(id, passwordHash) {
        await pool.query(
            `UPDATE users
             SET password_hash = $1,
                 password_reset_token_hash = NULL,
                 password_reset_expires_at = NULL
             WHERE id = $2`,
            [passwordHash, id]
        );
    },

    /**
     * Registers a new user + their student profile in a single transaction.
     * Throws with a `.statusCode` (409) if email/username is already taken,
     * so the controller can map it straight to the right HTTP response —
     * same pattern as OrderModel.placeOrder.
     */
    async registerWithStudentProfile({ username, email, passwordHash, phone, student }) {
        const StudentModel = require('./student.model');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const existingEmail = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingEmail.rows.length > 0) {
                throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
            }

            const existingUsername = await client.query('SELECT id FROM users WHERE username = $1', [username]);
            if (existingUsername.rows.length > 0) {
                throw Object.assign(new Error('Username already taken'), { statusCode: 409 });
            }

            const user = await this.create({ username, email, passwordHash, phone }, client);
            await StudentModel.create({ ...student, userId: user.id }, client);

            await client.query('COMMIT');
            return user;
        } catch (error) {
            try { await client.query('ROLLBACK'); } catch (_) { /* ignore rollback failure */ }
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = UserModel;
