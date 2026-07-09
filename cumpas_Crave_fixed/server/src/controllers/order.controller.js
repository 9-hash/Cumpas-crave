const StudentModel = require('../models/student.model');
const OrderModel = require('../models/order.model');
const logger = require('../utils/logger');

async function listOrders(req, res) {
    try {
        const student = await StudentModel.findByUserId(req.user.id);
        if (!student) {
            return res.json({ success: true, data: [] });
        }
        const { status } = req.query;
        const limit = parseInt(req.query.limit, 10) || 50;
        const orders = await OrderModel.findByStudent(student.id, { status, limit });
        res.json({ success: true, data: orders });
    } catch (error) {
        logger.error('List orders failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
}

async function getOrder(req, res) {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        const items = await OrderModel.getItems(order.id);
        const payment = await OrderModel.getPayment(order.id);
        res.json({ success: true, data: { ...order, items, payment } });
    } catch (error) {
        logger.error('Get order failed', { error: error.message, orderId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
}

async function createOrder(req, res) {
    const { cafe_id, payment_type, special_instructions } = req.body;
    if (!cafe_id || !payment_type) {
        return res.status(400).json({ success: false, error: 'cafe_id and payment_type are required' });
    }
    try {
        const student = await StudentModel.findByUserId(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, error: 'Student profile not found' });
        }

        const order = await OrderModel.placeOrder({
            studentId: student.id,
            cafeId: cafe_id,
            paymentType: payment_type,
            specialInstructions: special_instructions,
        });

        logger.info('Order placed', { orderId: order.id, studentId: student.id, total: order.total_amount });
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        logger.error('Create order failed', { error: error.message, userId: req.user.id });
        res.status(error.statusCode || 503).json({ success: false, error: error.message || 'Failed to create order (database unavailable)' });
    }
}

// --- Authorization: mounted behind requireRole('staff', 'owner', 'admin') ---
async function updateOrderStatus(req, res) {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, error: 'status is required' });
    }
    try {
        const order = await OrderModel.updateStatus(req.params.id, status);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        logger.info('Order status updated', { orderId: order.id, status, byUserId: req.user.id });
        res.json({ success: true, data: order });
    } catch (error) {
        logger.error('Update order status failed', { error: error.message, orderId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
}

// Mock online-payment verification. Default password: 123456
async function verifyPayment(req, res) {
    const { payment_password } = req.body;
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const MOCK_PAYMENT_PASSWORD = process.env.MOCK_PAYMENT_PASSWORD || '123456';
        if (payment_password !== MOCK_PAYMENT_PASSWORD) {
            logger.warn('Payment verification failed: wrong password', { orderId: order.id });
            return res.json({ success: false, message: 'Incorrect payment password' });
        }

        await OrderModel.markPaid(order.id);
        logger.info('Payment verified', { orderId: order.id });
        res.json({ success: true, message: 'Payment successful! Order confirmed.' });
    } catch (error) {
        logger.error('Verify payment failed', { error: error.message, orderId: req.params.id });
        res.status(500).json({ success: false, error: 'Payment verification failed' });
    }
}

async function cancelOrder(req, res) {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        if (order.order_status !== 'PENDING' && order.order_status !== 'CONFIRMED') {
            return res.status(400).json({ success: false, error: 'Order cannot be cancelled at this stage' });
        }
        const updated = await OrderModel.updateStatus(req.params.id, 'CANCELLED');
        logger.info('Order cancelled', { orderId: req.params.id, byUserId: req.user.id });
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error('Cancel order failed', { error: error.message, orderId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to cancel order' });
    }
}

module.exports = { listOrders, getOrder, createOrder, updateOrderStatus, verifyPayment, cancelOrder };
