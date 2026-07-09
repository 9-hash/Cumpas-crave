import api from './client';

export const getMyOrders = async () => {
    const res = await api.get('/orders');
    const orders = res.data.data;
    // The list endpoint returns order summaries only (no line items).
    // Fetch full details for each order in parallel so the UI can show items,
    // same as the old GraphQL myOrders query did.
    const detailed = await Promise.all(
        orders.map((order) => api.get(`/orders/${order.id}`).then((r) => r.data.data))
    );
    return detailed;
};

export const createOrder = async (cafeId, paymentType, specialInstructions = null) => {
    const res = await api.post('/orders', {
        cafe_id: cafeId,
        payment_type: paymentType,
        special_instructions: specialInstructions,
    });
    return res.data.data;
};

export const verifyPayment = async (orderId, paymentPassword) => {
    const res = await api.post(`/orders/${orderId}/verify-payment`, {
        payment_password: paymentPassword,
    });
    return res.data; // { success, message }
};

export const cancelOrder = async (orderId) => {
    const res = await api.patch(`/orders/${orderId}/cancel`);
    return res.data.data;
};
