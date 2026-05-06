import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '~/config/axios';
import { IoCopyOutline, IoQrCodeOutline, IoCheckmarkCircleOutline, IoPrintOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import logo from "../../../assets/images/logo.png";

interface Product {
    productId: string;
    productName: string;
    originalPrice: number;
    imageUrl: string;
}

interface Topping {
    productId: string;
    productName: string;
    originalPrice: number;
}

interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
    amount: number;
    note: string;
    product?: Product;
    productSizeName?: string;
    selectedToppings?: Topping[];
}

interface Address {
    recipientName: string;
    phone: string;
    detailedAddress: string;
    ward: string;
    district: string;
    city: string;
}

interface Branch {
    branchCode: string;
    branchName: string;
    address: string;
}

interface Order {
    orderId: string;
    orderCode: string;
    totalAmount: number;
    shippingFee: number;
    totalDiscount: number;
    finalAmount: number;
    status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    paymentMethod: 'COD' | 'BANK_TRANSFER';
    paymentStatus: 'PENDING' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'FAILED';
    orderDate: string;
    notesUsed: number;
    notesEarned: number;
    address: Address;
    orderItems: OrderItem[];
    branch?: Branch;
}


interface CustomerInfo {
    username: string;
    email: string;
    gender: string;
}


const OrderDetailReport = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProductDetails = async (productId: string): Promise<Product> => {
        try {
            const response = await api.get(`/api/product/get/${productId}`);
            return response.data;
        } catch (err) {
            console.error(`Lỗi khi tải sản phẩm ${productId}:`, err);
            return {
                productId,
                productName: 'Sản phẩm không xác định',
                originalPrice: 0,
                imageUrl: '/images/default-product.png' 
            };
        }
    };

    useEffect(() => {
        if (!orderId) return;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // SỬA LỖI: Lấy ra `.data` từ mỗi response
                const [orderRes, customerRes] = await Promise.all([
                    api.get(`/api/order/${orderId}`),
                    api.get(`/api/order/${orderId}/customer`)
                ]);

                let orderData: Order = orderRes.data;
                
                // SỬA LỖI: Gắn thông tin sản phẩm vào một biến mới
                const itemsWithProducts = await Promise.all(
                    orderData.orderItems.map(async (item) => {
                        const product = await fetchProductDetails(item.productId);
                        return { ...item, product };
                    })
                );
                
                // Cập nhật lại orderData với danh sách sản phẩm đầy đủ
                orderData.orderItems = itemsWithProducts;

                setOrder(orderData);
                setCustomer(customerRes.data);
            } catch (error) {
                console.error("Failed to fetch order details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [orderId]);

    const getPaymentMethodText = (method: string) => {
        return method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán Chuyển khoản (SePay)';
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}!`);
    };

    const getPaymentDescription = (code: string) => {
        const cleanCode = code.replace(/\s+/g, '');
        return cleanCode.startsWith('PL') ? cleanCode : `PL${cleanCode}`;
    };

    const handlePrint = () => {
        window.print();
    };
    
    const getStatusText = (status: string) => {
        const statuses = {
            PENDING: 'Chờ xác nhận',
            CONFIRMED: 'Đã xác nhận',
            DELIVERING: 'Đang giao hàng',
            DELIVERED: 'Đã giao hàng',
            CANCELLED: 'Đã hủy'
        };
        return statuses[status as keyof typeof statuses] || status;
    };


    if (loading) return (
        <div className="py-8">
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        </div>
    );

    if (!order) return (
        <div className="py-8">
            <div className="p-6 text-center text-red-500">
                Không tìm thấy đơn hàng.
            </div>
        </div>
    );

    return (
        <div className="py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Chi tiết đơn hàng #{order.orderCode}
                        </h1>
                        <button 
                            onClick={handlePrint}
                            className="bg-white border-2 border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2 font-bold group print:hidden"
                        >
                            <IoPrintOutline className="group-hover:scale-110 transition-transform" /> In hóa đơn
                        </button>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                        {getStatusText(order.status)}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột chính: Danh sách sản phẩm và tổng tiền */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                                Danh sách sản phẩm
                            </h2>
                            <div className="space-y-4">
                                {order.orderItems.map((item, index) => (
                                    <div key={index} className="flex items-start border-b pb-4 last:border-b-0">
                                        <img 
                                            src={item.product?.imageUrl || '/images/default-product.png'} 
                                            alt={item.product?.productName}
                                            className="w-16 h-16 object-cover rounded-md mr-4"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.product?.productName}</h3>
                                            <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{item.amount.toLocaleString()} VND</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Tổng kết đơn hàng */}
                            <div className="mt-6 pt-4 border-t space-y-2">
                                <div className="flex justify-between"><span className="text-gray-600">Tổng tiền hàng:</span><span className="font-medium">{order.totalAmount.toLocaleString()} VND</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Phí vận chuyển:</span><span className="font-medium">{order.shippingFee.toLocaleString()} VND</span></div>
                                
                                {order.notesUsed > 0 && (
                                    <div className="flex justify-between text-primary">
                                        <span className="flex items-center gap-1 font-bold">♫ Đã dùng {order.notesUsed} nốt nhạc:</span>
                                        <span className="font-bold">-{(order.notesUsed * 1000).toLocaleString()} VND</span>
                                    </div>
                                )}

                                {order.totalDiscount > (order.notesUsed * 1000) && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Mã giảm giá:</span>
                                        <span>-{(order.totalDiscount - order.notesUsed * 1000).toLocaleString()} VND</span>
                                    </div>
                                )}

                                {order.status === 'DELIVERED' && order.notesEarned > 0 && (
                                    <div className="flex justify-between text-primary bg-primary/5 p-2 rounded-lg border border-primary/10 mt-2">
                                        <span className="flex items-center gap-1 italic">✨ Tích lũy cho khách:</span>
                                        <span className="font-bold">+{order.notesEarned} nốt nhạc</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t"><span className="text-gray-800">Thành tiền:</span><span className="text-primary">{order.finalAmount.toLocaleString()} VND</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phụ: Thông tin khách hàng và giao hàng */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                                Thông tin khách hàng
                            </h2>
                            {customer ? (
                                <div className="space-y-2 text-sm">
                                    <p><strong className="font-medium text-gray-600">Tên:</strong> {customer.username}</p>
                                    <p><strong className="font-medium text-gray-600">Email:</strong> {customer.email}</p>
                                    <p><strong className="font-medium text-gray-600">Giới tính:</strong> {customer.gender}</p>
                                </div>
                            ) : <p className="text-sm text-gray-500">Không có thông tin khách hàng.</p>}
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                                Thông tin giao hàng
                            </h2>
                            <div className="space-y-2 text-sm">
                                <p><strong className="font-medium text-gray-600">Người nhận:</strong> {order.address.recipientName}</p>
                                <p><strong className="font-medium text-gray-600">SĐT Giao hàng:</strong> {order.address.phone}</p>
                                <p><strong className="font-medium text-gray-600">Địa chỉ:</strong> {`${order.address.detailedAddress}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`}</p>
                            </div>
                        </div>
                         <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                                Thông tin thanh toán
                            </h2>
                             <div className="space-y-2 text-sm">
                                <p><strong className="font-medium text-gray-600">Phương thức:</strong> {getPaymentMethodText(order.paymentMethod)}</p>
                                 <p><strong className="font-medium text-gray-600">Trạng thái:</strong> {order.paymentStatus.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {order.paymentStatus !== 'COMPLETED' && (
                            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-primary/20">
                                <h2 className="text-lg font-semibold text-primary mb-4 pb-2 border-b flex items-center gap-2">
                                    <IoQrCodeOutline className="animate-pulse" /> QR Thanh toán (SePay)
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-white p-2 rounded-xl border-2 border-gray-100 flex justify-center">
                                        <img 
                                            src={`https://img.vietqr.io/image/970422-5555501082005-compact2.png?amount=${order.finalAmount}&addInfo=${getPaymentDescription(order.orderCode)}&accountName=HOANG%20QUANG%20DAT`}
                                            alt="SePay QR"
                                            className="w-full max-w-[200px] aspect-square rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                          <p className="text-[10px] uppercase font-black text-blue-600 mb-1">Nội dung chuyển khoản</p>
                                          <div className="flex justify-between items-center">
                                            <span className="font-mono font-black text-blue-900 tracking-wider">
                                              {getPaymentDescription(order.orderCode)}
                                            </span>
                                            <button 
                                              onClick={() => copyToClipboard(getPaymentDescription(order.orderCode), 'Nội dung')}
                                              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
                                            >
                                              <IoCopyOutline size={14} />
                                            </button>
                                          </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                          <p className="text-[10px] uppercase font-black text-gray-500 mb-1 italic leading-tight">
                                            * Lưu ý: Khi khách quét mã này, hệ thống sẽ tự động duyệt tiền sau 1 phút.
                                          </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* UI PRINTABLE BILL - THIẾT KẾ CHUYÊN NGHIỆP CHO MÁY IN NHIỆT (80mm) */}
            <div id="printable-bill" className="hidden print:block bg-white p-4 w-[80mm] mx-auto text-black font-mono">
                {/* Header */}
                <div className="text-center mb-6">
                    <img src={logo} alt="Phe La" className="w-20 mx-auto grayscale opacity-90 mb-2" />
                    <h2 className="text-sm font-bold uppercase">{order.branch?.branchName || "Phê La - Cửa hàng Phê La"}</h2>
                    <p className="text-[10px] text-gray-600 italic">Hương vị nguyên bản từ Đà Lạt</p>
                    <div className="mt-4 border-y-2 border-black py-2">
                        <h1 className="text-lg font-black uppercase">HÓA ĐƠN GIAO HÀNG</h1>
                        <p className="text-[11px] font-bold">Mã đơn: {order.orderCode}</p>
                        <p className="text-[10px]">Ngày: {new Date(order.orderDate).toLocaleString('vi-VN')}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6 text-[11px] space-y-1">
                    <p><strong>Khách hàng:</strong> {order.address.recipientName}</p>
                    <p><strong>SĐT:</strong> {order.address.phone}</p>
                    <p><strong>Địa chỉ:</strong> {`${order.address.detailedAddress}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`}</p>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold border-b border-black pb-1 mb-2">
                        <span>SL | Tên món</span>
                        <span>Tiền</span>
                    </div>
                    <div className="space-y-3">
                        {order.orderItems.map((item, idx) => (
                            <div key={idx} className="text-[11px]">
                                <div className="flex justify-between items-start">
                                    <span className="flex-1 font-bold leading-tight">
                                        {item.quantity} | {item.product?.productName || item.productId}
                                    </span>
                                    <span className="ml-2">{(item.amount).toLocaleString()}</span>
                                </div>
                                {(item.productSizeName || item.selectedToppings?.length) ? (
                                    <div className="pl-6 text-[10px] text-gray-700 italic">
                                        {item.productSizeName && <span>Size: {item.productSizeName} </span>}
                                        {item.selectedToppings?.map(t => t.productName).join(', ')}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                    <div className="border-t-2 border-black border-dashed mt-4 pt-4 space-y-1 text-[11px]">
                        <div className="flex justify-between"><span>Tạm tính:</span><span>{order.totalAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Phí ship:</span><span>{(order.shippingFee || 0).toLocaleString()}</span></div>
                        
                        {order.notesUsed > 0 && (
                            <div className="flex justify-between font-bold">
                                <span>Giảm Nốt nhạc ({order.notesUsed}):</span>
                                <span>-{(order.notesUsed * 1000).toLocaleString()}</span>
                            </div>
                        )}

                        {(order.totalDiscount - (order.notesUsed * 1000)) > 0 && (
                            <div className="flex justify-between">
                                <span>Giảm giá KM:</span>
                                <span>-{(order.totalDiscount - (order.notesUsed * 1000)).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-black border-t border-black mt-2 pt-2">
                            <span>TỔNG CỘNG:</span>
                            <span>{order.finalAmount.toLocaleString()} đ</span>
                        </div>
                    </div>
                </div>

                {/* Payment & QR */}
                <div className="mt-8 text-center">
                    <p className="text-[11px] mb-2 uppercase font-bold">
                        Trạng thái: {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Đã chuyển khoản'}
                    </p>
                    
                    {order.paymentMethod === 'COD' && order.paymentStatus !== 'COMPLETED' && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-400">
                           <img 
                                src={`https://img.vietqr.io/image/970422-5555501082005-compact2.png?amount=${order.finalAmount}&addInfo=${getPaymentDescription(order.orderCode)}&accountName=HOANG%20QUANG%20DAT`}
                                alt="QR SePay"
                                className="w-48 h-48 mx-auto"
                            />
                            <p className="text-[10px] mt-2 font-bold">Quét mã VietQR để thanh toán</p>
                            <p className="text-[9px] text-gray-600">Nội dung: {getPaymentDescription(order.orderCode)}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-10 pt-4 border-t-2 border-black text-center text-[10px] space-y-1 italic">
                    <p>Wifi: Phê La - Pass: phelaphela</p>
                    <p className="font-bold uppercase mt-2">Cảm ơn quý khách và hẹn gặp lại!</p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; }
                    #printable-bill, #printable-bill * { visibility: visible; }
                    #printable-bill {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        padding: 0;
                        margin: 0;
                        display: block !important;
                    }
                    @page { margin: 0; }
                }
            `}} />

        </div>
    );
};

export default OrderDetailReport;