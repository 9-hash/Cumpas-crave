const CafeModel = require('../models/cafe.model');
const MenuItemModel = require('../models/menuItem.model');
const logger = require('../utils/logger');


const requireCafeAccessForMenuItem = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') return next();

        if (req.user.role !== 'owner') {
            return res.status(403).json({ success: false, error: 'Not authorized for this action' });
        }

        // Create: cafe_id comes from the request body.
        // Update/Delete: cafe_id must be looked up from the existing menu item.
        let cafeId = req.body.cafe_id;
        if (!cafeId && req.params.id) {
            const item = await MenuItemModel.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ success: false, error: 'Menu item not found' });
            }
            cafeId = item.cafe_id;
        }

        if (!cafeId) {
            return res.status(400).json({ success: false, error: 'cafe_id is required' });
        }

        const assigned = await CafeModel.isUserAssigned(req.user.id, cafeId);
        if (!assigned) {
            logger.warn('Blocked cross-cafe menu write attempt', { userId: req.user.id, cafeId });
            return res.status(403).json({ success: false, error: 'You are not assigned to this cafe' });
        }

        next();
    } catch (error) {
        logger.error('Cafe access check failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Authorization check failed' });
    }
};

/**
 * Same idea, for cafe-record writes (PUT /cafes/:id, toggle-status).
 * cafe_id is the route param itself here.
 */
const requireCafeAccessForCafe = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') return next();

        if (req.user.role !== 'owner') {
            return res.status(403).json({ success: false, error: 'Not authorized for this action' });
        }

        const assigned = await CafeModel.isUserAssigned(req.user.id, req.params.id);
        if (!assigned) {
            logger.warn('Blocked cross-cafe management attempt', { userId: req.user.id, cafeId: req.params.id });
            return res.status(403).json({ success: false, error: 'You are not assigned to this cafe' });
        }

        next();
    } catch (error) {
        logger.error('Cafe access check failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Authorization check failed' });
    }
};

module.exports = { requireCafeAccessForMenuItem, requireCafeAccessForCafe };
