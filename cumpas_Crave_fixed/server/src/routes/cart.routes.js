const express = require('express');
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:cartItemId', cartController.updateItem);
router.delete('/items/:cartItemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
