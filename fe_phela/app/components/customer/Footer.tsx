import React from 'react';
import { Link } from 'react-router-dom';
import logo from "../../assets/images/logo.png";
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="w-full bg-[#2C1E16] text-[#FCF8F1] py-24 pb-12 border-t border-[#2C1E16]">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-20">

                {/* Column 1: Logo */}
                <div className="flex flex-col items-center md:items-start justify-center">
                    <Link to="/" className="block group">
                        <img
                            src={logo}
                            alt="Phê La"
                            className="h-24 w-auto filter drop-shadow-lg brightness-[2] transition-transform group-hover:scale-105 duration-500"
                        />
                    </Link>
                </div>

                {/* Column 2: About Us & Contact */}
                <div className="flex flex-col space-y-12">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 text-[#C2956E]">Về chúng tôi</h3>
                        <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-[#FCF8F1]/70">
                            <li><Link to="/store" className="hover:text-white transition-colors">Cửa hàng</Link></li>
                            <li><Link to="/about-us" className="hover:text-white transition-colors">Về Phê La</Link></li>
                            <li><Link to="/store" className="hover:text-white transition-colors">Hệ thống cửa hàng</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 text-[#C2956E]">Địa chỉ liên hệ</h3>
                        <ul className="space-y-6 text-[10px] uppercase font-bold tracking-widest text-[#FCF8F1]/70 leading-relaxed">
                            <li className="flex gap-4">
                                <FaMapMarkerAlt className="text-sm mt-1 shrink-0 text-[#8C5A35]" />
                                <span>Trụ sở chính: 289 Đinh Bộ Lĩnh, P. 26, Q. Bình Thạnh, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex gap-4">
                                <FaEnvelope className="text-sm mt-1 shrink-0 text-[#8C5A35]" />
                                <Link to="mailto:cskh@phela.vn" className="hover:text-white">cskh@phela.vn</Link>
                            </li>
                            <li className="flex gap-4">
                                <FaPhoneAlt className="text-sm mt-1 shrink-0 text-[#8C5A35]" />
                                <span>1900 3013 (8h30 - 22h)</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Column 3: Newsletter & Social */}
                <div className="flex flex-col space-y-12">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 text-[#C2956E]">Nhận thông tin từ Phê La</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#FCF8F1]/70 leading-relaxed mb-6">
                            Đăng ký ngay để nhận những nốt hương đặc sản mới nhất từ chúng tôi.
                        </p>
                        <div className="relative flex items-center bg-[#FCF8F1] rounded-full p-1.5 shadow-lg border border-[#E5D5C5]/20 focus-within:border-[#8C5A35] transition-colors">
                            <input
                                type="email"
                                placeholder="NHẬP EMAIL CỦA BẠN..."
                                className="w-full bg-transparent px-5 py-3 text-[10px] font-black text-[#2C1E16] focus:outline-none placeholder:text-[#2C1E16]/40"
                            />
                            <button className="bg-[#8C5A35] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#2C1E16] transition-colors shadow-md">Gửi</button>
                        </div>
                    </div>
                    <div>
                        {/* Social Icons */}
                        <div className="flex space-x-5">
                            <Link to="#" className="w-10 h-10 border border-[#FCF8F1]/20 rounded-full flex items-center justify-center text-lg text-[#FCF8F1]/80 hover:bg-[#8C5A35] hover:text-white hover:border-[#8C5A35] transition-all"><FaFacebook /></Link>
                            <Link to="#" className="w-10 h-10 border border-[#FCF8F1]/20 rounded-full flex items-center justify-center text-lg text-[#FCF8F1]/80 hover:bg-[#8C5A35] hover:text-white hover:border-[#8C5A35] transition-all"><FaInstagram /></Link>
                            <Link to="#" className="w-10 h-10 border border-[#FCF8F1]/20 rounded-full flex items-center justify-center text-lg text-[#FCF8F1]/80 hover:bg-[#8C5A35] hover:text-white hover:border-[#8C5A35] transition-all"><FaYoutube /></Link>
                            <Link to="#" className="w-10 h-10 border border-[#FCF8F1]/20 rounded-full flex items-center justify-center text-lg text-[#FCF8F1]/80 hover:bg-[#8C5A35] hover:text-white hover:border-[#8C5A35] transition-all"><FaTiktok /></Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright Strip */}
            <div className="max-w-7xl mx-auto mt-20 border-t border-[#FCF8F1]/10 pt-8 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FCF8F1]/40 italic">
                    © Phe La 2026. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;