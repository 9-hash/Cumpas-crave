import axios from 'axios';

// Point this at your Express server's base URL (not including /api).
// Set REACT_APP_API_URL in client/.env, e.g. http://localhost:4000
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the JWT (if present) to every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Normalize errors so components can keep doing `err.message`
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

// ==================== AUTH API ====================
export const auth = {
    register: (data) => api.post('/auth/register', data),
    login: (email, password) => api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
};

// ==================== CAFE API ====================
export const cafes = {
    getAll: () => api.get('/cafes'),
    getOne: (id) => api.get(`/cafes/${id}`),
};

// ==================== MENU API ====================
export const menu = {
    getItems: (cafeId) => {
        const url = cafeId ? `/menu-items?cafe_id=${cafeId}` : '/menu-items';
        return api.get(url);
    },
};

// ==================== CART API ====================
export const cart = {
    // Get cart
    get: () => api.get('/cart'),
    
    // Add item to cart
    add: (menu_item_id, quantity, customizations) => 
        api.post('/cart/items', { menu_item_id, quantity, customizations }),
    
    // Update item quantity
    update: (cartItemId, quantity) => 
        api.put(`/cart/items/${cartItemId}`, { quantity }),
    
    // Remove item from cart
    remove: (cartItemId) => 
        api.delete(`/cart/items/${cartItemId}`),
    
    // Clear cart
    clear: () => api.delete('/cart'),
};

// ==================== ORDER API ====================
export const orders = {
    getAll: () => api.get('/orders'),
    create: (data) => api.post('/orders', data),
};

// Default export for convenience
export default api;
