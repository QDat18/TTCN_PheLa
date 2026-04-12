import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HeadOrder from '~/components/customer/HeadOrder';
import api from '~/config/axios';
import { useAuth } from '~/AuthContext';
import SePayQRModal from '~/components/customer/SePayQRModal';
import { FiMapPin, FiBox, FiCheckCircle, FiDollarSign, FiCreditCard, FiFileText, FiTag, FiX, FiInfo, FiChevronRight, FiClock } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import { checkVoucher } from '~/services/voucherService';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  productId: string;
  productName: string;
  originalPrice: number;
}

interface CartItem {
  productId: string;
  productSizeId?: string;
  productSizeName?: string;
  quantity: number;
  amount: number;
  note: string;
  product?: Product;
}

interface Address {
  addressId: string;
  recipientName: string;
  phone: string;
  detailedAddress: string;
  ward: string;
  district: string;
  city: string;
}

interface Cart {
  cartId: string;
  branch: {
    branchCode: string;
    branchName: string;
  };
  address: Address;
  cartItems: CartItem[];
  totalAmount: number;
  shippingFee: number;
  finalAmount: number;
}

const Payment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER' | 'SEPAY'>('COD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSePayModalOpen, setIsSePayModalOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<{ orderId: string, orderCode: string, finalAmount: number } | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [customerNotes, setCustomerNotes] = useState<number>(0);
  const [useNotes, setUseNotes] = useState(false);
  const [notesToRedeem, setNotesToRedeem] = useState(0);

  const fetchCustomerNotes = useCallback(async () => {
    if (user && user.username) {
      try {
        const response = await api.get(`/api/customer/${user.username}`);
        setCustomerNotes(response.data.currentNotes || 0);
      } catch (err) {
        console.error("Error fetching customer notes:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerNotes();
  }, [fetchCustomerNotes]);

  const handleToggleNotes = (checked: boolean) => {
    setUseNotes(checked);
    if (checked) {
      const currentFinal = (cart?.totalAmount || 0) + (cart?.shippingFee || 0) - discountAmount;
      const maxNotesPossible = Math.floor(currentFinal / 1000);
      const actualNotesToUse = Math.min(customerNotes, maxNotesPossible);
      setNotesToRedeem(actualNotesToUse);
    } else {
      setNotesToRedeem(0);
    }
  };

  const getBankTransferFallbackUrl = () => {
    const paymentMethodPath = encodeURIComponent('BANK_TRANSFER');
    return `/cart?retryPaymentMethod=${paymentMethodPath}`;
  };

  const fetchProductDetails = async (productId: string): Promise<Product> => {
    try {
      const response = await api.get(`/api/product/get/${productId}`);
      return response.data;
    } catch (err) {
      return { productId, productName: 'Sản phẩm không thể tải', originalPrice: 0 };
    }
  };

  const fetchCartDetails = useCallback(async () => {
    if (user && user.type === 'customer' && user.customerId) {
      try {
        const response = await api.get(`/api/customer/cart/getCustomer/${user.customerId}`);
        let cartData = response.data;

        if (!cartData.address) {
          setError("Vui lòng chọn địa chỉ giao hàng trong giỏ hàng trước.");
          return;
        }
        if (cartData.cartItems.length === 0) {
          setError("Giỏ hàng của bạn đang trống.");
          navigate('/cart');
          return;
        }

        const itemsWithProducts = await Promise.all(
          cartData.cartItems.map(async (item: CartItem) => {
            const product = await fetchProductDetails(item.productId);
            return { ...item, product };
          })
        );
        cartData.cartItems = itemsWithProducts;

        setCart(cartData);
      } catch (err) {
        setError("Không thể tải thông tin giỏ hàng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchCartDetails();
  }, [fetchCartDetails]);

  const calculateDiscount = (voucher: any, totalAmount: number, shippingFee: number) => {
    let discount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discount = totalAmount * (voucher.value / 100);
      if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
        discount = voucher.maxDiscountAmount;
      }
    } else if (voucher.type === 'FIXED_AMOUNT') {
      discount = voucher.value;
    } else if (voucher.type === 'SHIPPING') {
      discount = Math.min(shippingFee, voucher.value);
    }
    return discount;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      toast.warning("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      const response = await checkVoucher(voucherCodeInput);
      if (response.success) {
        const voucher = response.data;
        console.log("Applied Voucher Data:", voucher);
        
        // Frontend validation
        if (cart && cart.totalAmount < voucher.minOrderAmount) {
          toast.error(`Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString()}₫ để sử dụng mã này`);
          return;
        }

        const discount = calculateDiscount(voucher, cart!.totalAmount, cart!.shippingFee);

        setAppliedVoucher(voucher);
        setDiscountAmount(discount);

        // Adjust points if they exceed the new total
        if (useNotes) {
          const newFinal = (cart?.totalAmount || 0) + (cart?.shippingFee || 0) - discount;
          const maxNotesPossible = Math.floor(newFinal / 1000);
          if (notesToRedeem > maxNotesPossible) {
            setNotesToRedeem(Math.min(customerNotes, maxNotesPossible));
          }
        }

        toast.success("Áp dụng mã giảm giá thành công!");
      } else {
        toast.error(response.message || "Mã giảm giá không hợp lệ");
        setAppliedVoucher(null);
        setDiscountAmount(0);
      }
    } catch (err) {
      toast.error("Lỗi khi kiểm tra mã giảm giá");
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCodeInput('');
    toast.info("Đã gỡ mã giảm giá");
  };

  const fetchActiveVouchers = async () => {
    setIsLoadingVouchers(true);
    try {
      const response = await api.get('/api/vouchers/active');
      if (response.data.success) {
        setAvailableVouchers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const handleSelectVoucher = (voucher: any) => {
    if (cart && voucher.minOrderAmount > cart.totalAmount) {
      toast.error(`Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString()} ₫ để sử dụng mã này`);
      return;
    }
    setVoucherCodeInput(voucher.code);
    setIsVoucherModalOpen(false);
    // Auto apply logic
    const fetchAndApply = async () => {
      try {
        const response = await checkVoucher(voucher.code);
        if (response.success) {
          console.log("Selected Voucher Data:", response.data);
          const discount = calculateDiscount(response.data, cart!.totalAmount, cart!.shippingFee);
          setAppliedVoucher(response.data);
          setDiscountAmount(discount);

          // Adjust points if they exceed the new total
          if (useNotes) {
            const newFinal = (cart?.totalAmount || 0) + (cart?.shippingFee || 0) - discount;
            const maxNotesPossible = Math.floor(newFinal / 1000);
            if (notesToRedeem > maxNotesPossible) {
              setNotesToRedeem(Math.min(customerNotes, maxNotesPossible));
            }
          }

          toast.success("Áp dụng mã giảm giá thành công!");
        }
      } catch (err) {
        toast.error("Lỗi khi áp dụng mã giảm giá");
      }
    };
    fetchAndApply();
  };


  const handleCreateOrder = async () => {
    if (!cart || !user) return;
    setIsProcessing(true);

    try {
      const customerUser = user as import('~/AuthContext').CustomerUser;
      const pointsDiscount = useNotes ? notesToRedeem * 1000 : 0;
      
      const orderPayload = {
        customerId: customerUser.customerId,
        cartId: cart.cartId,
        addressId: cart.address.addressId,
        branchCode: cart.branch.branchCode,
        paymentMethod: paymentMethod,
        totalAmount: cart.totalAmount,
        shippingFee: cart.shippingFee,
        discountAmount: discountAmount + pointsDiscount,
        notesUsed: useNotes ? notesToRedeem : 0,
        voucherCode: appliedVoucher?.code || null,
        finalAmount: cart.totalAmount + cart.shippingFee - discountAmount - pointsDiscount
      };

      const response = await api.post('/api/order/create', orderPayload);
      const newOrder = response.data;

      if (paymentMethod === 'COD') {
        setOrderId(newOrder.orderId);
        setShowSuccessModal(true);
      } else if (paymentMethod === 'SEPAY') {
        setCurrentOrder({
          orderId: newOrder.orderId,
          orderCode: newOrder.orderCode,
          finalAmount: newOrder.finalAmount || newOrder.totalAmount || 0
        });
        setIsSePayModalOpen(true);
        setIsProcessing(false);
      } else if (paymentMethod === 'BANK_TRANSFER') {
        const paymentPayload = { amount: newOrder.finalAmount, orderInfo: newOrder.orderCode };
        const paymentUrlResponse = await api.post('/api/payment/create-payment', paymentPayload);
        if (paymentUrlResponse.data.url) {
          window.location.href = paymentUrlResponse.data.url;
        } else {
          throw new Error("Không thể tạo URL thanh toán.");
        }
      }
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi khi tạo đơn hàng";
      if (err.code === 'ECONNABORTED') errorMessage = "Yêu cầu bị timeout. Vui lòng thử lại.";
      else if (err.response?.status === 400) errorMessage = err.response?.data?.message || "Dữ liệu không hợp lệ";
      alert(errorMessage);
      setIsProcessing(false);
      if (paymentMethod === 'BANK_TRANSFER') navigate(getBankTransferFallbackUrl());
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FCF8F1] flex justify-center items-center font-black text-[#8C5A35] uppercase tracking-widest text-sm">Đang tải thông tin...</div>;
  if (error) return <div className="min-h-screen bg-[#FCF8F1] flex flex-col items-center justify-center"><div className="text-center p-8 bg-white border border-[#E5D5C5] shadow-lg max-w-md"><p className="text-red-500 font-bold mb-4">{error}</p><button onClick={() => navigate('/cart')} className="px-6 py-3 bg-[#2C1E16] text-white font-black text-xs uppercase tracking-widest">Quay lại giỏ hàng</button></div></div>;
  if (!cart) return null;

  return (
    <div className="min-h-screen bg-[#FCF8F1] pb-24 font-sans">
      <div className="fixed top-0 left-0 w-full bg-[#FCF8F1] border-b border-[#E5D5C5] shadow-sm z-50">
        <HeadOrder />
      </div>

      <div className="bg-[#2C1E16] pt-32 pb-24 border-b-4 border-[#8C5A35]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-[#FCF8F1] uppercase tracking-tighter italic drop-shadow-lg">
            Xác Nhận Đơn Hàng
          </h1>
          <div className="h-1 w-16 bg-[#8C5A35] mx-auto mt-4"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-7 space-y-6">

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl shadow-[#2C1E16]/5 border border-[#E5D5C5] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8C5A35]"></div>
              <h2 className="text-base font-black mb-6 flex items-center gap-3 uppercase tracking-widest text-[#2C1E16]">
                <FiMapPin className="text-[#8C5A35] text-xl" /> Thông tin giao hàng
              </h2>

              <div className="bg-[#FCF8F1] p-5 rounded-lg border border-[#E5D5C5]/60 space-y-3">
                <p className="flex justify-between items-center border-b border-[#E5D5C5] pb-3">
                  <span className="text-xs font-bold text-[#5C4D43] uppercase tracking-widest">Người nhận</span>
                  <span className="font-black text-[#2C1E16]">{cart.address.recipientName}</span>
                </p>
                <p className="flex justify-between items-center border-b border-[#E5D5C5] pb-3">
                  <span className="text-xs font-bold text-[#5C4D43] uppercase tracking-widest">Điện thoại</span>
                  <span className="font-black text-[#2C1E16]">{cart.address.phone}</span>
                </p>
                <div className="pt-2 pb-2">
                  <span className="text-xs font-bold text-[#5C4D43] uppercase tracking-widest block mb-2">Giao đến</span>
                  <p className="text-[#2C1E16] font-medium text-sm leading-relaxed">{`${cart.address.detailedAddress}, ${cart.address.ward}, ${cart.address.district}, ${cart.address.city}`}</p>
                </div>
              </div>
              <p className="mt-4 text-right text-xs font-bold text-[#5C4D43]">
                Xử lý bởi: <span className="text-[#8C5A35] ml-1 uppercase tracking-wider">{cart.branch.branchName}</span>
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl shadow-[#2C1E16]/5 border border-[#E5D5C5] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2C1E16]"></div>
              <h2 className="text-base font-black mb-6 flex items-center gap-3 uppercase tracking-widest text-[#2C1E16]">
                <FiBox className="text-[#2C1E16] text-xl" /> Món đã chọn
              </h2>

              <div className="space-y-4">
                {cart.cartItems.map((item, index) => (
                  <div key={item.productId} className="flex justify-between items-center py-4 border-b border-dashed border-[#E5D5C5] last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-[#FCF8F1] border border-[#E5D5C5] flex items-center justify-center font-black text-[#8C5A35] text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-black text-[#2C1E16] uppercase tracking-wide text-sm">
                          {item.product?.productName || 'Sản phẩm'}
                          <span className="ml-2 text-[10px] text-[#2C1E16] bg-[#E5D5C5]/50 px-2 py-0.5 rounded font-black">x{item.quantity}</span>
                        </p>
                        {item.productSizeName && <p className="text-[10px] text-[#5C4D43] font-bold uppercase tracking-widest mt-1">Size {item.productSizeName}</p>}
                        {item.note && <p className="text-[11px] text-[#8C5A35] mt-1 font-medium italic">Ghi chú: {item.note}</p>}
                      </div>
                    </div>
                    <span className="font-black text-[#2C1E16] text-sm">{item.amount.toLocaleString()}₫</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-2xl shadow-[#2C1E16]/10 border border-[#E5D5C5] relative sticky top-28">
              <div className="absolute -top-3 left-0 w-full h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiIGZpbGw9IiNmY2Y4ZjEiLz48L3N2Zz4=')] bg-repeat-x"></div>

              <div className="p-6 md:p-8">
                <h2 className="text-base font-black mb-6 flex items-center justify-center gap-2 uppercase tracking-widest text-[#2C1E16] border-b-2 border-double border-[#E5D5C5] pb-4">
                  <FiFileText className="text-[#8C5A35]" /> Hóa Đơn Tạm Tính
                </h2>

                <div className="space-y-4 text-xs font-bold text-[#5C4D43] uppercase tracking-widest mb-8">
                  <div className="bg-[#2C1E16] text-[#FCF8F1] p-4 rounded-xl border-l-4 border-[#8C5A35] mb-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-[-10px] right-[-10px] opacity-10 rotate-12">
                      <FiTag size={60} />
                    </div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                         <span className="w-2 h-2 bg-[#8C5A35] rounded-full animate-pulse"></span>
                         Nốt nhạc Phê La
                       </span>
                       <span className="text-xs font-black text-[#8C5A35]">{customerNotes.toLocaleString()} ♫</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[9px] font-medium opacity-80 max-w-[180px]">Dùng nốt nhạc để giảm giá trực tiếp (1 nốt = 1.000₫)</p>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="sr-only peer" 
                           checked={useNotes}
                           disabled={customerNotes === 0}
                           onChange={(e) => handleToggleNotes(e.target.checked)}
                         />
                         <div className="w-9 h-5 bg-[#FCF8F1]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8C5A35]"></div>
                       </label>
                    </div>
                    {useNotes && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 pt-3 border-t border-[#FCF8F1]/10 flex justify-between items-center"
                      >
                         <span className="text-[9px] font-black uppercase text-[#8C5A35]">Đang dùng: {notesToRedeem} nốt</span>
                         <span className="text-[10px] font-black">-{(notesToRedeem * 1000).toLocaleString()} ₫</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex justify-between"><span>Tiền hàng:</span> <span className="text-[#2C1E16]">{cart.totalAmount.toLocaleString()} ₫</span></div>
                  <div className="flex justify-between"><span>Phí vận chuyển:</span> <span className="text-[#2C1E16]">{cart.shippingFee.toLocaleString()} ₫</span></div>
                  
                  {appliedVoucher && (
                    <div className="flex justify-between text-green-600 mt-2">
                      <span className="flex items-center gap-1"><FiTag /> Giảm giá ({appliedVoucher.code}):</span>
                      <span>-{discountAmount.toLocaleString()} ₫</span>
                    </div>
                  )}

                  {useNotes && (
                    <div className="flex justify-between text-[#8C5A35] mt-2">
                      <span className="flex items-center gap-1">♫ Giảm giá nốt nhạc:</span>
                      <span>-{(notesToRedeem * 1000).toLocaleString()} ₫</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-dashed border-[#E5D5C5] mt-4">
                    {!appliedVoucher ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="MÃ GIẢM GIÁ"
                          value={voucherCodeInput}
                          onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-[#FCF8F1] border border-[#E5D5C5] px-3 py-2 rounded font-black text-[10px] focus:outline-none focus:border-[#8C5A35]"
                        />
                        <button
                          id="apply-voucher-btn"
                          onClick={handleApplyVoucher}
                          className="bg-[#2C1E16] text-[#FCF8F1] px-4 py-2 rounded font-black text-[10px] hover:bg-[#8C5A35] transition-colors"
                        >
                          ÁP DỤNG
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-[10px] text-green-700 font-black uppercase">Đã áp dụng: {appliedVoucher.code}</span>
                        <button onClick={removeVoucher} className="text-red-500 text-[10px] font-black underline">GỠ BỎ</button>
                      </div>
                    )}
                    
                    {!appliedVoucher && (
                      <button 
                        onClick={() => {
                          setIsVoucherModalOpen(true);
                          fetchActiveVouchers();
                        }}
                        className="mt-3 text-[10px] font-black text-[#8C5A35] flex items-center gap-1 hover:underline uppercase tracking-widest"
                      >
                        <FiTag size={12} />
                        Hoặc chọn mã có sẵn
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-end pt-6 border-t border-[#E5D5C5] mt-6">
                    <span className="text-sm text-[#2C1E16] font-black">Thành tiền:</span>
                    <span className="text-3xl font-black text-[#8C5A35] tracking-tighter normal-case">{(cart.totalAmount + cart.shippingFee - discountAmount).toLocaleString()}₫</span>
                  </div>
                </div>

                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5C4D43] mb-4 bg-[#FCF8F1] p-2 text-center rounded border border-[#E5D5C5]">Phương thức thanh toán</h3>

                <div className="space-y-3 mb-8">
                  <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-[#8C5A35] bg-[#FDF5E6]' : 'border-[#E5D5C5] hover:border-[#8C5A35]/40'}`}>
                    <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="mt-1 h-4 w-4 text-[#8C5A35] focus:ring-[#8C5A35] accent-[#8C5A35]" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-[#8C5A35]" />
                        <span className="font-black text-[#2C1E16] text-xs uppercase tracking-widest block">Tiền mặt (COD)</span>
                      </div>
                      <span className="text-[10px] text-[#5C4D43] font-medium mt-1 block">Thanh toán cho shipper khi nhận</span>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'SEPAY' ? 'border-[#8C5A35] bg-[#FDF5E6]' : 'border-[#E5D5C5] hover:border-[#8C5A35]/40'}`}>
                    <input type="radio" name="paymentMethod" value="SEPAY" checked={paymentMethod === 'SEPAY'} onChange={() => setPaymentMethod('SEPAY')} className="mt-1 h-4 w-4 text-[#8C5A35] focus:ring-[#8C5A35] accent-[#8C5A35]" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiCreditCard className="text-[#8C5A35]" />
                          <span className="font-black text-[#2C1E16] text-xs uppercase tracking-widest block">Chuyển khoản</span>
                        </div>
                        <span className="text-[9px] bg-[#8C5A35] text-white px-2 py-0.5 rounded font-black animate-pulse">Tự động</span>
                      </div>
                      <span className="text-[10px] text-[#5C4D43] font-medium mt-1 block">Quét QR - Chốt đơn ngay trong 3s</span>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={isProcessing}
                  className="w-full py-4 bg-[#2C1E16] hover:bg-[#8C5A35] text-white font-black text-[12px] rounded-lg shadow-lg shadow-[#2C1E16]/20 transition-all transform active:scale-[0.98] disabled:bg-[#E5D5C5] disabled:shadow-none uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> XỬ LÝ...</>
                  ) : <><FiCheckCircle className="text-lg" /> XÁC NHẬN ĐẶT HÀNG</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {currentOrder && (
          <SePayQRModal
            isOpen={isSePayModalOpen}
            onClose={() => {
              setIsSePayModalOpen(false);
              navigate('/my-orders');
            }}
            orderId={currentOrder.orderId}
            orderCode={currentOrder.orderCode}
            amount={currentOrder.finalAmount}
            onSuccess={() => {
              setIsSePayModalOpen(false);
              setOrderId(currentOrder.orderId);
              setShowSuccessModal(true);
            }}
          />
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 bg-[#2C1E16]/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-[#FCF8F1] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-[#8C5A35]">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 border-4 border-green-500 mb-6">
                  <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#2C1E16] mb-3 uppercase tracking-tighter italic">Đặt hàng thành công!</h3>
                <p className="text-[#5C4D43] mb-8 text-sm font-medium leading-relaxed border-t border-dashed border-[#E5D5C5] pt-6">
                  Hương vị nguyên bản đang được Phê La chuẩn bị. Cảm ơn bạn đã lựa chọn chúng tôi!
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/my-orders')}
                    className="flex-1 px-4 py-3 bg-white border border-[#E5D5C5] text-[#2C1E16] rounded-lg hover:bg-[#E5D5C5] transition-colors font-black text-[10px] uppercase tracking-widest"
                  >
                    Xem đơn hàng
                  </button>
                  <button
                    onClick={() => navigate(`/my-orders/${orderId || currentOrder?.orderId}`)}
                    className="flex-1 px-4 py-3 bg-[#8C5A35] text-white rounded-lg hover:bg-[#2C1E16] transition-colors font-black text-[10px] uppercase tracking-widest shadow-md"
                  >
                    Chi tiết đơn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" theme="light" />
      {/* Voucher Selection Modal */}
      <AnimatePresence>
        {isVoucherModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVoucherModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#FCF8F1] rounded-3xl overflow-hidden shadow-2xl border border-[#E5D5C5]"
            >
              <div className="p-6 border-b border-[#E5D5C5] flex justify-between items-center bg-white">
                <h3 className="text-sm font-black text-[#2C1E16] uppercase tracking-widest">Ưu đãi dành cho bạn</h3>
                <button onClick={() => setIsVoucherModalOpen(false)} className="text-[#2C1E16] hover:text-red-500 transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {isLoadingVouchers ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-[#8C5A35]/20 border-t-[#8C5A35] rounded-full animate-spin"></div>
                  </div>
                ) : availableVouchers.length > 0 ? (
                  availableVouchers.map((v) => (
                    <div 
                      key={v.id}
                      className={`group relative bg-white border rounded-2xl p-4 flex gap-4 cursor-pointer transition-all ${
                        cart && v.minOrderAmount > cart.totalAmount 
                          ? 'opacity-60 grayscale' 
                          : 'hover:border-[#8C5A35] hover:shadow-md'
                      } ${v.minOrderAmount <= (cart?.totalAmount || 0) ? 'border-[#E5D5C5]' : 'border-gray-200 bg-gray-50'}`}
                      onClick={() => handleSelectVoucher(v)}
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#FDF5E6] flex items-center justify-center flex-shrink-0">
                        <FiTag className="text-[#8C5A35]" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-black text-[#2C1E16] uppercase tracking-widest">{v.code}</span>
                          {v.type === 'PERCENTAGE' && <span className="text-[10px] font-black text-white bg-[#8C5A35] px-2 py-0.5 rounded-full">-{v.value}%</span>}
                        </div>
                        <p className="text-[11px] font-black text-[#2C1E16] mt-1 line-clamp-1 uppercase">{v.name}</p>
                        <p className="text-[10px] text-[#5C4D43] font-medium mt-1 line-clamp-1">{v.description}</p>
                        
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-[9px] font-bold text-[#8C5A35] uppercase flex items-center gap-1">
                            <FiClock size={10} />
                            Hết hạn: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                          </span>
                          {v.minOrderAmount > 0 && (
                            <span className="text-[9px] font-bold text-[#5C4D43] uppercase flex items-center gap-1">
                              <FiInfo size={10} />
                              Từ {v.minOrderAmount.toLocaleString()} ₫
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FiChevronRight className="text-[#E5D5C5] group-hover:text-[#8C5A35] transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xs font-bold text-[#5C4D43] uppercase tracking-widest opacity-40">Không tìm thấy mã ưu đãi nào</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-[#FDF5E6] border-t border-[#E5D5C5] text-center">
                <button 
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="text-[10px] font-black text-[#2C1E16] uppercase tracking-widest hover:underline"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payment;