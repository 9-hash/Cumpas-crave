const StudentModel = require('../models/student.model');
const CartModel = require('../models/cart.model');
const MenuItemModel = require('../models/menuItem.model');
const logger = require('../utils/logger');

// Shared helper: get (or create) the logged-in student's cart with computed totals.
async function getOrCreateCart(userId) {
    const student = await StudentModel.findByUserId(userId);
    if (!student) {
        throw Object.assign(new Error('Student profile not found'), { statusCode: 404 });
    }

    let cart = await CartModel.findCartByStudentId(student.id);
    if (!cart) {
        cart = await CartModel.createCart(student.id);
    }

    const items = await CartModel.getItemsWithMenuInfo(cart.id);
    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const item_count = items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, items, total, item_count, studentId: student.id };
}

async function getCart(req, res) {
    try {
        const cart = await getOrCreateCart(req.user.id);
        res.json({ success: true, data: cart });
    } catch (error) {
        logger.error('Get cart failed', { error: error.message, userId: req.user.id });
        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Failed to fetch cart' });
    }
}

async function addItem(req, res) {
    const { menu_item_id, quantity, customizations } = req.body;
    if (!menu_item_id || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'menu_item_id and a positive quantity are required' });
    }
    try {
        const cart = await getOrCreateCart(req.user.id);

        const menuItem = await MenuItemModel.findById(menu_item_id);
        if (!menuItem) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }

        const existing = await CartModel.findItem(cart.id, menu_item_id);
        if (existing) {
            await CartModel.incrementItemQuantity(existing.id, quantity);
        } else {
            await CartModel.insertItem({ cartId: cart.id, menuItemId: menu_item_id, quantity, unitPrice: menuItem.price, customizations });
        }

        const updatedCart = await getOrCreateCart(req.user.id);
        res.status(201).json({ success: true, data: updatedCart });
    } catch (error) {
        logger.error('Add to cart failed', { error: error.message, userId: req.user.id });
        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Failed to add to cart' });
    }
}

async function updateItem(req, res) {
    const { quantity } = req.body;
    if (quantity === undefined) {
        return res.status(400).json({ success: false, error: 'quantity is required' });
    }
    try {
        if (quantity <= 0) {
            await CartModel.deleteItem(req.params.cartItemId);
        } else {
            await CartModel.setItemQuantity(req.params.cartItemId, quantity);
        }
        const updatedCart = await getOrCreateCart(req.user.id);
        res.json({ success: true, data: updatedCart });
    } catch (error) {
        logger.error('Update cart item failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to update cart item' });
    }
}

async function removeItem(req, res) {
    try {
        await CartModel.deleteItem(req.params.cartItemId);
        const updatedCart = await getOrCreateCart(req.user.id);
        res.json({ success: true, data: updatedCart });
    } catch (error) {
        logger.error('Remove cart item failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to remove cart item' });
    }
}

async function clearCart(req, res) {
    try {
        const student = await StudentModel.findByUserId(req.user.id);
        if (student) {
            const cart = await CartModel.findCartByStudentId(student.id);
            if (cart) {
                await CartModel.clearCartItems(cart.id);
            }
        }
        res.json({ success: true, data: { cleared: true } });
    } catch (error) {
        logger.error('Clear cart failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to clear cart' });
    }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
