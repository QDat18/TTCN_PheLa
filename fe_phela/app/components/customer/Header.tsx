import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo.png";
import menuData from '../../data/menuUser.json';
import { FaBars, FaTimes, FaChevronDown, FaUser } from "react-icons/fa";
import { IoCartOutline } from "react-icons/io5";
import { FiMusic } from "react-icons/fi";
import { useAuth } from '~/AuthContext';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import api from '~/config/axios'; // Thêm API để đếm giỏ hàng

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { scrollY } = useScroll();

  // --- LOGIC: Quản lý số lượng giỏ hàng & Nốt nhạc ---
  const [cartCount, setCartCount] = useState(0);
  const [notes, setNotes] = useState(0);
  const [tier, setTier] = useState('E-Member');
  const [accumulatedNotes, setAccumulatedNotes] = useState(0);
  const [displayFullname, setDisplayFullname] = useState('');

  useEffect(() => {
    const fetchCartAndNotes = async () => {
      if (user && user.type === 'customer' && user.customerId) {
        try {
          const [cartRes, customerRes] = await Promise.all([
            api.get(`/api/customer/cart/getCustomer/${user.customerId}`),
            api.get(`/api/customer/profile/${user.customerId}`)
          ]);

          const items = cartRes.data.cartItems || [];
          const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(totalQuantity);

          if (customerRes.data) {
            setNotes(customerRes.data.currentNotes || 0);
            setTier(customerRes.data.membershipTier || 'E-Member');
            setAccumulatedNotes(customerRes.data.totalAccumulatedNotes || 0);
            setDisplayFullname(customerRes.data.fullname || customerRes.data.fullName || '');
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin Header:', error);
        }
      } else {
        setCartCount(0);
        setNotes(0);
      }
    };

    fetchCartAndNotes();
    window.addEventListener('cartUpdated', fetchCartAndNotes);
    window.addEventListener('notesUpdated', fetchCartAndNotes);

    return () => {
      window.removeEventListener('cartUpdated', fetchCartAndNotes);
      window.removeEventListener('notesUpdated', fetchCartAndNotes);
    };
  }, [user]);
  // ------------------------------------------

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-[1000] flex justify-center items-center px-4 md:px-8 bg-[#FCF8F1] h-[70px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-[#E5D5C5]"
    >
      <div className="flex items-center w-full max-w-7xl justify-between h-full gap-2 lg:gap-4">

        {/* Logo Section */}
        <Link to="/" className="flex-shrink-0 mr-2 lg:mr-6">
          <img src="/logo.png" className="h-8 md:h-9 w-auto filter drop-shadow-sm brightness-0 opacity-80 hover:opacity-100 transition-opacity" alt="Phê La" />
        </Link>

        {/* Desktop Menu - KHÔNG BAO GIỜ rớt dòng */}
        <nav className="hidden lg:block flex-1">
          <ul className="flex space-x-4 lg:space-x-6 xl:space-x-8 items-center justify-center">
            {menuData.mainMenu.map((menu, index) => (
              <li key={index} className="relative group">
                <Link
                  to={menu.link}
                  className="whitespace-nowrap text-[11px] xl:text-[12px] font-black uppercase tracking-wider transition-all text-[#2C1E16] hover:text-[#8C5A35] flex items-center gap-1"
                >
                  {menu.title}
                  {menu.subMenu.length > 0 && <FaChevronDown size={8} className="text-[#2C1E16]/40 group-hover:text-[#8C5A35] ml-1" />}
                </Link>
                {menu.subMenu.length > 0 && (
                  <div className="absolute top-full left-0 mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-56 bg-white border-t-2 border-[#8C5A35] py-3 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-x border-b border-[#E5D5C5] rounded-b-lg">
                    {menu.subMenu.map((sub, idx) => (
                      <Link key={idx} to={sub.link} className="block px-6 py-3 text-[11px] font-bold text-[#5C4D43] hover:text-[#8C5A35] hover:bg-[#FDF5E6] uppercase tracking-widest transition-all">
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions (Giỏ hàng + Tài khoản) */}
        <div className="flex items-center space-x-4 md:space-x-6 flex-shrink-0">

          {/* Nút Giỏ Hàng đã gộp Logic nhảy số */}
          <Link to="/cart" className="relative group flex items-center text-[#2C1E16] hover:text-[#8C5A35] transition-colors p-1">
            <IoCartOutline size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#8C5A35] text-white text-[9px] font-black rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center border border-[#FCF8F1] shadow-sm group-hover:scale-110 transition-transform">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Phân cách */}
          <div className="hidden lg:block h-5 w-px bg-[#E5D5C5]"></div>

          {/* Nút Tài khoản */}
          {user ? (
            <div className="relative group">
              <div className="flex items-center cursor-pointer text-[#2C1E16] hover:text-[#8C5A35] transition-all py-2">
                <FaUser className="text-[14px]" />
                <span className="ml-2 text-[11px] font-black uppercase tracking-wider hidden xl:inline max-w-[100px] truncate">
                  {displayFullname || user.fullname || user.username}
                </span>
                <FaChevronDown size={8} className="ml-1.5 text-[#2C1E16]/40 group-hover:text-[#8C5A35] hidden xl:inline" />
              </div>

              {/* Dropdown Tài khoản (Có thẻ Membership của bạn) */}
              <div className="absolute top-full right-0 mt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 w-64 bg-white border border-[#E5D5C5] shadow-2xl rounded-2xl overflow-hidden">

                {/* Mini Membership Card - Link to Dashboard */}
                <Link to="/membership" className="block group/card relative">
                  <div className="p-4 bg-[#2C1E16] text-white transition-all duration-300 group-hover/card:bg-[#3d2a1f]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C5A35] opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8C5A35]">{tier}</p>
                        <p className="text-[8px] font-bold opacity-60 uppercase">
                          {tier === 'KIM_CUONG' ? 'Hạng cao nhất' :
                            tier === 'VANG' ? 'Hạng Vàng giá trị' :
                              tier === 'BAC' ? 'Hạng Bạc thân thiết' : 'Hạng mới bắt đầu'}
                        </p>
                      </div>
                      <FiMusic className="text-[#8C5A35] opacity-40 animate-pulse" size={14} />
                    </div>
                    <div className="flex items-end gap-2 relative z-10">
                      <span className="text-3xl font-black leading-none text-[#FDF5E6]">{notes}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8C5A35] pb-0.5">Nốt nhạc</span>
                    </div>
                    {/* Progress bar logic (Using totalAccumulatedNotes) */}
                    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden relative z-10">
                      <div
                        className="h-full bg-[#8C5A35] transition-all duration-1000"
                        style={{ width: `${Math.min((accumulatedNotes / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span className="text-[8px] text-[#D4A373] font-bold opacity-0 group-hover/card:opacity-100 transition-opacity">XEM CHI TIẾT →</span>
                    </div>
                  </div>
                </Link>

                <div className="py-2">
                  <Link to="/profileCustomer" className="block px-6 py-3 text-[11px] font-bold text-[#5C4D43] hover:text-[#8C5A35] hover:bg-[#FDF5E6] uppercase tracking-widest transition-colors">
                    Tài khoản cá nhân
                  </Link>
                  <Link to="/my-address" className="block px-6 py-3 text-[11px] font-bold text-[#5C4D43] hover:text-[#8C5A35] hover:bg-[#FDF5E6] uppercase tracking-widest transition-colors border-t border-[#E5D5C5]/30">
                    Địa chỉ của tôi
                  </Link>
                  <Link to="/my-orders" className="block px-6 py-3 text-[11px] font-bold text-[#5C4D43] hover:text-[#8C5A35] hover:bg-[#FDF5E6] uppercase tracking-widest transition-colors border-t border-[#E5D5C5]/30">
                    Đơn hàng của tôi
                  </Link>
                  <Link to="/membership" className="block px-6 py-3 text-[11px] font-bold text-[#5C4D43] hover:text-[#8C5A35] hover:bg-[#FDF5E6] uppercase tracking-widest transition-colors border-t border-[#E5D5C5]/30">
                    Nốt nhạc & Hạng thành viên
                  </Link>
                </div>

                <div className="h-px bg-[#E5D5C5] mx-4 my-1"></div>

                <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-[11px] font-bold text-red-500 hover:bg-red-50 uppercase tracking-widest transition-colors">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login-register" className="whitespace-nowrap text-[10px] font-black text-[#2C1E16] uppercase tracking-widest border border-[#2C1E16] rounded-full px-5 py-2 hover:bg-[#2C1E16] hover:text-white transition-all hidden sm:block">
              ĐĂNG NHẬP
            </Link>
          )}

          {/* Nút Menu Mobile */}
          <button className="lg:hidden text-[#2C1E16]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <FaBars size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-[#FCF8F1] z-[2000] p-8 md:p-12 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12 md:mb-16">
              <img src={logo} className="h-10 w-auto brightness-0 opacity-80" alt="Logo" />
              <button onClick={() => setIsMenuOpen(false)} className="text-[#2C1E16] p-2 hover:text-[#8C5A35] transition-colors bg-white rounded-full border border-[#E5D5C5]">
                <FaTimes size={20} />
              </button>
            </div>

            {!user && (
              <Link to="/login-register" className="w-full text-center bg-[#2C1E16] text-white py-4 rounded-xl font-black uppercase tracking-widest mb-10 shadow-lg">
                Đăng nhập
              </Link>
            )}

            <ul className="space-y-6 md:space-y-8 overflow-y-auto">
              {menuData.mainMenu.map((menu, index) => (
                <li key={index} className="border-b border-[#E5D5C5]/50 pb-4">
                  <Link to={menu.link} onClick={() => setIsMenuOpen(false)} className="text-2xl md:text-3xl font-black text-[#2C1E16] hover:text-[#8C5A35] uppercase tracking-tighter block transition-colors">{menu.title}</Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Header;