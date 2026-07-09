const express = require('express');
const menuController = require('../controllers/menu.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireCafeAccessForMenuItem } = require('../middleware/cafeAccess');

const router = express.Router();

router.get('/', menuController.listMenuItems);
router.get('/:id', menuController.getMenuItem);

// Writes require: valid JWT (requireAuth) -> role is owner/admin (requireRole)
// -> AND, for owners, that they're actually assigned to this cafe (requireCafeAccessForMenuItem).
router.post('/', requireAuth, requireRole('owner', 'admin'), requireCafeAccessForMenuItem, menuController.createMenuItem);
router.put('/:id', requireAuth, requireRole('owner', 'admin'), requireCafeAccessForMenuItem, menuController.updateMenuItem);
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), requireCafeAccessForMenuItem, menuController.deleteMenuItem);

module.exports = router;
