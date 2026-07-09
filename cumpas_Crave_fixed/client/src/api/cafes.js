import api from './client';

export const getCafes = async (activeOnly = false) => {
    const res = await api.get('/cafes', { params: activeOnly ? { active_only: 'true' } : {} });
    return res.data.data; // array of cafes
};

export const getCafe = async (cafeId) => {
    const res = await api.get(`/cafes/${cafeId}`);
    return res.data.data; // cafe + menu_items
};

// Cafes the logged-in user (owner) is assigned to. Requires auth.
export const getMyCafes = async () => {
    const res = await api.get('/cafes/mine');
    return res.data.data;
};

export const createCafe = async (input) => {
    const res = await api.post('/cafes', input);
    return res.data.data;
};

export const updateCafe = async (cafeId, updates) => {
    const res = await api.put(`/cafes/${cafeId}`, updates);
    return res.data.data;
};

export const toggleCafeStatus = async (cafeId) => {
    const res = await api.patch(`/cafes/${cafeId}/toggle-status`);
    return res.data.data;
};

export const deleteCafe = async (cafeId) => {
    const res = await api.delete(`/cafes/${cafeId}`);
    return res.data.data;
};
