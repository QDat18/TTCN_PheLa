import api from '~/config/axios';

export const getOrderById = async (orderId: string) => {
    const response = await api.get(`/api/order/${orderId}`);
    return response.data;
};

export const getOrdersByCustomerId = async (customerId: string, page = 0, size = 10, sort = 'createdAt,desc') => {
    const response = await api.get(`/api/order/customer/${customerId}`, {
        params: { page, size, sort }
    });
    return response.data;
};

export const confirmReceipt = async (orderId: string) => {
    const response = await api.post(`/api/order/${orderId}/confirm-receipt`);
    return response.data;
};

export const cancelOrder = async (orderId: string) => {
    const response = await api.delete(`/api/order/${orderId}/cancel`);
    return response.data;
};
