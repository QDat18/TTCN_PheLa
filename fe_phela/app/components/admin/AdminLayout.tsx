import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '~/AuthContext';
import {
  FiBell, FiUser, FiLogOut, FiMenu,
  FiSearch, FiLoader
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '~/config/axios'; // Nhớ check lại đường dẫn axios của bạn

const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- STATE TÌM KIẾM ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // --- STATE THÔNG BÁO ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<any>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Cập nhật đồng hồ
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const formattedDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // 2. LOGIC TÌM KIẾM (Debounce)
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
    setIsSearching(true);
    try {
      const response = await api.get(`/api/admin/global-search?query=${searchQuery}`);
      setSearchResults(response.data);
      setShowSearchDropdown(true);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. LOGIC WEBSOCKET THÔNG BÁO
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'STAFF')) {
      const client = new Client({
        webSocketFactory: () => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
          return new SockJS(`${apiUrl}/ws`);
        },
        onConnect: () => {
          console.log('Admin notifications WebSocket connected');
          client.subscribe('/topic/notifications/ADMIN', (message: any) => {
            const newNotif = JSON.parse(message.body);
            setNotifications(prev => [newNotif, ...prev]);
          });
        },
        reconnectDelay: 5000,
      });

      client.activate();
      stompClientRef.current = client;
      fetchNotifications();

      return () => client.deactivate();
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

  const markAllAsRead = async () => {
    try {
      await api.post(`/api/notifications/read-all?recipientId=ADMIN`);
      setNotifications([]);
    } catch (error) {
      console.error("Mark all as read error", error);
    }
  };

  // 4. LOGIC CLICK RA NGOÀI ĐỂ ĐÓNG MENU
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
    <div className="flex min-h-screen bg-[#FDF5E6]/50">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'}`}>

        <header className="h-16 bg-white border-b border-[#2C1E16]/5 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => isCollapsed ? setIsCollapsed(false) : setIsMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <FiMenu className="text-[#2C1E16]" size={20} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiMenu className="text-[#2C1E16]" size={20} />
            </button>

            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Hệ thống Quản trị</span>
              <span className="text-sm font-black text-[#2C1E16] capitalize">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">

            {/* THÀNH PHẦN TÌM KIẾM ĐÃ ĐƯỢC NÂNG CẤP */}
            <div className="relative hidden xl:block" ref={searchRef}>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 w-64 group focus-within:ring-2 focus-within:ring-[#d4a373]/20 transition-all">
                <FiSearch className="text-gray-400 group-focus-within:text-[#d4a373]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
                  placeholder="Tìm kiếm nhanh..."
                  className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-gray-400 font-medium outline-none"
                />
                {isSearching && <FiLoader className="animate-spin text-[#d4a373]" />}
              </div>

              {/* KHUNG KẾT QUẢ TÌM KIẾM */}
              {showSearchDropdown && searchResults && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white text-[#2C1E16] rounded-xl shadow-2xl border border-[#E5D5C5] overflow-hidden z-[60] max-h-[70vh] overflow-y-auto">
                  <div className="p-2">
                    {Object.keys(searchResults).every(key => searchResults[key].length === 0) ? (
                      <div className="p-4 text-center text-gray-500 text-xs">Không tìm thấy kết quả nào.</div>
                    ) : (
                      <>
                        {searchResults.products?.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35] rounded-t">Sản phẩm</div>
                            {searchResults.products.map((p: any) => (
                              <Link key={p.productId} to={`/admin/products`} onClick={() => setShowSearchDropdown(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
                                <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" />
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-xs font-bold truncate">{p.productName}</div>
                                  <div className="text-[10px] text-gray-500">{(p.discountPrice || p.originalPrice)?.toLocaleString()}đ</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.orders?.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Đơn hàng</div>
                            {searchResults.orders.map((o: any) => (
                              <Link key={o.id} to={`/admin/order-mangement`} onClick={() => setShowSearchDropdown(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                                <div className="text-xs font-bold">#{o.orderCode}</div>
                                <div className="text-[10px] text-gray-500">{o.status} • {o.finalAmount?.toLocaleString()}đ</div>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.customers?.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Khách hàng</div>
                            {searchResults.customers.map((c: any) => (
                              <Link key={c.customerId} to={`/admin/customer-magement`} onClick={() => setShowSearchDropdown(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                                <div className="text-xs font-bold">{c.fullname || c.username}</div>
                                <div className="text-[10px] text-gray-500">{c.email}</div>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.jobPostings?.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1 bg-[#FDF5E6] text-[10px] font-black uppercase text-[#8C5A35]">Tin tuyển dụng</div>
                            {searchResults.jobPostings.map((j: any) => (
                              <Link key={j.jobPostingId} to={`/admin/job-posting`} onClick={() => setShowSearchDropdown(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors">
                                <div className="text-xs font-bold">{j.title}</div>
                                <div className="text-[10px] text-gray-500">{j.jobCode} • {j.status}</div>
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

            {/* THÀNH PHẦN THÔNG BÁO ĐÃ ĐƯỢC NÂNG CẤP */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
              >
                <FiBell className="text-gray-600 group-hover:text-[#d4a373]" size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  </span>
                )}
              </button>

              {/* KHUNG DANH SÁCH THÔNG BÁO */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white text-[#2C1E16] rounded-xl shadow-2xl border border-[#E5D5C5] overflow-hidden z-[60]"
                  >
                    <div className="px-4 py-3 bg-[#FDF5E6] border-b border-[#E5D5C5] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase text-[#8C5A35]">Thông báo mới</span>
                        <span className="text-[10px] font-bold text-gray-500">{notifications.length} chưa đọc</span>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllAsRead();
                          }}
                          className="text-[10px] font-bold text-[#d4a373] hover:text-[#bc8a5f] transition-colors flex items-center gap-1"
                        >
                          Đánh dấu đã đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <FiBell className="mx-auto mb-2 opacity-20 text-3xl" />
                          <p className="text-[10px]">Bạn không có thông báo mới nào.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.notificationId}
                            className="p-4 border-b border-gray-100 hover:bg-orange-50/30 transition-colors cursor-pointer"
                            onClick={() => {
                              markAsRead(n.notificationId);
                              if (n.type === 'CUSTOMER_MESSAGE') {
                                setShowNotifications(false);
                                navigate('/admin/support', { state: { customerId: n.senderId } });
                              }
                            }}
                          >
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'CUSTOMER_MESSAGE' ? 'bg-blue-500' : 'bg-[#d4a373]'}`}></div>
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
                      <div className="p-2 bg-gray-50 border-t border-[#E5D5C5]">
                        <button
                          className="w-full py-2 text-[10px] font-black uppercase text-[#8C5A35] hover:bg-[#FDF5E6] rounded-lg transition-colors text-center"
                          onClick={() => {
                            setShowNotifications(false);
                            // Navigate to a notifications page if it exists, or just close for now
                            // navigate('/admin/notifications'); 
                          }}
                        >
                          Xem tất cả thông báo
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 rounded-full border border-gray-100 hover:bg-gray-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-[#d4a373] flex items-center justify-center text-white shadow-md shadow-[#d4a373]/20 group-hover:scale-105 transition-transform">
                  <FiUser size={16} />
                </div>
                <div className="hidden sm:flex flex-col items-start pr-2">
                  <span className="text-xs font-black text-[#2C1E16]">{user?.fullname || 'Admin'}</span>
                  <span className="text-[9px] text-[#d4a373] font-bold uppercase tracking-widest leading-none">{user?.role?.replace('ROLE_', '') || 'STAFF'}</span>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#2C1E16]/5 z-50 p-2"
                    >
                      <Link
                        to="/admin/profileAdmin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FDF5E6] text-gray-700 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-[#d4a373] group-hover:text-white transition-colors">
                          <FiUser size={14} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest group-hover:text-[#8C5A35]">Hồ sơ cá nhân</span>
                      </Link>
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <FiLogOut size={14} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Đăng xuất</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth lg:max-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;