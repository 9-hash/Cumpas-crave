const express = require('express');
const orderController = require('../controllers/order.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.patch('/:id/status', requireRole('staff', 'owner', 'admin'), orderController.updateOrderStatus);
router.post('/:id/verify-payment', orderController.verifyPayment);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
