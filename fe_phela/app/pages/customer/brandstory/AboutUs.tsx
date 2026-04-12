import React from 'react'
import Header from '~/components/customer/Header'
import Footer from '~/components/customer/Footer'
import camhung from '~/assets/images/cam-hung.jpg'
import thucong from '~/assets/images/thu-cong.jpg'
import trachnhiem from '~/assets/images/trach-nhiem.jpg'
import { motion } from 'framer-motion'
import ScrollReveal from '~/components/common/ScrollReveal'

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-[#FCF8F1]">
            <Header />

            {/* Hero Banner - Elegant Minimalist */}
            <div className="bg-black py-48 mt-16 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img src="https://phela.vn/wp-content/uploads/2021/07/HH_3783-scaled.jpg" className="w-full h-full object-cover" alt="bg" />
                </div>
                <div className="container mx-auto text-center px-4 relative z-10">
                    <ScrollReveal>
                        <h1 className="text-7xl md:text-[10rem] font-black uppercase text-white tracking-tighter italic leading-none mb-6">
                            Về <span className="text-[#D2B48C]">Phê La</span>
                        </h1>
                        <div className="h-1 w-20 bg-[#D2B48C] mx-auto mb-10"></div>
                        <p className="text-[#D2B48C] font-black uppercase tracking-[0.8em] text-[10px] md:text-xs ml-[0.8em]">Đánh thức nốt hương đặc sản</p>
                    </ScrollReveal>
                </div>
            </div>

            {/* Content Story - Alternating layout, high whitespace */}
            <div className="max-w-7xl mx-auto py-40 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40">
                    <ScrollReveal>
                        <div className="space-y-12">
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black leading-tight border-l-8 border-[#D2B48C] pl-10">
                                Hành Trình <br /> <span className="text-[#D2B48C]">Nốt Hương Đặc Sản</span>
                            </h2>
                            <p className="text-black/70 text-2xl font-bold italic leading-relaxed">
                                "Phê La luôn trân quý, nâng niu những giá trị Nguyên Bản ở mỗi vùng đất mà chúng tôi đi qua, nơi tâm hồn được đồng điệu với thiên nhiên."
                            </p>
                            <p className="text-black/40 text-sm font-bold uppercase tracking-[0.3em] leading-loose">
                                CHÚNG TÔI SẴN SÀNG VIẾT TIẾP CÂU CHUYỆN ĐÁNH THỨC NHỮNG NỐT HƯƠNG ĐẶC SẢN CỦA NÔNG SẢN VIỆT NAM VƯƠN RA THẾ GIỚI.
                            </p>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal delay={0.3}>
                        <div className="relative aspect-[4/5] bg-black overflow-hidden shadow-2xl">
                            <img 
                                src="https://phela.vn/wp-content/uploads/2021/07/HH_3783-600x400.jpg" 
                                alt="Story" 
                                className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-1000 scale-105"
                            />
                        </div>
                    </ScrollReveal>
                </div>

                {/* Mission / Vision Section - Minimalist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black/5 border border-black/5 mb-40">
                    <div className="bg-white p-20 space-y-8">
                        <ScrollReveal>
                            <span className="text-[#D2B48C] text-[10px] font-black uppercase tracking-[0.5em]">Vision</span>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-black">Tầm nhìn</h3>
                            <p className="text-black/60 font-bold leading-relaxed text-xl">
                                Mang nguồn nông sản cao cấp của Việt Nam tiếp cận gần hơn với mọi người và vươn ra thế giới.
                            </p>
                        </ScrollReveal>
                    </div>
                    <div className="bg-white p-20 space-y-8">
                        <ScrollReveal delay={0.2}>
                            <span className="text-[#D2B48C] text-[10px] font-black uppercase tracking-[0.5em]">Mission</span>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-black">Sứ mệnh</h3>
                            <p className="text-black/60 font-bold leading-relaxed text-xl">
                                Đồng hành cùng người nông dân trong quá trình sản xuất và phát triển bền vững nguồn nguyên liệu đặc sản.
                            </p>
                        </ScrollReveal>
                    </div>
                </div>

                {/* Core Values - Large Typography */}
                <div className="space-y-40">
                    <ScrollReveal>
                        <div className="text-center">
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-black mb-4">Giá Trị Cốt Lõi</h2>
                            <div className="h-0.5 w-16 bg-[#D2B48C] mx-auto"></div>
                        </div>
                    </ScrollReveal>

                    {/* Value: Thủ Công */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="order-2 lg:order-1">
                             <ScrollReveal>
                                <img src={thucong} alt="Craft" className="w-full grayscale-[20%] hover:grayscale-0 transition-all duration-700 shadow-2xl" />
                             </ScrollReveal>
                        </div>
                        <div className="order-1 lg:order-2 space-y-10">
                            <ScrollReveal delay={0.3}>
                                <h3 className="text-4xl font-black uppercase tracking-widest text-[#D2B48C]">Thủ Công</h3>
                                <p className="text-black/80 font-bold leading-relaxed text-xl italic">
                                    "Tại Phê La, sự tâm huyết, tỉ mỉ và tinh tế được thể hiện qua từng sản phẩm."
                                </p>
                                <p className="text-black/40 text-sm font-bold uppercase tracking-widest leading-loose">
                                    NHỮNG LÁ TRÀ Ô LONG ĐƯỢC THU HOẠCH VÀ SƠ CHẾ THỦ CÔNG, KẾT HỢP CÙNG VIỆC NGHIÊN CỨU VÀ SÁNG TẠO.
                                </p>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default AboutUs