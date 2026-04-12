import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '~/config/axios';
import { useAuth } from '~/AuthContext';
import { confirmReceipt } from '~/services/orderService';
import { FiChevronRight, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import HeadOrder from '~/components/customer/HeadOrder';

interface OrderSummary {
    orderId: string;
    orderCode: string;
    orderDate: string;
    finalAmount: number;
    status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'FAILED';
    paymentMethod: 'COD' | 'BANK_TRANSFER' | 'SEPAY';
    notesEarned: number;
}

const MyOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        if (user && user.type === 'customer' && user.customerId) {
            try {
                const response = await api.get(`/api/order/customer/${user.customerId}`);
                setOrders(response.data);
            } catch (err: any) {
                console.error("Lỗi khi tải lịch sử đơn hàng:", err);
                setError(err.response?.data?.message || "Không thể tải được lịch sử đơn hàng.");
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const handleConfirmReceipt = async (orderId: string) => {
        if (!window.confirm('Xác nhận bạn đã nhận được hàng cho đơn hàng này?')) return;
        try {
            await confirmReceipt(orderId);
            toast.success('Xác nhận đã nhận hàng thành công!');
            fetchOrders(); // Refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xác nhận nhận hàng');
        }
    };

    const getStatusStyle = (status: OrderSummary['status']) => {
        switch (status) {
            case 'DELIVERED':
                return { text: 'Đã giao', className: 'bg-green-50 text-green-600 border-green-200' };
            case 'CANCELLED':
                return { text: 'Đã hủy', className: 'bg-red-50 text-red-500 border-red-200' };
            case 'DELIVERING':
                return { text: 'Đang giao', className: 'bg-blue-50 text-blue-600 border-blue-200' };
            case 'CONFIRMED':
                return { text: 'Đã xác nhận', className: 'bg-[#FDF5E6] text-[#8C5A35] border-[#8C5A35]/30' };
            case 'PENDING':
            default:
                return { text: 'Chờ xác nhận', className: 'bg-gray-100 text-gray-500 border-gray-200' };
        }
    };

    const getPaymentStatusStyle = (status: OrderSummary['paymentStatus']) => {
        switch (status) {
            case 'COMPLETED':
                return { text: 'Đã thanh toán', className: 'bg-green-50 text-green-600 border-green-200' };
            case 'AWAITING_PAYMENT':
                return { text: 'Chờ thanh toán', className: 'bg-[#FDF5E6] text-[#8C5A35] border-[#8C5A35]/30' };
            case 'FAILED':
                return { text: 'Thanh toán thất bại', className: 'bg-red-50 text-red-500 border-red-200' };
            case 'PENDING':
            default:
                return { text: 'Chờ xử lý', className: 'bg-gray-100 text-gray-500 border-gray-200' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FCF8F1] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5D5C5] border-t-[#8C5A35] mb-6"></div>
                <p className="text-[#8C5A35] font-black uppercase tracking-widest text-xs">Đang tải lịch sử đơn hàng...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FCF8F1] flex flex-col items-center justify-center text-[#2C1E16] p-8 text-center">
                <p className="text-xl font-black uppercase mb-4 tracking-widest text-red-500">Đã xảy ra lỗi</p>
                <p className="text-[#5C4D43] mb-8 max-w-md font-bold">{error}</p>
                <button onClick={() => window.location.reload()} className="px-10 py-3 bg-[#2C1E16] text-white hover:bg-[#8C5A35] rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Thử lại</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FCF8F1] text-[#2C1E16] pb-24">
            <div className="fixed top-0 left-0 w-full bg-[#FCF8F1] shadow-sm z-40 border-b border-[#E5D5C5]">
                <HeadOrder />
            </div>
            <div className="container mx-auto pt-32 p-4 max-w-5xl">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-center mb-12">Lịch sử đơn hàng</h1>

                {orders.length > 0 ? (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-[#E5D5C5] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#E5D5C5]">
                                <thead className="bg-[#FDF5E6]">
                                    <tr>
                                        <th scope="col" className="px-6 py-5 text-left text-[11px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Mã Đơn</th>
                                        <th scope="col" className="px-6 py-5 text-left text-[11px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Ngày Đặt</th>
                                        <th scope="col" className="px-6 py-5 text-left text-[11px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Tổng Tiền</th>
                                        <th scope="col" className="px-6 py-5 text-center text-[11px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Vận Chuyển</th>
                                        <th scope="col" className="px-6 py-5 text-center text-[11px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Thanh Toán</th>
                                        <th scope="col" className="px-6 py-5 text-right text-[11px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#E5D5C5]/50">
                                    {orders.map((order) => {
                                        const statusStyle = getStatusStyle(order.status);
                                        const paymentStatusStyle = getPaymentStatusStyle(order.paymentStatus);
                                        return (
                                            <tr key={order.orderId} className="hover:bg-[#FCF8F1] transition-colors group">
                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-[#2C1E16] group-hover:text-[#8C5A35]">#{order.orderCode}</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-[#5C4D43]">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-[#8C5A35]">{order.finalAmount.toLocaleString()}₫</td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-3 py-1 inline-flex text-[10px] font-black rounded-full uppercase tracking-widest border ${statusStyle.className}`}>
                                                            {statusStyle.text}
                                                        </span>
                                                        {order.status === 'DELIVERED' && order.notesEarned > 0 && (
                                                            <span className="text-[9px] font-black text-[#8C5A35] flex items-center gap-0.5 animate-pulse">
                                                                ♫ +{order.notesEarned}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 inline-flex text-[10px] font-black rounded-full uppercase tracking-widest border ${paymentStatusStyle.className}`}>
                                                        {paymentStatusStyle.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right flex justify-end gap-2">
                                                    {order.status === 'DELIVERING' && (
                                                        <button 
                                                            onClick={() => handleConfirmReceipt(order.orderId)}
                                                            className="inline-flex items-center gap-1 px-4 py-2 bg-[#8C5A35] text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-[#2C1E16] transition-all shadow-md"
                                                            title="Đã nhận hàng"
                                                        >
                                                            <FiCheckCircle size={12} /> Nhận hàng
                                                        </button>
                                                    )}
                                                    <Link to={`/my-orders/${order.orderId}`} className="inline-flex items-center gap-1 px-4 py-2 bg-[#FCF8F1] border border-[#E5D5C5] text-[#2C1E16] font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-[#8C5A35] hover:text-white hover:border-[#8C5A35] transition-all">
                                                        Chi tiết <FiChevronRight size={12} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-[#E5D5C5] shadow-sm max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiShoppingBag className="text-4xl text-[#8C5A35]/40" />
                        </div>
                        <p className="text-[#2C1E16] uppercase tracking-widest font-black text-lg mb-8">Bạn chưa có đơn hàng nào</p>
                        <Link to="/san-pham" className="inline-block px-10 py-4 bg-[#2C1E16] text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#8C5A35] transition-all hover:-translate-y-1 shadow-lg shadow-[#2C1E16]/10">
                            Khám phá menu ngay
                        </Link>
                    </div>
                )}
            </div>
            <ToastContainer position="bottom-right" theme="light" />
        </div>
    );
};

export default MyOrders;