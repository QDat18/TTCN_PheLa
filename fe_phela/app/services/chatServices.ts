import api from '../config/axios';

export const getChatHistory = async (customerId: string) => {
    const response = await api.get(`/api/chat/history/${customerId}`);
    return response.data;
};

export const getConversations = async () => {
    const response = await api.get('/api/chat/conversations');
    return response.data;
};

export const getAdminConversations = async () => {
    const response = await api.get('/api/admin/conversations');
    return response.data;
};

export const getConversationMessages = async (conversationId: string) => {
    const response = await api.get(`/api/conversations/${conversationId}/messages`);
    return response.data;
};

export const assignConversation = async (conversationId: string) => {
    const response = await api.post(`/api/admin/conversations/${conversationId}/assign`);
    return response.data;
};

export const resolveConversation = async (conversationId: string) => {
    const response = await api.post(`/api/admin/conversations/${conversationId}/resolve`);
    return response.data;
};