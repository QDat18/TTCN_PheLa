import axiosInstance from "../config/axios";

export const getVouchers = async () => {
    const response = await axiosInstance.get('/api/admin/vouchers');
    return response.data.data;
};

export const createVoucher = async (voucher: any) => {
    const response = await axiosInstance.post('/api/admin/vouchers', voucher);
    return response.data.data;
};

export const updateVoucher = async (id: string, voucher: any) => {
    const response = await axiosInstance.put(`/api/admin/vouchers/${id}`, voucher);
    return response.data.data;
};

export const deleteVoucher = async (id: string) => {
    const response = await axiosInstance.delete(`/api/admin/vouchers/${id}`);
    return response.data.data;
};

export const checkVoucher = async (code: string) => {
    const response = await axiosInstance.get(`/api/vouchers/check/${code}`);
    return response.data;
};
