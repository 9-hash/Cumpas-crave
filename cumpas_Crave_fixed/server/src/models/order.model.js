const pool = require('../config/database');

const OrderModel = {
    async findByStudent(studentId, { status, limit = 50 } = {}) {
        let query = `
            SELECT o.*, c.name AS cafe_name, c.location AS cafe_location
            FROM orders o
            JOIN cafes c ON o.cafe_id = c.id
            WHERE o.student_id = $1`;
        const values = [studentId];

        if (status) {
            values.push(status);
            query += ` AND o.order_status = $${values.length}`;
        }
        values.push(limit);
        query += ` ORDER BY o.created_at DESC LIMIT $${values.length}`;

        const result = await pool.query(query, values);
        return result.rows;
    },

    async findById(id) {
        const result = await pool.query(
            `SELECT o.*, c.name AS cafe_name, c.location AS cafe_location
             FROM orders o JOIN cafes c ON o.cafe_id = c.id
             WHERE o.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    async getItems(orderId) {
        const result = await pool.query(
            `SELECT oi.*, mi.name, mi.price AS current_price, mi.category
             FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
             WHERE oi.order_id = $1`,
            [orderId]
        );
        return result.rows;
    },

    async getPayment(orderId) {
        const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
        return result.rows[0] || null;
    },

    async updateStatus(id, status) {
        const result = await pool.query(
            `UPDATE orders SET order_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0] || null;
    },

    async markPaid(orderId) {
        await pool.query(
            `UPDATE orders SET order_status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [orderId]
        );
        await pool.query(`UPDATE payments SET payment_status = 'Paid' WHERE order_id = $1`, [orderId]);
    },

    /**
     * Places an order end-to-end inside a single DB transaction:
     * cart -> order + order_items + payment record -> clear cart.
     * Returns the created order, or throws with a `.statusCode` for the
     * controller to map to the right HTTP response.
     */
    async placeOrder({ studentId, cafeId, paymentType, specialInstructions }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const cartResult = await client.query('SELECT * FROM carts WHERE student_id = $1', [studentId]);
            if (cartResult.rows.length === 0) {
                throw Object.assign(new Error('Cart not found'), { statusCode: 400 });
            }
            const cart = cartResult.rows[0];

            const itemsResult = await client.query(
                `SELECT ci.*, mi.price AS current_price
                 FROM cart_items ci JOIN menu_items mi ON ci.menu_item_id = mi.id
                 WHERE ci.cart_id = $1
                   AND mi.deleted_at IS NULL
                   AND mi.cafe_id = $2`,
                [cart.id, cafeId]
            );
            const items = itemsResult.rows;
            if (items.length === 0) {
                throw Object.assign(new Error('Cart is empty for this cafe'), { statusCode: 400 });
            }

            const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
            if (itemCount > 6) {
                throw Object.assign(new Error('Maximum 6 items per order'), { statusCode: 400 });
            }

            const totalAmount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

            if (itemCount >= 4 && paymentType !== 'Online') {
                throw Object.assign(new Error('Orders with 4+ items require online payment'), { statusCode: 400 });
            }

            const orderResult = await client.query(
                `INSERT INTO orders (student_id, cafe_id, total_amount, item_count, payment_type, special_instructions, order_status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
                [studentId, cafeId, totalAmount, itemCount, paymentType, specialInstructions || null]
            );
            const order = orderResult.rows[0];

            for (const item of items) {
                await client.query(
                    `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [order.id, item.menu_item_id, item.quantity, item.unit_price, item.unit_price * item.quantity, item.customizations]
                );
            }

            await client.query(
                `INSERT INTO payments (order_id, amount, payment_method, payment_status)
                 VALUES ($1, $2, $3, 'Pending')`,
                [order.id, totalAmount, paymentType]
            );

            await client.query(
                `DELETE FROM cart_items ci
                 USING menu_items mi
                 WHERE ci.menu_item_id = mi.id
                   AND ci.cart_id = $1
                   AND mi.cafe_id = $2`,
                [cart.id, cafeId]
            );

            await client.query('COMMIT');
            return order;
        } catch (error) {
            try { await client.query('ROLLBACK'); } catch (_) { /* ignore rollback failure */ }
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = OrderModel;
