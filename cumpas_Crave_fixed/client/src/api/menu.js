import api from './client';

export const getMenuItems = async (cafeId, { includeUnavailable = false } = {}) => {
    const params = {};
    if (cafeId) params.cafe_id = cafeId;
    if (includeUnavailable) params.include_unavailable = 'true';
    const res = await api.get('/menu-items', { params });
    return res.data.data; // array of menu items
};

export const createMenuItem = async (input) => {
    // input: { cafe_id, name, description, price, category, preparation_time, image_url }
    const res = await api.post('/menu-items', input);
    return res.data.data;
};

export const updateMenuItem = async (itemId, updates) => {
    const res = await api.put(`/menu-items/${itemId}`, updates);
    return res.data.data;
};

export const deleteMenuItem = async (itemId) => {
    const res = await api.delete(`/menu-items/${itemId}`);
    return res.data.data;
};
