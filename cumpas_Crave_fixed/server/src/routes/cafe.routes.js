const express = require('express');
const cafeController = require('../controllers/cafe.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireCafeAccessForCafe } = require('../middleware/cafeAccess');

const router = express.Router();

// NOTE: '/mine' must be declared before '/:id' or Express would treat
// "mine" as an :id value and route it to getCafe instead.
router.get('/mine', requireAuth, cafeController.listMyCafes);

router.get('/', cafeController.listCafes);
router.get('/:id', cafeController.getCafe);
router.post('/', requireAuth, requireRole('admin', 'owner'), cafeController.createCafe);
router.put('/:id', requireAuth, requireRole('admin', 'owner'), requireCafeAccessForCafe, cafeController.updateCafe);
router.patch('/:id/toggle-status', requireAuth, requireRole('admin', 'owner'), requireCafeAccessForCafe, cafeController.toggleCafeStatus);
router.delete('/:id', requireAuth, requireRole('admin'), cafeController.deleteCafe);

module.exports = router;
