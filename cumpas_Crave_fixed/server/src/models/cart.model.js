const pool = require('../config/database');

const CartModel = {
    async findCartByStudentId(studentId) {
        const result = await pool.query('SELECT * FROM carts WHERE student_id = $1', [studentId]);
        return result.rows[0] || null;
    },

    async createCart(studentId) {
        const result = await pool.query('INSERT INTO carts (student_id) VALUES ($1) RETURNING *', [studentId]);
        return result.rows[0];
    },

    async getItemsWithMenuInfo(cartId) {
        const result = await pool.query(
            `SELECT ci.*, mi.name, mi.price AS current_price, mi.category, mi.description, mi.cafe_id
             FROM cart_items ci
             JOIN menu_items mi ON ci.menu_item_id = mi.id
             WHERE ci.cart_id = $1
               AND mi.deleted_at IS NULL`,
            [cartId]
        );
        return result.rows;
    },

    async findItem(cartId, menuItemId) {
        const result = await pool.query(
            'SELECT * FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2',
            [cartId, menuItemId]
        );
        return result.rows[0] || null;
    },

    async incrementItemQuantity(cartItemId, quantity) {
        await pool.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2', [quantity, cartItemId]);
    },

    async insertItem({ cartId, menuItemId, quantity, unitPrice, customizations }) {
        await pool.query(
            `INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, customizations)
             VALUES ($1, $2, $3, $4, $5)`,
            [cartId, menuItemId, quantity, unitPrice, customizations || null]
        );
    },

    async setItemQuantity(cartItemId, quantity) {
        await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, cartItemId]);
    },

    async deleteItem(cartItemId) {
        await pool.query('DELETE FROM cart_items WHERE id = $1', [cartItemId]);
    },

    async clearCartItems(cartId) {
        await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    },
};

module.exports = CartModel;
