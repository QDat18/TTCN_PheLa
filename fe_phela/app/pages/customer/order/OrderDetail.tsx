import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import HeadOrder from '~/components/customer/HeadOrder';
import api from '~/config/axios';
import { useAuth } from '~/AuthContext';
import { FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import { confirmReceipt } from '~/services/orderService';
import { toast, ToastContainer } from 'react-toastify';

interface Product {
    productId: string;
    productName: string;
    originalPrice: number;
    imageUrl: string;
}

interface OrderItem {
    productId: string;
    productSizeId?: string;
    productSizeName?: string;
    quantity: number;
    price: number;
    amount: number;
    note: string;
    product?: Product;
}

interface Address {
    recipientName: string;
    phone: string;
    detailedAddress: string;
    ward: string;
    district: string;
    city: string;
}

interface Order {
    orderId: string;
    orderCode: string;
    totalAmount: number;
    shippingFee: number;
    totalDiscount: number;
    finalAmount: number;
    status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    paymentMethod: 'COD' | 'BANK_TRANSFER' | 'SEPAY';
    paymentStatus: 'PENDING' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'FAILED';
    orderDate: string;
    notesUsed: number;
    notesEarned: number;
    address: Address;
    orderItems: OrderItem[];
}

const OrderDetail = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProductDetails = async (productId: string): Promise<Product> => {
        try {
            const response = await api.get(`/api/product/get/${productId}`);
            return response.data;
        } catch (err) {
            return { productId, productName: 'Sản phẩm không xác định', originalPrice: 0, imageUrl: 'https://placehold.co/100x100?text=SP' };
        }
    };

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!user) return;
            if (!orderId) {
                setError("Thiếu mã đơn hàng.");
                setLoading(false);
                return;
            }
            try {
                setError(null);
                setLoading(true);
                const response = await api.get(`/api/order/${orderId}`);
                let orderData: Order = response.data;
                const itemsWithProducts = await Promise.all(
                    orderData.orderItems.map(async (item) => {
                        const product = await fetchProductDetails(item.productId);
                        return { ...item, product };
                    })
                );
                orderData.orderItems = itemsWithProducts;
                setOrder(orderData);
            } catch (err: any) {
                setError(err.response?.data?.message || "Không thể tải được chi tiết đơn hàng.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [orderId, user]);

    const getStatusText = (status: Order['status']) => {
        const statuses = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', DELIVERING: 'Đang giao hàng', DELIVERED: 'Đã giao hàng', CANCELLED: 'Đã hủy' };
        return statuses[status] || status;
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
        try {
            await api.delete(`/api/order/${orderId}/cancel`);
            toast.success('Đơn hàng đã được hủy thành công');
            const response = await api.get(`/api/order/${orderId}`);
            setOrder(response.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
        }
    };

    const handleConfirmReceipt = async () => {
        if (!window.confirm('Xác nhận bạn đã nhận được hàng?')) return;
        try {
            await confirmReceipt(orderId!);
            toast.success('Xác nhận đã nhận hàng thành công!');
            const response = await api.get(`/api/order/${orderId}`);
            setOrder(response.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xác nhận nhận hàng');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FCF8F1] flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E5D5C5] border-t-[#8C5A35] mb-6"></div>
            <p className="text-[#8C5A35] font-black uppercase tracking-widest text-sm">Đang tải chi tiết...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#FCF8F1] flex flex-col items-center justify-center text-center">
            <p className="text-xl font-black mb-4 uppercase tracking-widest text-red-500">Đã xảy ra lỗi</p>
            <p className="text-[#5C4D43] mb-8 font-bold">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#2C1E16] text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#8C5A35] transition-all">Thử lại</button>
        </div>
    );

    if (!order) return <div className="min-h-screen bg-[#FCF8F1] flex items-center justify-center text-[#5C4D43] uppercase font-black tracking-widest">Không tìm thấy đơn hàng</div>;

    return (
        <div className="min-h-screen bg-[#FCF8F1] text-[#2C1E16] pb-24">
            <div className="fixed top-0 left-0 w-full bg-[#FCF8F1] shadow-sm z-50 border-b border-[#E5D5C5]">
                <HeadOrder />
            </div>

            <div className="container mx-auto pt-32 px-4 max-w-4xl">
                <Link to="/my-orders" className="inline-flex items-center gap-2 text-[#5C4D43] font-bold text-xs uppercase tracking-widest hover:text-[#8C5A35] transition-colors mb-8">
                    <FiChevronLeft size={16} /> Quay lại danh sách
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Đơn hàng <span className="text-[#8C5A35]">#{order.orderCode}</span></h1>
                    <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-600 border-green-200' : (order.status === 'CANCELLED' ? 'bg-red-50 text-red-500 border-red-200' : 'bg-[#FDF5E6] text-[#8C5A35] border-[#8C5A35]/30')}`}>
                        {getStatusText(order.status)}
                    </span>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-[#E5D5C5] shadow-sm mb-8">
                    <h2 className="text-sm font-black text-[#8C5A35] mb-6 border-b border-[#E5D5C5] pb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-[#8C5A35] rounded-full"></span> Thông tin chung
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold text-[#5C4D43]">
                        <p className="flex justify-between items-center"><span className="opacity-70">Ngày đặt hàng:</span> <span className="text-[#2C1E16]">{new Date(order.orderDate).toLocaleString('vi-VN')}</span></p>
                        <p className="flex justify-between items-center"><span className="opacity-70">Thanh toán:</span> <span className="text-[#2C1E16] bg-[#FCF8F1] px-3 py-1 rounded-md">{order.paymentMethod === 'COD' ? 'Khi nhận hàng' : 'Chuyển khoản'}</span></p>
                        <p className="flex justify-between items-center"><span className="opacity-70">Trạng thái TT:</span> <span className={`${order.paymentStatus === 'COMPLETED' ? 'text-green-600 bg-green-50 border-green-200' : 'text-[#8C5A35] bg-[#FDF5E6] border-[#8C5A35]/20'} px-3 py-1 rounded-md border text-[11px] uppercase tracking-wider`}>{order.paymentStatus.replace('_', ' ')}</span></p>
                    </div>

                    {order.status === 'DELIVERING' && (
                        <div className="mt-8 pt-6 border-t border-dashed border-[#E5D5C5] text-right flex justify-end gap-4">
                            <button onClick={handleConfirmReceipt} className="px-8 py-3 bg-[#8C5A35] text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#2C1E16] transition-all flex items-center gap-2 shadow-lg shadow-[#8C5A35]/20">
                                <FiCheckCircle size={14} /> Xác nhận đã nhận hàng
                            </button>
                        </div>
                    )}

                    {order.status === 'PENDING' && order.paymentMethod === 'COD' && (
                        <div className="mt-8 pt-6 border-t border-dashed border-[#E5D5C5] text-right">
                            <button onClick={handleCancelOrder} className="px-8 py-3 bg-white border border-red-200 text-red-500 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all">
                                Hủy đơn hàng
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-[#E5D5C5] shadow-sm h-full">
                        <h2 className="text-sm font-black text-[#8C5A35] mb-6 border-b border-[#E5D5C5] pb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#8C5A35] rounded-full"></span> Địa chỉ giao
                        </h2>
                        {order.address ? (
                        <div className="space-y-3 text-sm font-bold text-[#5C4D43]">
                            <p className="flex justify-between"><span className="opacity-70">Người nhận:</span> <span className="text-[#2C1E16]">{order.address.recipientName}</span></p>
                            <p className="flex justify-between"><span className="opacity-70">Điện thoại:</span> <span className="text-[#2C1E16]">{order.address.phone}</span></p>
                            <div className="pt-2">
                                <span className="opacity-70 block mb-1">Địa chỉ:</span>
                                <p className="text-[#2C1E16] leading-relaxed bg-[#FCF8F1] p-3 rounded-xl border border-[#E5D5C5]/50">{`${order.address.detailedAddress}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`}</p>
                            </div>
                        </div>
                        ) : (
                        <p className="text-sm font-bold text-[#5C4D43] italic">Không có thông tin địa chỉ</p>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-[#E5D5C5] shadow-sm h-full">
                        <h2 className="text-sm font-black text-[#8C5A35] mb-6 border-b border-[#E5D5C5] pb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#8C5A35] rounded-full"></span> Thanh toán
                        </h2>
                        <div className="space-y-4 text-xs font-bold text-[#5C4D43] uppercase tracking-widest">
                            <div className="flex justify-between"><span>Tiền hàng:</span> <span className="text-[#2C1E16]">{order.totalAmount.toLocaleString()}₫</span></div>
                            <div className="flex justify-between"><span>Vận chuyển:</span> <span className="text-[#2C1E16]">{order.shippingFee.toLocaleString()}₫</span></div>
                            
                            {order.notesUsed > 0 && (
                                <div className="flex justify-between text-[#8C5A35]">
                                    <span>♫ Dùng {order.notesUsed} nốt:</span>
                                    <span>-{(order.notesUsed * 1000).toLocaleString()}₫</span>
                                </div>
                            )}

                            {order.totalDiscount > (order.notesUsed * 1000) && (
                                <div className="flex justify-between text-green-600">
                                    <span>Mã giảm giá:</span>
                                    <span>-{(order.totalDiscount - order.notesUsed * 1000).toLocaleString()}₫</span>
                                </div>
                            )}

                            {order.status === 'DELIVERED' && order.notesEarned > 0 && (
                                <div className="flex justify-between text-[#8C5A35] bg-[#8C5A35]/5 p-2 rounded-lg border border-[#8C5A35]/10 mt-2">
                                    <span className="flex items-center gap-1">✨ Tích lũy:</span>
                                    <span className="normal-case">+{order.notesEarned} nốt nhạc</span>
                                </div>
                            )}

                            <div className="flex justify-between items-end text-[11px] font-black pt-5 border-t border-dashed border-[#E5D5C5] mt-4 tracking-widest">
                                <span>Thành tiền:</span>
                                <span className="text-3xl text-[#8C5A35] tracking-tighter normal-case">{order.finalAmount.toLocaleString()}₫</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5D5C5] shadow-sm">
                    <h2 className="text-sm font-black text-[#8C5A35] mb-6 border-b border-[#E5D5C5] pb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-[#8C5A35] rounded-full"></span> Món đã đặt
                    </h2>
                    <div className="space-y-2">
                        {order.orderItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-4 border-b border-[#E5D5C5]/50 last:border-0 hover:bg-[#FCF8F1] px-3 rounded-2xl transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 flex-shrink-0 bg-[#FDF5E6] rounded-xl border border-[#E5D5C5]">
                                        <img
                                            src={item.product?.imageUrl || 'https://placehold.co/100x100?text=SP'}
                                            alt={item.product?.productName}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <span className="absolute -top-2 -right-2 bg-[#2C1E16] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-black text-[#2C1E16] uppercase tracking-wide text-sm mb-1">
                                            {item.product?.productName || 'Sản phẩm'}
                                            {item.productSizeName && <span className="ml-2 text-[9px] text-[#8C5A35] bg-[#8C5A35]/10 px-2 py-0.5 rounded-full border border-[#8C5A35]/20 uppercase">Size {item.productSizeName}</span>}
                                        </p>
                                        {item.note && <p className="text-[11px] text-[#5C4D43] font-bold italic">"{item.note}"</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-base text-[#8C5A35]">{item.amount.toLocaleString()}₫</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            <ToastContainer position="bottom-right" theme="light" />
        </div>
    );
};

export default OrderDetail;