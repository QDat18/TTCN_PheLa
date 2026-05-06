import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo.png";
import menuData from '../../data/menuAdmin.json';
import { FaBars, FaTimes, FaChevronDown, FaSearch, FaBell } from "react-icons/fa";
import { useAuth } from '~/AuthContext';
import { RiAccountCircleLine } from "react-icons/ri";
import api from '~/config/axios';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<any>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults(null);
        setShowSearchDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    setShowSearchDropdown(true);
    setIsSearching(true);
    try {
      const response = await api.get(`/api/admin/global-search?query=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  // WebSocket for Real-time Notifications
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'STAFF')) {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${apiUrl}/ws`),
        onConnect: () => {
          console.log('Notification WebSocket connected');
          // Subscribe to admin notifications
          client.subscribe('/topic/notifications/ADMIN', (message: any) => {
            const newNotif = JSON.parse(message.body);
            setNotifications(prev => [newNotif, ...prev]);
            // Optional: browser notification or toast
          });
        },
        reconnectDelay: 5000,
      });

      client.activate();
      stompClientRef.current = client;

      return () => {
        client.deactivate();
      };
    }
  }, [user]);

  // Initial fetch of notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get(`/api/notifications/unread?recipientId=ADMIN`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Fetch notifications error", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.notificationId !== id));
    } catch (error) {
      console.error("Mark as read error", error);
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#2C1E16] text-[#FCF8F1] shadow-lg sticky top-0 z-50 w-full h-16 flex items-center gap-4 px-4 lg:px-8 border-b border-[#8C5A35]">
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <Link to="/admin/dashboard">
          <img src={logo} className="h-10 object-contain drop-shadow-md hover:scale-105 transition-transform" alt="Logo Phê La" />
        </Link>
      </div>

      {/* Global Search */}
      <div className="hidden md:flex flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm nhanh (Sản phẩm, Đơn hàng, Khách hàng...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full bg-white/10 border border-[#8C5A35]/30 rounded-full py-1.5 pl-10 pr-4 text-xs focus:bg-white/20 focus:outline-none focus:border-[#d4a373] transition-all placeholder:text-[#FCF8F1]/40"
          />
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d4a373] text-sm" />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-[#d4a373] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white text-[#2C1E16] rounded-xl shadow-2xl border border-[#E5D5C5] overflow-hidden z-[60] max-h-[70vh] overflow-y-auto">
            <div className="p-2">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#d4a373] border-t-transparent rounded-full animate-spin"></div>
                  Đang tìm kiếm...
                </div>
              ) : !searchResults ? (
                <div className="p-4 text-center text-gray-400 text-xs italic">Nhập từ khóa để tìm kiếm...</div>
              ) : Object.keys(searchResults).every(key => !searchResults[key] || searchResults[key].length === 0) ? (
                <div className="p-4 text-center text-gray-500 text-xs">Không tìm thấy kết quả nào.</div>
              ) : (
                <>
                  {searchResults.products?.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Sản phẩm</div>
                      {searchResults.products.map((p: any) => (
                        <Link key={p.productId} to={`/admin/products`} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
                          <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" />
                          <div className="flex-1 overflow-hidden">
                            <div className="text-xs font-bold truncate">{p.productName}</div>
                            <div className="text-[10px] text-gray-500">{p.price.toLocaleString()}đ</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.orders?.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Đơn hàng</div>
                      {searchResults.orders.map((o: any) => (
                        <Link key={o.orderId} to={`/admin/order-mangement`} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                          <div className="text-xs font-bold">#{o.orderCode}</div>
                          <div className="text-[10px] text-gray-500">{o.status} • {o.totalAmount.toLocaleString()}đ</div>
                        </Link>
                      ))}
                    </div>
                  )}
                   {searchResults.customers?.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Khách hàng</div>
                      {searchResults.customers.map((c: any) => (
                        <Link key={c.customerId} to={`/admin/customer-magement`} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                          <div className="text-xs font-bold">{c.fullname || c.username}</div>
                          <div className="text-[10px] text-gray-500">{c.email}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.jobPostings?.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Tuyển dụng</div>
                      {searchResults.jobPostings.map((j: any) => (
                        <Link key={j.jobPostingId} to={`/admin/job-posting`} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                          <div className="text-xs font-bold">{j.title}</div>
                          <div className="text-[10px] text-gray-500">{j.location} • {j.status}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.branches?.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Cửa hàng</div>
                      {searchResults.branches.map((b: any) => (
                        <Link key={b.branchCode} to={`/admin/store`} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                          <div className="text-xs font-bold uppercase">{b.branchName}</div>
                          <div className="text-[10px] text-gray-500">{b.address}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hamburger button (Mobile) */}
      <button className="lg:hidden text-[#FCF8F1] text-2xl focus:outline-none ml-auto" onClick={toggleMenu}>
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Menu Links */}
      <div className={`absolute lg:static top-16 left-0 w-full lg:w-auto bg-[#2C1E16] lg:bg-transparent transition-all duration-300 ease-in-out ${isMenuOpen ? 'block shadow-xl pb-4' : 'hidden lg:flex'} flex-1 justify-center`}>
        <ul className="flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-4 lg:p-0">
          {menuData.mainMenu.map((menu, index) => (
            <li key={index} className="relative group w-full lg:w-auto text-center">
              <Link
                to={menu.link}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#FCF8F1] hover:text-[#d4a373] transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap"
              >
                {menu.title}
                {menu.subMenu && menu.subMenu.length > 0 && <FaChevronDown size={8} className="mt-0.5 opacity-70 group-hover:rotate-180 transition-transform" />}
              </Link>

              {/* Sub Menu Dropdown */}
              {menu.subMenu && menu.subMenu.length > 0 && (
                <ul className="lg:absolute top-full left-1/2 lg:-translate-x-1/2 mt-1 w-52 bg-white text-[#2C1E16] rounded-xl shadow-xl border border-[#E5D5C5] overflow-hidden hidden group-hover:block transition-all z-50">
                  {menu.subMenu.map((subMenu, subIndex) => (
                    <li key={subIndex}>
                      <Link
                        to={subMenu.link}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#FDF5E6] hover:text-[#8C5A35] transition-colors border-b border-[#E5D5C5]/50 last:border-0 text-left"
                      >
                        {subMenu.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="p-2 text-[#FCF8F1] hover:bg-white/5 rounded-full transition-all relative group"
          >
            <FaBell className={`text-lg transition-transform ${notifications.length > 0 ? 'animate-bounce-subtle' : ''}`} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#2C1E16]">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white text-[#2C1E16] rounded-xl shadow-2xl border border-[#E5D5C5] overflow-hidden z-[60]">
              <div className="px-4 py-3 bg-[#FDF5E6] border-b border-[#E5D5C5] flex items-center justify-between">
                <span className="font-black text-xs uppercase text-[#8C5A35]">Thông báo mới</span>
                <span className="text-[10px] font-bold text-gray-500">{notifications.length} chưa đọc</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FaBell className="mx-auto mb-2 opacity-20 text-3xl" />
                    <p className="text-[10px]">Bạn không có thông báo mới nào.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.notificationId} 
                      className="p-4 border-b border-gray-100 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => markAsRead(n.notificationId)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'CHAT_MESSAGE' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-800 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <button className="w-full py-2.5 text-[10px] font-bold text-[#8C5A35] hover:bg-[#FDF5E6] transition-colors border-t border-[#E5D5C5]">
                  Xem tất cả thông báo
                </button>
              )}
            </div>
          )}
        </div>

        {user ? (
          <div className="relative group shrink-0">
            <div className="flex items-center cursor-pointer py-1.5 px-2.5 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-[#8C5A35]/30">
              <RiAccountCircleLine className='text-2xl mr-2 text-[#d4a373]' />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FCF8F1] hidden sm:inline">{user.fullname || user.username}</span>
              <FaChevronDown size={8} className="ml-2 text-[#d4a373]" />

              {/* User Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E5D5C5] overflow-hidden hidden group-hover:block z-50">
                <Link
                  to="/admin/profileAdmin"
                  className="block px-5 py-3 text-[10px] font-black text-[#2C1E16] uppercase tracking-widest hover:bg-[#FDF5E6] hover:text-[#8C5A35] transition-colors border-b border-[#E5D5C5]/50 text-left"
                >
                  Thông tin cá nhân
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/admin" className="px-6 py-2 bg-[#d4a373] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#c19266] transition-colors shadow-md shadow-[#d4a373]/20">
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Header;