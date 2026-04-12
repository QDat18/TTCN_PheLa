import api from '../config/axios';

export const getChatHistory = async (customerId: string) => {
    const response = await api.get(`/api/chat/history/${customerId}`);
    return response.data;
};

export const getConversations = async () => {
    const response = await api.get('/api/chat/conversations');
    return response.data;
};