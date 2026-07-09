const pool = require('../config/database');

const MenuItemModel = {
    /**
     * List menu items, optionally filtered by cafe and/or category.
     * Only "Available" items are returned by default (case-insensitive,
     * so seed data using 'available' / 'Available' / 'AVAILABLE' all match —
     * a common source of "items exist in the DB but never show up" bugs).
     */
    async findAll({ cafeId, category, includeUnavailable = false, includeDeleted = false } = {}) {
        let query = 'SELECT * FROM menu_items WHERE 1=1';
        const values = [];

        if (!includeDeleted) {
            query += ' AND deleted_at IS NULL';
        }
        if (!includeUnavailable) {
            query += ` AND LOWER(status) = LOWER($${values.length + 1})`;
            values.push('Available');
        }
        if (cafeId) {
            values.push(cafeId);
            query += ` AND cafe_id = $${values.length}`;
        }
        if (category) {
            values.push(category);
            query += ` AND category = $${values.length}`;
        }
        query += ' ORDER BY category, name';

        const result = await pool.query(query, values);
        return result.rows;
    },

    async findByCafe(cafeId) {
        const result = await pool.query(
            'SELECT * FROM menu_items WHERE cafe_id = $1 AND deleted_at IS NULL ORDER BY category, name',
            [cafeId]
        );
        return result.rows;
    },

    async findById(id, { includeDeleted = false } = {}) {
        const result = await pool.query(
            `SELECT * FROM menu_items WHERE id = $1${includeDeleted ? '' : ' AND deleted_at IS NULL'}`,
            [id]
        );
        return result.rows[0] || null;
    },

    async create({ cafeId, name, description, price, category, preparationTime, imageUrl }) {
        const result = await pool.query(
            `INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, image_url, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available') RETURNING *`,
            [cafeId, name, description || null, price, category || null, preparationTime || null, imageUrl || null]
        );
        return result.rows[0];
    },

    async update(id, { name, description, price, category, status, preparationTime, imageUrl }) {
        const result = await pool.query(
            `UPDATE menu_items SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                price = COALESCE($3, price),
                category = COALESCE($4, category),
                status = COALESCE($5, status),
                preparation_time = COALESCE($6, preparation_time),
                image_url = COALESCE($7, image_url),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND deleted_at IS NULL RETURNING *`,
            [name, description, price, category, status, preparationTime, imageUrl, id]
        );
        return result.rows[0] || null;
    },

    async delete(id, deletedBy) {
        const result = await pool.query(
            `UPDATE menu_items
             SET deleted_at = CURRENT_TIMESTAMP,
                 deleted_by = $2,
                 status = 'Unavailable',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [id, deletedBy || null]
        );
        return result.rows[0] || null;
    },
};

module.exports = MenuItemModel;
