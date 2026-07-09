import api from './client';

export const getCart = async () => {
    const res = await api.get('/cart');
    return res.data.data; // { id, items: [...flattened menu item fields], total, item_count }
};

export const addToCart = async (menuItemId, quantity, customizations = null) => {
    const res = await api.post('/cart/items', {
        menu_item_id: menuItemId,
        quantity,
        customizations,
    });
    return res.data.data;
};

export const updateCartItem = async (cartItemId, quantity) => {
    const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
    return res.data.data;
};

export const removeFromCart = async (cartItemId) => {
    const res = await api.delete(`/cart/items/${cartItemId}`);
    return res.data.data;
};

export const clearCart = async () => {
    const res = await api.delete('/cart');
    return res.data.data;
};
