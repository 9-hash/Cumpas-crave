const CafeModel = require('../models/cafe.model');
const MenuItemModel = require('../models/menuItem.model');
const logger = require('../utils/logger');

async function listMyCafes(req, res) {
    try {
        const cafes = await CafeModel.findByAssignedUser(req.user.id);
        res.json({ success: true, data: cafes });
    } catch (error) {
        logger.error('List my cafes failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to fetch your cafes' });
    }
}

async function listCafes(req, res) {
    try {
        const activeOnly = req.query.active_only === 'true';
        const cafes = await CafeModel.findAll({ activeOnly });
        res.json({ success: true, data: cafes });
    } catch (error) {
        logger.error('List cafes failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch cafes' });
    }
}

async function getCafe(req, res) {
    try {
        const cafe = await CafeModel.findById(req.params.id);
        if (!cafe) {
            return res.status(404).json({ success: false, error: 'Cafe not found' });
        }
        const menuItems = await MenuItemModel.findByCafe(req.params.id);
        res.json({ success: true, data: { ...cafe, menu_items: menuItems } });
    } catch (error) {
        logger.error('Get cafe failed', { error: error.message, cafeId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to fetch cafe' });
    }
}

// --- Authorization note: everything below is mounted with requireAuth + requireRole
// in routes/cafe.routes.js, so req.user is guaranteed to exist and hold an allowed role. ---

async function createCafe(req, res) {
    const { name, description, location, contact_phone } = req.body;
    if (!name || !location) {
        return res.status(400).json({ success: false, error: 'name and location are required' });
    }
    try {
        const cafe = await CafeModel.create({ name, description, location, contactPhone: contact_phone });

        if (req.user.role === 'owner') {
            await CafeModel.addOwner({ userId: req.user.id, cafeId: cafe.id });
        }

        logger.info('Cafe created', { cafeId: cafe.id, byUserId: req.user.id });
        res.status(201).json({ success: true, data: cafe });
    } catch (error) {
        logger.error('Create cafe failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to create cafe' });
    }
}

async function updateCafe(req, res) {
    const { name, description, location, contact_phone, is_active } = req.body;
    try {
        const cafe = await CafeModel.update(req.params.id, {
            name, description, location, contactPhone: contact_phone, isActive: is_active,
        });
        if (!cafe) {
            return res.status(404).json({ success: false, error: 'Cafe not found' });
        }
        res.json({ success: true, data: cafe });
    } catch (error) {
        logger.error('Update cafe failed', { error: error.message, cafeId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to update cafe' });
    }
}

async function toggleCafeStatus(req, res) {
    try {
        const cafe = await CafeModel.toggleStatus(req.params.id);
        if (!cafe) {
            return res.status(404).json({ success: false, error: 'Cafe not found' });
        }
        logger.info('Cafe status toggled', { cafeId: cafe.id, isActive: cafe.is_active, byUserId: req.user.id });
        res.json({ success: true, data: cafe });
    } catch (error) {
        logger.error('Toggle cafe status failed', { error: error.message, cafeId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to toggle cafe status' });
    }
}

async function deleteCafe(req, res) {
    try {
        const deleted = await CafeModel.delete(req.params.id, req.user.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Cafe not found' });
        }
        logger.info('Cafe soft deleted', { cafeId: req.params.id, byUserId: req.user.id });
        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        logger.error('Delete cafe failed', { error: error.message, cafeId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to delete cafe' });
    }
}

module.exports = { listMyCafes, listCafes, getCafe, createCafe, updateCafe, toggleCafeStatus, deleteCafe };
