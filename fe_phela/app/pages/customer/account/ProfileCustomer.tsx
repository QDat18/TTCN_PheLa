import React, { useState, useEffect } from 'react';
import Header from '~/components/customer/Header';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';
import api from '~/config/axios';
import { FiEdit, FiLock, FiSave, FiX, FiUser, FiMail, FiAward, FiMapPin, FiMusic } from 'react-icons/fi';

interface Customer {
  fullname: string;
  username: string;
  email: string;
  gender: string;
  pointUse: number;
  orderCancelCount: number;
}

interface PasswordUpdate {
  password: string;
}

const ProfileCustomer = () => {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<PasswordUpdate>({ password: '' });
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    email: user?.email || '',
    gender: (user as any)?.gender || '',
  });
  const [orderCount, setOrderCount] = useState<number>(0);
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const [reordering, setReordering] = useState<boolean>(false);

  const getMemberTier = (points: number) => {
    if (points < 10) return 'E-Member';
    if (points < 149) return 'Fa';
    if (points < 400) return 'Sol';
    return 'La';
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'La':
        return {
          color: 'bg-purple-100 text-purple-800',
          description: 'Hạng cao nhất với nhiều ưu đãi đặc biệt'
        };
      case 'Sol':
        return {
          color: 'bg-blue-100 text-blue-800',
          description: 'Hạng trung cấp với nhiều ưu đãi'
        };
      case 'Fa':
        return {
          color: 'bg-green-100 text-green-800',
          description: 'Hạng cơ bản với một số ưu đãi'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          description: 'Hạng mới bắt đầu'
        };
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.type !== 'customer') {
      window.location.href = '/';
      return;
    }

    const customerData: Customer = {
      fullname: user.fullname || '',
      username: user.username || '',
      email: user.email || '',
      gender: user.gender || '',
      pointUse: (user as any).pointUse || 0.0,
      orderCancelCount: (user as any).orderCancelCount || 0,
    };
    setCustomer(customerData);
    setFormData({
      fullname: user.fullname || '',
      email: customerData.email || '',
      gender: customerData.gender || '',
    });

    // Fetch order statistics and latest order
    const fetchOrderStats = async () => {
      try {
        const response = await api.get(`/api/order/customer/${(user as any).customerId}?page=0&size=1&sort=orderDate,desc`);
        setOrderCount(response.data.totalElements);
        if (response.data.content && response.data.content.length > 0) {
          setLatestOrder(response.data.content[0]);
        }
      } catch (err) {
        console.error('Error fetching order stats:', err);
      }
    };
    fetchOrderStats();
  }, [user, authLoading]);

  const handleReorder = async () => {
    if (!latestOrder || !user) return;
    setReordering(true);
    try {
      const { getCustomerCart, addToCart } = await import('~/services/cartService');
      const cart = await getCustomerCart((user as any).customerId);
      
      if (!cart || !cart.cartId) {
        throw new Error('Không tìm thấy giỏ hàng');
      }

      // Add each item from the latest order to cart
      for (const item of latestOrder.orderItems) {
        await addToCart(cart.cartId, {
          productId: item.productId,
          quantity: item.quantity,
          amount: item.price,
          note: item.note
        });
      }

      toast.success('Đã thêm các món từ đơn hàng cũ vào giỏ hàng!');
      // Trigger cart update event if Header is listening
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Có lỗi xảy ra khi đặt lại đơn hàng.');
    } finally {
      setReordering(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      password: value,
    }));
  };

  const validateFormData = () => {
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Email không hợp lệ.');
      return false;
    }
    if (!formData.gender) {
      setError('Giới tính không được để trống.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateFormData()) {
      setLoading(false);
      toast.error('Vui lòng kiểm tra lại dữ liệu.');
      return;
    }

    try {
      const updateData = {
        fullname: formData.fullname,
        email: formData.email,
        gender: formData.gender,
      };

      // PERSIST TO BACKEND
      await api.put(`/api/customer/updateInfo/${customer?.username}`, updateData);

      // Update local context
      await updateUserProfile(updateData);

      setCustomer((prev) => ({
        ...prev!,
        fullname: updateData.fullname!,
        email: updateData.email!,
        gender: updateData.gender!,
      }));
      toast.success('Cập nhật thông tin tài khoản thành công!');
    } catch (error: any) {
      console.error('Error updating customer:', error.message);
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền cập nhật thông tin này.');
      } else {
        setError('Không thể cập nhật thông tin. Vui lòng thử lại.');
      }
      toast.error('Lỗi cập nhật thông tin. Kiểm tra console để biết thêm chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(`/api/customer/updatePassword/${customer?.username}`, passwordData, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      console.log('Password Update Response:', response.data);

      setPasswordData({ password: '' });
      setShowPasswordForm(false);
      toast.success('Cập nhật mật khẩu thành công!');
    } catch (error: any) {
      console.error('Error updating password:', error.response ? error.response.data : error.message);
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Mật khẩu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền cập nhật mật khẩu này.');
      } else {
        setError('Không thể cập nhật mật khẩu. Vui lòng thử lại.');
      }
      toast.error('Lỗi cập nhật mật khẩu. Kiểm tra console để biết thêm chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Không tìm thấy thông tin tài khoản</h2>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  const memberTier = getMemberTier(customer.pointUse);
  const tierInfo = getTierInfo(memberTier);

  const getTierStep = (points: number) => {
    if (points < 10) return { current: points, next: 10, nextTier: 'Fa' };
    if (points < 149) return { current: points - 10, next: 139, nextTier: 'Sol' };
    if (points < 400) return { current: points - 149, next: 251, nextTier: 'La' };
    return { current: 1, next: 1, nextTier: 'Max' };
  };

  const tierStep = getTierStep(customer.pointUse);
  const progressWidth = tierStep.nextTier === 'Max' ? 100 : Math.min(100, (tierStep.current / tierStep.next) * 100);

  return (
    <div className="min-h-screen bg-[#FCF8F1]">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />

      <div className="container mx-auto px-4 pt-24 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Thông tin tài khoản</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-[2.5rem] overflow-hidden border border-[#E5D5C5]">
          {/* Premium Membership Card Section */}
          <div className="p-8 md:p-10 bg-[#2C1E16] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <FiMusic size={180} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#8C5A35] rounded-full flex items-center justify-center p-1.5 bg-[#8C5A35]/10">
                    <span className="text-[#8C5A35] font-black italic text-xl">Ph</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em] italic">{memberTier}</h2>
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <FiAward className="mr-2 text-[#8C5A35]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FDF5E6]">
                    {tierInfo.description}
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Số đơn hàng</p>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-4xl font-black text-[#FDF5E6] tracking-tighter">
                      {orderCount}
                    </span>
                    <span className="text-sm font-black text-[#8C5A35] uppercase italic pb-1">Đơn</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Nốt nhạc tích lũy</p>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-6xl font-black text-[#FDF5E6] tracking-tighter">
                      {Math.floor(customer.pointUse)}
                    </span>
                    <span className="text-sm font-black text-[#8C5A35] uppercase italic pb-1">Nốt nhạc</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar tinh tế */}
            <div className="mt-8 relative z-10 max-w-md">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 opacity-60">
                <span>
                  {tierStep.nextTier === 'Max' 
                    ? 'Bạn đã đạt hạng tối đa' 
                    : `Tiến trình thăng hạng (${tierStep.nextTier})`}
                </span>
                <span>
                  {tierStep.nextTier === 'Max' 
                    ? '100%' 
                    : `${Math.floor(customer.pointUse)}/${tierStep.nextTier === 'Fa' ? 10 : tierStep.nextTier === 'Sol' ? 149 : 400} Nốt nhạc`}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#8C5A35] transition-all duration-1000 ease-out"
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      id="fullname"
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{customer.username}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="" disabled>Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần hủy đơn</label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{customer.orderCancelCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <FiLock className="mr-2" /> Đổi mật khẩu
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" /> Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Latest Order Section */}
            {latestOrder && (
              <div className="mt-12 pt-10 border-t border-[#E5D5C5]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#1A120B] uppercase tracking-tighter italic flex items-center gap-2">
                    <FiMusic className="text-[#8C5A35]" /> Đơn hàng gần nhất
                  </h3>
                  <span className="px-3 py-1 bg-[#FDF5E6] text-[#8C5A35] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E5D5C5]">
                    {latestOrder.orderCode}
                  </span>
                </div>

                <div className="bg-[#FCF8F1] rounded-3xl p-6 border border-[#E5D5C5]/50 flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Ngày đặt: {new Date(latestOrder.orderDate).toLocaleDateString('vi-VN')}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {latestOrder.orderItems?.map((item: any, idx: number) => (
                        <span key={idx} className="text-sm font-medium text-[#1A120B]">
                          {item.quantity}x {item.productName}{idx < latestOrder.orderItems.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black text-[#8C5A35]">
                        {latestOrder.finalAmount?.toLocaleString('vi-VN')}đ
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        latestOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {latestOrder.status}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleReorder}
                    disabled={reordering}
                    className="w-full md:w-auto h-12 px-8 inline-flex items-center justify-center bg-[#1A120B] text-[#FDF5E6] rounded-2xl hover:bg-[#8C5A35] transition-all duration-300 text-xs font-black uppercase tracking-[0.2em] shadow-lg disabled:opacity-50"
                  >
                    {reordering ? 'Đang xử lý...' : 'Đặt lại đơn này'}
                    {!reordering && (
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {showPasswordForm && (
              <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiLock className="mr-2" /> Đổi mật khẩu
                  </h3>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={passwordData.password}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Nhập mật khẩu mới"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCustomer;