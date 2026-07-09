const MenuItemModel = require('../models/menuItem.model');
const logger = require('../utils/logger');

async function listMenuItems(req, res) {
    try {
        const { cafe_id, cafeId, category, include_unavailable } = req.query;
        const items = await MenuItemModel.findAll({
            cafeId: cafe_id || cafeId,
            category,
            includeUnavailable: include_unavailable === 'true',
        });
        res.json({ success: true, data: items });
    } catch (error) {
        logger.error('List menu items failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
    }
}

async function getMenuItem(req, res) {
    try {
        const item = await MenuItemModel.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        res.json({ success: true, data: item });
    } catch (error) {
        logger.error('Get menu item failed', { error: error.message, menuItemId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to fetch menu item' });
    }
}

// --- Authorization: mounted behind requireAuth + requireRole('owner', 'admin') ---

async function createMenuItem(req, res) {
    const { cafe_id, name, description, price, category, preparation_time, image_url } = req.body;
    if (!cafe_id || !name || price === undefined) {
        return res.status(400).json({ success: false, error: 'cafe_id, name and price are required' });
    }
    try {
        const item = await MenuItemModel.create({
            cafeId: cafe_id, name, description, price, category,
            preparationTime: preparation_time, imageUrl: image_url,
        });
        logger.info('Menu item created', { menuItemId: item.id, cafeId: cafe_id, byUserId: req.user.id });
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        logger.error('Create menu item failed', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to create menu item' });
    }
}

async function updateMenuItem(req, res) {
    const { name, description, price, category, status, preparation_time, image_url } = req.body;
    try {
        const item = await MenuItemModel.update(req.params.id, {
            name, description, price, category, status,
            preparationTime: preparation_time, imageUrl: image_url,
        });
        if (!item) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        res.json({ success: true, data: item });
    } catch (error) {
        logger.error('Update menu item failed', { error: error.message, menuItemId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to update menu item' });
    }
}

async function deleteMenuItem(req, res) {
    try {
        const deleted = await MenuItemModel.delete(req.params.id, req.user.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        logger.info('Menu item soft deleted', { menuItemId: req.params.id, byUserId: req.user.id });
        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        logger.error('Delete menu item failed', { error: error.message, menuItemId: req.params.id });
        res.status(500).json({ success: false, error: 'Failed to delete menu item' });
    }
}

module.exports = { listMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };
