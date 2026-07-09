const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/cafes', require('./cafe.routes'));
router.use('/menu-items', require('./menu.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/profile', require('./profile.routes'));

module.exports = router;
