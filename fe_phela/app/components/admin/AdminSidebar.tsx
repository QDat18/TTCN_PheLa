import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiPackage, FiShoppingBag, FiBarChart2,
  FiTag, FiUsers, FiMapPin, FiBriefcase,
  FiMoreHorizontal, FiHelpCircle, FiChevronDown,
  FiX, FiMenu
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/AuthContext';
import logo from '../../assets/images/logo.png';
import menuData from '../../data/menuAdmin.json';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const iconMap: Record<number, React.ElementType> = {
  0: FiHome, // Dashboard (Manual)
  1: FiPackage, // Sản phẩm
  2: FiShoppingBag, // Đơn hàng
  3: FiBarChart2, // Báo cáo
  4: FiTag, // Khuyến mãi
  5: FiUsers, // Nhân viên
  6: FiMapPin, // Cửa hàng
  7: FiBriefcase, // Tuyển dụng
  8: FiMoreHorizontal, // Khác
  9: FiHelpCircle // Hỗ trợ
};

const AdminSidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const location = useLocation();
  const [openSubMenus, setOpenSubMenus] = useState<Record<number, boolean>>({});

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  const toggleSubMenu = (id: number) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleMenus: Record<string, number[]> = {
    'SUPER_ADMIN': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    'ADMIN': [0, 1, 2, 3, 4, 6, 7, 8, 9]
  };

  const allowedMenus = roleMenus[user?.role || ''] || [];

  const menuItems = [
    { id: 0, title: "Dashboard", link: "/admin/dashboard", subMenu: [] },
    ...menuData.mainMenu
  ].filter(item => allowedMenus.includes(item.id));

  const renderMenuItem = (menu: any) => {
    const Icon = iconMap[menu.id] || FiMoreHorizontal;
    const hasSubMenu = menu.subMenu && menu.subMenu.length > 0;
    const isActive = location.pathname.startsWith(menu.link);
    const isOpen = openSubMenus[menu.id];

    return (
      <div key={menu.id} className="mb-1">
        {hasSubMenu ? (
          <div>
            <button
              onClick={() => toggleSubMenu(menu.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#d4a373] text-white shadow-lg' : 'text-[#FCF8F1]/70 hover:bg-white/5 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={isActive ? 'text-white' : 'text-[#d4a373] group-hover:scale-110 transition-transform'} />
                {!isCollapsed && <span className="text-sm font-medium tracking-wide uppercase">{menu.title}</span>}
              </div>
              {!isCollapsed && (
                <FiChevronDown
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  size={16}
                />
              )}
            </button>
            <AnimatePresence>
              {isOpen && !isCollapsed && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="pl-12 mt-1 space-y-1 overflow-hidden"
                >
                  {menu.subMenu.map((sub: any, idx: number) => (
                    <li key={idx}>
                      <Link
                        to={sub.link}
                        className={`block py-2 text-xs font-medium tracking-widest uppercase transition-colors hover:text-[#d4a373] ${location.pathname === sub.link ? 'text-[#d4a373]' : 'text-[#FCF8F1]/50'
                          }`}
                      >
                        {sub.title}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            to={menu.link}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === menu.link ? 'bg-[#d4a373] text-white shadow-lg' : 'text-[#FCF8F1]/70 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Icon size={20} className={location.pathname === menu.link ? 'text-white' : 'text-[#d4a373] group-hover:scale-110 transition-transform'} />
            {!isCollapsed && <span className="text-sm font-medium tracking-wide uppercase">{menu.title}</span>}
          </Link>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className={`h-full bg-[#2C1E16] flex flex-col transition-all duration-300 border-r border-white/5 shadow-2xl overflow-hidden`}>
      {/* Logo Section */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-white/5`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Phê La Logo" className="h-8 object-contain" />
          {!isCollapsed && <span className="text-[#FCF8F1] font-black tracking-tighter text-xl">ADMIN</span>}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:block text-[#d4a373] hover:text-white transition-colors"
          >
            <FiMenu size={20} />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        {menuItems.map(renderMenuItem)}
      </nav>

      {/* Footer Section (Optional) */}
      {!isCollapsed && (
        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-[#FCF8F1]/40 uppercase tracking-widest font-black mb-1">Phiên bản Hệ thống</p>
            <p className="text-xs text-[#d4a373] font-black">V 2.5.0</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar (Drawer) */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
        {/* Sidebar container */}
        <div className={`absolute top-0 left-0 h-full w-[280px] transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-6 -right-12 bg-[#2C1E16] text-[#FCF8F1] p-2 rounded-full shadow-xl"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed) */}
      <aside className={`hidden lg:block h-screen fixed left-0 top-0 transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-[260px]'}`}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
