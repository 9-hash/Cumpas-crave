const pool = require('../config/database');

const CafeModel = {
    async findAll({ activeOnly } = {}) {
        const query = activeOnly
            ? 'SELECT * FROM cafes WHERE is_active = true AND deleted_at IS NULL ORDER BY name'
            : 'SELECT * FROM cafes WHERE deleted_at IS NULL ORDER BY name';
        const result = await pool.query(query);
        return result.rows;
    },

    async findById(id) {
        const result = await pool.query('SELECT * FROM cafes WHERE id = $1 AND deleted_at IS NULL', [id]);
        return result.rows[0] || null;
    },

    async create({ name, description, location, contactPhone }) {
        const result = await pool.query(
            `INSERT INTO cafes (name, description, location, contact_phone, is_active)
             VALUES ($1, $2, $3, $4, true) RETURNING *`,
            [name, description || null, location, contactPhone || null]
        );
        return result.rows[0];
    },

    async addOwner({ userId, cafeId }) {
        await pool.query(
            `INSERT INTO cafe_users (user_id, cafe_id, position, hired_date)
             VALUES ($1, $2, 'Owner', CURRENT_DATE)`,
            [userId, cafeId]
        );
    },

    async update(id, { name, description, location, contactPhone, isActive }) {
        const result = await pool.query(
            `UPDATE cafes SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                location = COALESCE($3, location),
                contact_phone = COALESCE($4, contact_phone),
                is_active = COALESCE($5, is_active),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND deleted_at IS NULL RETURNING *`,
            [name, description, location, contactPhone, isActive, id]
        );
        return result.rows[0] || null;
    },

    async toggleStatus(id) {
        const result = await pool.query(
             `UPDATE cafes SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
            [id]
        );
        return result.rows[0] || null;
    },

    async delete(id, deletedBy) {
        const result = await pool.query(
            `UPDATE cafes
             SET deleted_at = CURRENT_TIMESTAMP,
                 deleted_by = $2,
                 is_active = false,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [id, deletedBy || null]
        );
        return result.rows[0] || null;
    },

    // Cafes a given user is assigned to work at (owner/staff), via cafe_users.
    async findByAssignedUser(userId) {
        const result = await pool.query(
            `SELECT c.* FROM cafes c
             JOIN cafe_users cu ON cu.cafe_id = c.id
             WHERE cu.user_id = $1
               AND c.deleted_at IS NULL
             ORDER BY c.name`,
            [userId]
        );
        return result.rows;
    },

    // Is this user assigned to this specific cafe? Used to scope owner
    // permissions to "their" cafe(s) rather than every cafe in the system.
    async isUserAssigned(userId, cafeId) {
        const result = await pool.query(
            'SELECT 1 FROM cafe_users WHERE user_id = $1 AND cafe_id = $2',
            [userId, cafeId]
        );
        return result.rows.length > 0;
    },
};

module.exports = CafeModel;
