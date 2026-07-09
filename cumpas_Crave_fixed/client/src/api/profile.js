import api from './client';

export const getProfile = async () => {
    const res = await api.get('/profile');
    return res.data.data; // { user, profile }
};

export const updateProfile = async (updates) => {
    const res = await api.put('/profile', updates);
    return res.data.data;
};
