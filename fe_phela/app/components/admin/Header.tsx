import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo.png";
import menuData from '../../data/menuAdmin.json';
import { FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import { useAuth } from '~/AuthContext';
import { RiAccountCircleLine } from "react-icons/ri";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <nav className="bg-[#2C1E16] text-[#FCF8F1] shadow-lg sticky top-0 z-50 w-full h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[#8C5A35]">
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <Link to="/admin/dashboard">
          <img src={logo} className="h-10 object-contain drop-shadow-md hover:scale-105 transition-transform" alt="Logo Phê La" />
        </Link>
      </div>

      {/* Hamburger button (Mobile) */}
      <button className="lg:hidden text-[#FCF8F1] text-2xl focus:outline-none" onClick={toggleMenu}>
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Menu Links */}
      <div className={`absolute lg:static top-16 left-0 w-full lg:w-auto bg-[#2C1E16] lg:bg-transparent transition-all duration-300 ease-in-out ${isMenuOpen ? 'block shadow-xl pb-4' : 'hidden lg:flex'} flex-1 justify-center`}>
        <ul className="flex flex-col lg:flex-row items-center gap-2 lg:gap-6 p-4 lg:p-0">
          {menuData.mainMenu.map((menu, index) => (
            <li key={index} className="relative group w-full lg:w-auto text-center">
              <Link
                to={menu.link}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[#FCF8F1] hover:text-[#d4a373] transition-colors rounded-lg hover:bg-white/5"
              >
                {menu.title}
                {menu.subMenu && menu.subMenu.length > 0 && <FaChevronDown size={10} className="mt-0.5 opacity-70 group-hover:rotate-180 transition-transform" />}
              </Link>

              {/* Sub Menu Dropdown */}
              {menu.subMenu && menu.subMenu.length > 0 && (
                <ul className="lg:absolute top-full left-1/2 lg:-translate-x-1/2 mt-1 w-52 bg-white text-[#2C1E16] rounded-xl shadow-xl border border-[#E5D5C5] overflow-hidden hidden group-hover:block transition-all z-50">
                  {menu.subMenu.map((subMenu, subIndex) => (
                    <li key={subIndex}>
                      <Link
                        to={subMenu.link}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-5 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-[#FDF5E6] hover:text-[#8C5A35] transition-colors border-b border-[#E5D5C5]/50 last:border-0 text-left"
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
      <div className="hidden lg:flex items-center relative group shrink-0">
        {user ? (
          <div className="flex items-center cursor-pointer py-2 px-3 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-[#8C5A35]/30">
            <RiAccountCircleLine className='text-2xl mr-2 text-[#d4a373]' />
            <span className="text-xs font-black uppercase tracking-widest text-[#FCF8F1]">{user.username}</span>
            <FaChevronDown size={10} className="ml-2 text-[#d4a373]" />

            {/* User Dropdown */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E5D5C5] overflow-hidden hidden group-hover:block z-50">
              <Link
                to="/admin/profileAdmin"
                className="block px-5 py-3 text-[11px] font-black text-[#2C1E16] uppercase tracking-widest hover:bg-[#FDF5E6] hover:text-[#8C5A35] transition-colors border-b border-[#E5D5C5]/50 text-left"
              >
                Thông tin cá nhân
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-5 py-3 text-[11px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <Link to="/admin" className="px-6 py-2 bg-[#d4a373] text-white text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-[#c19266] transition-colors shadow-md shadow-[#d4a373]/20">
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Header;