import api from './client';

export const registerUser = async (input) => {
    const res = await api.post('/auth/register', input);
    return res.data.data; // { token, user }
};

export const loginUser = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data; // { token, user }
};

export const getMe = async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
};

export const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
};

export const resetPassword = async (token, password) => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
};
