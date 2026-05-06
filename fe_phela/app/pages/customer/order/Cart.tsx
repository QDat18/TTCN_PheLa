import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeadOrder from '~/components/customer/HeadOrder';
import api from '~/config/axios';
import { useAuth } from '~/AuthContext';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMapPin, FiHome, FiChevronRight, FiShoppingBag, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';

interface Product {
  productId: string;
  productName: string;
  imageUrl: string;
  originalPrice: number;
}

interface CartItem {
  cartItemId: string;
  productId: string;
  productSizeId?: string;
  productSizeName?: string;
  quantity: number;
  amount: number;
  note: string;
  product?: Product;
  selectedToppings?: Product[];
}

interface Address {
  addressId: string;
  city: string;
  district: string;
  ward: string;
  recipientName: string;
  phone: string;
  detailedAddress: string;
  isDefault: boolean;
}

interface Branch {
  branchCode: string;
  branchName: string;
  city: string;
  district: string;
  address: string;
}

const Cart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [distance, setDistance] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const cartIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProductDetails = async (productId: string): Promise<Product> => {
    try {
      const response = await api.get(`/api/product/get/${productId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching product ${productId}:`, err);
      return {
        productId,
        productName: 'Sản phẩm không xác định',
        imageUrl: 'https://placehold.co/100x100?text=Chua+co+anh',
        originalPrice: 0,
      };
    }
  };

  const fetchAllProducts = async (items: CartItem[]): Promise<CartItem[]> => {
    return Promise.all(
      items.map(async (item) => {
        const product = await fetchProductDetails(item.productId);
        return { ...item, product };
      }),
    );
  };

  const updateFullCartState = useCallback(async (customerId: string) => {
    try {
      const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
      const cartData = cartResponse.data;
      
      if (cartData.cartId) {
        cartIdRef.current = cartData.cartId;
      }

      const itemsWithProducts = await fetchAllProducts(cartData.cartItems || []);

      setCartItems(itemsWithProducts);
      setTotalAmount(cartData.totalAmount || 0);
      setShippingFee(cartData.shippingFee || 0);
      setFinalAmount(cartData.finalAmount || 0);
      setDistance(cartData.distance || 0);

      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error("Error updating full cart state:", err);
      setError("Không thể cập nhật thông tin giỏ hàng.");
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (user && user.type === 'customer' && user.customerId) {
        setLoading(true);
        try {
          const customerId = user.customerId;
          let cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
          let cartData = cartResponse.data;

          if (!cartData || !cartData.cartId) {
            cartResponse = await api.post(`/api/customer/cart/create/${customerId}`);
            cartData = cartResponse.data;
          }

          await updateFullCartState(customerId);

          const [branchResponse, addressResponse] = await Promise.all([
            api.get('/api/branch'),
            api.get(`/api/address/customer/${customerId}`),
          ]);

          setBranches(branchResponse.data);
          setSelectedBranch(cartData.branch?.branchCode || '');

          setAddresses(addressResponse.data);
          const defaultAddress = addressResponse.data.find((addr: Address) => addr.isDefault) || addressResponse.data[0] || null;
          setSelectedAddress(defaultAddress);

        } catch (err) {
          console.error('Error fetching initial cart details:', err);
          setError('Không thể tải thông tin giỏ hàng. Vui lòng thử lại sau.');
        } finally {
          setLoading(false);
        }
      } else {
        // Guest mode basic handling to prevent infinite loading
        try {
          const guestCartStr = localStorage.getItem('guestCart');
          if (guestCartStr) {
              const parsed = JSON.parse(guestCartStr);
              const itemsWithProducts = await fetchAllProducts(parsed);
              setCartItems(itemsWithProducts);
              const tAmount = itemsWithProducts.reduce((acc, item) => acc + ((item.product?.originalPrice || 0) * item.quantity), 0);
              setTotalAmount(tAmount);
              setFinalAmount(tAmount);
          }
          const branchResponse = await api.get('/api/branch');
          setBranches(branchResponse.data);
        } catch(e) {}
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, updateFullCartState]);


  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    // 1. Optimistic UI Update
    setCartItems(prevItems => {
        const updatedItems = prevItems.map(item => {
            if (item.cartItemId === cartItemId) {
                const unitPrice = item.amount / item.quantity;
                return { 
                    ...item, 
                    quantity: newQuantity,
                    amount: unitPrice * newQuantity 
                };
            }
            return item;
        });
        
        // Recalculate totals immediately
        const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
        setTotalAmount(newTotal);
        setFinalAmount(newTotal + shippingFee);
        
        return updatedItems;
    });

    if (!user || user.type !== 'customer') return;

    // 2. Debounced API Call
    if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
        try {
            const customerId = user.customerId;
            let cartId = cartIdRef.current;
            
            if (!cartId) {
                const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
                cartId = cartResponse.data.cartId;
                cartIdRef.current = cartId;
            }

            const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);
            if (!itemToUpdate) return;

            if (newQuantity === 0) {
                await removeItem(cartItemId);
                return;
            }

            await api.post(`/api/customer/cart/${cartId}/items`, {
                productId: itemToUpdate.productId,
                productSizeId: itemToUpdate.productSizeId,
                toppingIds: itemToUpdate.selectedToppings?.map(t => t.productId) || [],
                quantity: newQuantity,
            });

            // Final sync to ensure everything is perfect
            await updateFullCartState(customerId);

        } catch (err: any) {
            toast.error(`Lỗi đồng bộ: ${err.response?.data?.message || err.message}`);
            if (user?.customerId) updateFullCartState(user.customerId);
        }
    }, 500); 
  };

  const updateBranch = async (branchCode: string) => {
    if (!branchCode) {
      setSelectedBranch('');
      return;
    }
    if (!user || user.type !== 'customer') return;
    try {
      const customerId = user.customerId;
      const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
      const cartId = cartResponse.data.cartId;

      await api.patch(`/api/customer/cart/${cartId}/update-branch?branchCode=${branchCode}`);
      setSelectedBranch(branchCode);
      await updateFullCartState(customerId);
    } catch (err: any) {
      toast.error(`Có lỗi: ${err.response?.data?.message || err.message}`);
    }
  };

  const updateAddress = async (addressId: string) => {
    if (!addressId) {
      setSelectedAddress(null);
      return;
    }
    if (!user || user.type !== 'customer') return;
    try {
      const customerId = user.customerId;
      const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
      const cartId = cartResponse.data.cartId;

      await api.patch(`/api/customer/cart/${cartId}/update-address?addressId=${addressId}`);
      setSelectedAddress(addresses.find(addr => addr.addressId === addressId) || null);
      await updateFullCartState(customerId);

    } catch (err: any) {
      toast.error(`Có lỗi: ${err.response?.data?.message || err.message}`);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!user || user.type !== 'customer') return;
    try {
      const customerId = user.customerId;
      const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
      const cartId = cartResponse.data.cartId;

      const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId);
      if (!itemToRemove) return;

      await api.delete(`/api/customer/cart/${cartId}/items/${itemToRemove.cartItemId}`);
      await updateFullCartState(customerId);

    } catch (err: any) {
      toast.error(`Có lỗi khi xóa: ${err.response?.data?.message || err.message}`);
    }
  };

  const updateNote = async (cartItemId: string, type: 'đường' | 'đá', value: string) => {
    if (!user || user.type !== 'customer') return;

    try {
      const customerId = user.customerId;
      const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
      const cartId = cartResponse.data.cartId;

      const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);
      if (!itemToUpdate) return;

      let sugarLevel = '100% đường';
      let iceLevel = '100% đá';

      if (itemToUpdate.note) {
        const parts = itemToUpdate.note.split(', ');
        parts.forEach(part => {
          if (part.includes('đường')) sugarLevel = part;
          if (part.includes('đá')) iceLevel = part;
        });
      }

      if (type === 'đường') {
        sugarLevel = `${value}% đường`;
      } else {
        iceLevel = `${value}% đá`;
      }

      const newNote = `${sugarLevel}, ${iceLevel}`;

      await api.post(`/api/customer/cart/${cartId}/items`, {
        productId: itemToUpdate.productId,
        productSizeId: itemToUpdate.productSizeId,
        toppingIds: itemToUpdate.selectedToppings?.map(t => t.productId) || [],
        quantity: itemToUpdate.quantity,
        note: newNote
      });

      await updateFullCartState(customerId);
    } catch (err: any) {
      toast.error(`Có lỗi khi cập nhật: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF8F1] pb-24 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360, borderTopColor: ["#8C5A35", "#C2956E", "#8C5A35"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#E5D5C5] border-t-[#8C5A35] rounded-full mb-4"
        />
        <p className="text-[#8C5A35] font-black uppercase tracking-widest text-sm">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FCF8F1] pb-24 flex flex-col items-center justify-center">
        <div className="bg-white text-red-500 p-8 rounded-[2rem] max-w-md text-center border border-[#E5D5C5] shadow-sm">
          <FiInfo className="text-4xl mx-auto mb-4" />
          <p className="font-bold text-lg mb-2 text-[#2C1E16]">Đã xảy ra lỗi</p>
          <p className="text-[#5C4D43] text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#2C1E16] hover:bg-[#8C5A35] text-white rounded-full transition-colors font-black text-xs uppercase tracking-widest">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F1] pb-24 text-[#2C1E16]">
      <div className="fixed top-0 left-0 w-full bg-[#FCF8F1] shadow-sm z-50 border-b border-[#E5D5C5]">
        <HeadOrder />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-[2rem] shadow-sm border border-[#E5D5C5] max-w-2xl mx-auto"
          >
            <div className="w-32 h-32 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="text-5xl text-[#8C5A35]/50" />
            </div>
            <h2 className="text-2xl font-black text-[#2C1E16] mb-2 uppercase tracking-tight">Giỏ hàng của bạn đang trống</h2>
            <p className="text-[#5C4D43] mb-8 max-w-xs mx-auto">Hãy khám phá thêm các món nước đặc biệt từ Phê La nhé!</p>
            <Link to="/san-pham" className="px-10 py-4 bg-[#2C1E16] text-white rounded-full font-black hover:bg-[#8C5A35] transition-all hover:shadow-lg hover:shadow-[#8C5A35]/20 hover:-translate-y-1 inline-block uppercase tracking-widest text-xs">
              Tiếp tục mua sắm
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">

            <div className="lg:w-2/3 space-y-6">
              <h1 className="text-3xl font-black text-[#2C1E16] tracking-tight flex items-center gap-3 mb-2 uppercase">
                <FiShoppingBag className="text-[#8C5A35]" /> Giỏ Hàng
              </h1>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#E5D5C5]">
                <h2 className="text-lg font-black text-[#2C1E16] mb-6 pb-4 border-b border-[#E5D5C5] flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1.5 h-5 bg-[#8C5A35] rounded-full"></span>
                  Giao hàng đến đâu?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-[#5C4D43] uppercase tracking-widest">
                      <FiHome className="text-[#8C5A35]" /> Cửa hàng Phê La
                    </label>
                    <div className="relative group">
                      <select
                        value={selectedBranch}
                        onChange={(e) => updateBranch(e.target.value)}
                        className="w-full pl-4 pr-10 py-3.5 bg-[#FCF8F1] border border-[#E5D5C5] rounded-xl focus:ring-2 focus:ring-[#8C5A35]/30 focus:border-[#8C5A35] outline-none text-sm font-bold text-[#2C1E16] appearance-none cursor-pointer hover:border-[#8C5A35]/50 transition-all"
                      >
                        <option value="">-- Chọn cửa hàng --</option>
                        {branches.map((branch) => (
                          <option key={branch.branchCode} value={branch.branchCode}>
                            {branch.branchName} ({branch.district})
                          </option>
                        ))}
                      </select>
                      <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#5C4D43] pointer-events-none group-hover:text-[#8C5A35]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-xs font-black text-[#8C5A35] uppercase tracking-widest">
                        <FiMapPin /> Địa chỉ nhận hàng
                      </label>
                      <Link to="/my-address" className="text-[10px] font-black text-[#5C4D43] hover:text-[#8C5A35] underline uppercase tracking-widest">Chỉnh sửa</Link>
                    </div>
                    <div className="relative group">
                      {addresses.length > 0 ? (
                        <select
                          value={selectedAddress?.addressId || ''}
                          onChange={(e) => updateAddress(e.target.value)}
                          className="w-full pl-4 pr-10 py-3.5 bg-[#FCF8F1] border border-[#E5D5C5] rounded-xl focus:ring-2 focus:ring-[#8C5A35]/30 focus:border-[#8C5A35] outline-none text-sm font-bold text-[#2C1E16] appearance-none cursor-pointer hover:border-[#8C5A35]/50 transition-all"
                        >
                          <option value="">-- Chọn địa chỉ --</option>
                          {addresses.map((addr) => (
                            <option key={addr.addressId} value={addr.addressId}>
                              {addr.recipientName} - {addr.detailedAddress}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full pl-4 py-3.5 bg-red-50 border border-red-200 text-red-500 rounded-xl text-sm font-bold">
                          Chưa có địa chỉ giao hàng
                        </div>
                      )}
                      <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#5C4D43] pointer-events-none group-hover:text-[#8C5A35]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#E5D5C5]">
                <h2 className="text-lg font-black text-[#8C5A35] mb-2 pb-4 border-b border-[#E5D5C5] uppercase tracking-wider">
                  Món đã chọn ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
                </h2>

                <div className="space-y-6 mt-6">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="flex flex-col sm:flex-row gap-4 py-4 border-b border-[#E5D5C5]/50 last:border-0 last:pb-0 relative group">
                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="absolute top-4 right-0 sm:top-1/2 sm:-translate-y-1/2 sm:right-0 p-2 text-[#5C4D43] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Xóa món"
                      >
                        <FiTrash2 size={18} />
                      </button>

                      <div className="w-24 h-24 bg-[#FDF5E6] rounded-2xl overflow-hidden flex-shrink-0 border border-[#E5D5C5]">
                        <Link to={`/san-pham/${item.productId}`}>
                          <img
                            src={item.product?.imageUrl || 'https://placehold.co/100x100?text=Chua+co+anh'}
                            alt={item.product?.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </Link>
                      </div>

                      <div className="flex-1 pr-10">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <Link to={`/san-pham/${item.productId}`} className="text-base font-black text-[#2C1E16] hover:text-[#8C5A35] transition-colors line-clamp-2 uppercase tracking-wide">
                              {item.product?.productName || 'Sản phẩm không xác định'}
                              {item.productSizeName && (
                                <span className="ml-2 px-2 py-0.5 bg-[#8C5A35]/10 text-[#8C5A35] text-[10px] rounded-md border border-[#8C5A35]/20 font-black">
                                  Size: {item.productSizeName}
                                </span>
                              )}
                            </Link>
                            <p className="text-[#8C5A35] font-black mt-1 text-lg">
                              {item.product?.originalPrice?.toLocaleString() || '0'}₫
                            </p>
                          </div>

                          <div className="flex items-center bg-[#FCF8F1] border border-[#E5D5C5] rounded-full w-fit overflow-hidden h-10 shadow-sm">
                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-4 text-[#5C4D43] hover:bg-[#E5D5C5]/50 hover:text-[#8C5A35] transition-colors font-black text-lg">-</button>
                            <span className="w-10 text-center text-sm font-black text-[#2C1E16]">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-4 text-[#5C4D43] hover:bg-[#E5D5C5]/50 hover:text-[#8C5A35] transition-colors font-black text-lg">+</button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.selectedToppings?.map(t => (
                            <span key={t.productId} className="px-3 py-1 bg-[#8C5A35]/10 text-[10px] rounded-full border border-[#8C5A35]/20 text-[#8C5A35] font-black uppercase tracking-widest">
                              + {t.productName}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-[#5C4D43] uppercase tracking-[0.2em]">Đường</span>
                            <select
                              value={item.note?.includes('50% đường') ? '50' : item.note?.includes('70% đường') ? '70' : '100'}
                              onChange={(e) => updateNote(item.cartItemId, 'đường', e.target.value)}
                              className="text-[10px] py-1.5 pl-3 pr-8 bg-[#FCF8F1] border border-[#E5D5C5] rounded-lg outline-none font-bold text-[#2C1E16] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4QzVBMzUiIHN0cm9rZS13aWR0aD0iMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+')] bg-no-repeat bg-[right_8px_center] bg-[length:10px_10px] hover:border-[#8C5A35]/50 transition-colors uppercase tracking-widest cursor-pointer"
                            >
                              <option value="100">100%</option>
                              <option value="70">70%</option>
                              <option value="50">50%</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-[#5C4D43] uppercase tracking-[0.2em]">Đá</span>
                            <select
                              value={item.note?.includes('50% đá') ? '50' : item.note?.includes('70% đá') ? '70' : '100'}
                              onChange={(e) => updateNote(item.cartItemId, 'đá', e.target.value)}
                              className="text-[10px] py-1.5 pl-3 pr-8 bg-[#FCF8F1] border border-[#E5D5C5] rounded-lg outline-none font-bold text-[#2C1E16] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4QzVBMzUiIHN0cm9rZS13aWR0aD0iMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+')] bg-no-repeat bg-[right_8px_center] bg-[length:10px_10px] hover:border-[#8C5A35]/50 transition-colors uppercase tracking-widest cursor-pointer"
                            >
                              <option value="100">100%</option>
                              <option value="70">70%</option>
                              <option value="50">50%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:w-1/3">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#E5D5C5] sticky top-32">
                <h2 className="text-xl font-black text-[#8C5A35] mb-6 pb-4 border-b border-[#E5D5C5] tracking-widest uppercase text-center">
                  Thanh Toán
                </h2>

                <div className="space-y-4 text-xs font-black text-[#5C4D43] mb-8 uppercase tracking-widest">
                  <div className="flex justify-between items-center hover:text-[#2C1E16] transition-colors">
                    <span>Tạm tính ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} món)</span>
                    <span className="text-[#2C1E16] font-black">{totalAmount.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between items-center hover:text-[#2C1E16] transition-colors">
                    <span>Phí giao hàng <span className="text-[10px] bg-[#FDF5E6] px-2 py-1 rounded-full ml-2 text-[#8C5A35] border border-[#8C5A35]/20">{distance > 0 ? `${distance.toFixed(1)}km` : 'N/A'}</span></span>
                    <span className="text-[#2C1E16] font-black">{shippingFee.toLocaleString()}₫</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-[#E5D5C5] pt-6 mb-8 flex justify-between items-end">
                  <span className="text-sm font-black text-[#5C4D43] uppercase tracking-widest">Toàn bộ</span>
                  <span className="text-4xl font-black text-[#8C5A35] tracking-tighter">
                    {finalAmount.toLocaleString()}₫
                  </span>
                </div>

                <Link
                  to={user ? "/payment" : "/login-register"}
                  onClick={(e) => {
                    if (!user) {
                      toast.info("Vui lòng đăng nhập để thực hiện thanh toán");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-[#2C1E16] text-white rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-[#2C1E16]/10 hover:bg-[#8C5A35] hover:shadow-[#8C5A35]/30 hover:-translate-y-1 transition-all active:scale-[0.98]"
                >
                  Đặt Hàng Ngay <FiChevronRight className="text-lg" />
                </Link>
                <p className="text-center text-[9px] text-[#5C4D43] mt-6 font-black uppercase tracking-[0.3em]">
                  Mọi giao dịch đều được mã hóa an toàn
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" theme="light" />
    </div>
  );
};

export default Cart;