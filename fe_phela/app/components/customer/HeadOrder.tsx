import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoCartOutline, IoPersonOutline, IoChevronDownOutline } from 'react-icons/io5';
import { useAuth } from '~/AuthContext';
import logo from "../../assets/images/logo.png";
import api from '~/config/axios'; // Nhớ import api để gọi backend

const HeadOrder = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // LOGIC: State lưu số lượng món trong giỏ
  const [cartCount, setCartCount] = useState(0);

  // LOGIC: Hàm lấy số lượng món từ API
  useEffect(() => {
    const fetchCartCount = async () => {
      if (user && user.type === 'customer' && user.customerId) {
        try {
          const response = await api.get(`/api/customer/cart/getCustomer/${user.customerId}`);
          const items = response.data.cartItems || [];
          // Tính tổng số lượng các món (hoặc dùng items.length nếu chỉ đếm số dòng)
          const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(totalQuantity);
        } catch (error) {
          console.error('Lỗi khi tải số lượng giỏ hàng:', error);
        }
      } else {
        setCartCount(0);
      }
    };

    // Gọi lần đầu khi load trang
    fetchCartCount();

    // Lắng nghe sự kiện 'cartUpdated' để tự động cập nhật số lượng khi thêm/xóa món
    window.addEventListener('cartUpdated', fetchCartCount);

    // Dọn dẹp sự kiện khi component unmount
    return () => {
      window.removeEventListener('cartUpdated', fetchCartCount);
    };
  }, [user]);

  return (
    <header className="bg-[#FCF8F1] text-[#2C1E16] py-3 px-6 shadow-sm relative z-[100] border-b border-[#E5D5C5]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo Phe La */}
        <Link to="/" className="flex items-center group">
          <img
            src="/logo.png"
            className="h-8 md:h-10 w-auto filter drop-shadow-sm brightness-0 opacity-80 hover:opacity-100 transition-opacity"
            alt="Phê La"
          />
        </Link>

        {/* Right Section: Cart & Profile */}
        <div className="flex items-center gap-6 md:gap-8 font-bold text-sm">

          {/* Nút Giỏ hàng đã gắn Logic đếm số lượng */}
          <Link to="/cart" className="relative group flex items-center gap-2 text-[#2C1E16] hover:text-[#8C5A35] transition-colors">
            <div className="relative p-1">
              <IoCartOutline size={26} />
              {/* Nếu giỏ hàng > 0 thì mới hiện cái chấm đỏ/nâu báo số lượng */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#8C5A35] text-white text-[10px] font-black rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center border border-[#FCF8F1] shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest mt-0.5">Giỏ Hàng</span>
          </Link>

          {/* Nút Tài khoản */}
          {user ? (
            <div className="relative group cursor-pointer flex items-center gap-2 py-2 px-5 rounded-full bg-white border border-[#E5D5C5] hover:border-[#8C5A35] transition-all shadow-sm">
              <IoPersonOutline size={16} className="text-[#8C5A35]" />
              <span className="text-[10px] md:text-[11px] font-black tracking-widest uppercase max-w-[100px] truncate text-[#2C1E16] mt-0.5">
                {user.fullname || user.username}
              </span>
              <IoChevronDownOutline size={14} className="text-[#5C4D43]" />

              {/* User Dropdown */}
              <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-[#E5D5C5] overflow-hidden">
                <Link to="/profileCustomer" className="block px-6 py-4 text-[11px] text-[#5C4D43] hover:bg-[#FDF5E6] hover:text-[#8C5A35] font-bold uppercase tracking-widest transition-colors border-b border-[#E5D5C5]/50">Tài khoản</Link>
                <Link to="/my-orders" className="block px-6 py-4 text-[11px] text-[#5C4D43] hover:bg-[#FDF5E6] hover:text-[#8C5A35] font-bold uppercase tracking-widest transition-colors border-b border-[#E5D5C5]/50">Đơn hàng</Link>
                <Link to="/uu-dai" className="block px-6 py-4 text-[11px] text-[#5C4D43] hover:bg-[#FDF5E6] hover:text-[#8C5A35] font-bold uppercase tracking-widest transition-colors border-b border-[#E5D5C5]/50">Ưu đãi & Đổi quà</Link>
                <button onClick={logout} className="w-full text-left px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors">Đăng xuất</button>
              </div>
            </div>
          ) : (
            <Link to="/login-register" className="bg-[#2C1E16] text-white px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#8C5A35] transition-colors shadow-md whitespace-nowrap">
              ĐĂNG NHẬP
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeadOrder;