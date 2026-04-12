import React from 'react';
import Header from '~/components/customer/Header'
import Footer from '~/components/customer/Footer'
import { motion } from 'framer-motion'
import ScrollReveal from '~/components/common/ScrollReveal';

const DifferentStyle = () => {
    return (
        <div className="min-h-screen bg-[#FCF8F1]">
            <Header />
            
            {/* Minimalist Black Hero */}
            <div className="bg-black py-48 mt-16 flex items-center justify-center relative overflow-hidden">
                <div className="container mx-auto text-center px-4 relative z-10">
                    <ScrollReveal>
                        <h1 className="text-6xl md:text-[8rem] font-black uppercase text-white tracking-tighter italic leading-none mb-6">
                            Phong Cách <br /> <span className="text-[#D2B48C]">Khác Biệt</span>
                        </h1>
                        <div className="h-1 w-20 bg-[#D2B48C] mx-auto mb-10"></div>
                        <p className="text-[#D2B48C] font-black uppercase tracking-[0.8em] text-[10px] md:text-xs ml-[0.8em]">CAMPING CONCEPT</p>
                    </ScrollReveal>
                </div>
            </div>

            {/* Content Section Section */}
            <div className="max-w-4xl mx-auto px-6 py-40">
                <ScrollReveal>
                    <div className="text-[#D2B48C] mb-12 font-black uppercase tracking-[0.5em] text-xs text-center italic">
                        • 26 / 08 / 2021 •
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                    <div className="max-w-none text-center pb-20">
                        <h2 className="text-3xl md:text-5xl leading-tight font-black text-black uppercase tracking-tighter border-b-4 border-[#D2B48C] pb-10 inline-block">
                            Concept Cắm Trại - Phê La & Những nốt hương nguyên bản
                        </h2>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.3}>
                    <div className="max-w-none text-justify pb-20">
                        <p className="text-2xl leading-relaxed font-bold text-black/60 italic border-l-8 border-[#D2B48C] pl-10">
                            "Đi theo concept Cắm Trại - phong cách khác biệt so với các thương hiệu khác trên thị trường, Phê La đã tạo ra ấn tượng mạnh mẽ cho khách hàng nhờ những chất riêng và thiết kế độc đáo của mình."
                        </p>
                    </div>
                </ScrollReveal>

                <ScrollReveal>
                    <div className="group space-y-10">
                        <div className="overflow-hidden shadow-3xl relative transition-all duration-700 aspect-video">
                            <img src="https://phela.vn/wp-content/uploads/2021/08/phong-cach-camping-1.jpg" alt="Cắm trại" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 grayscale-[20%] hover:grayscale-0" />
                        </div>
                        <p className='py-6 text-black/30 italic text-center text-[10px] uppercase tracking-[0.4em] font-black'>Tông màu trầm ấm mang đến cảm giác thoải mái, gần gũi</p>
                        
                        <div className="space-y-10 text-black/60 font-bold leading-loose text-lg text-justify">
                            <p>
                                Phê La mong muốn tạo ra một không gian mộc mạc nhất – nơi những tâm hồn đồng điệu được giải toả áp lực, được thư giãn và được ‘chill’ cùng không gian thưởng thức mộc mạc nhất.
                            </p>
                            <p>
                                Từng góc nhỏ trong quán đều được chăm chút tỉ mỉ để khách hàng cảm nhận được sự tỉ mỉ, trân quý của Phê La dành cho nông sản Việt Nam.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Final Quote */}
                <div className="mt-40 text-center">
                    <ScrollReveal>
                        <div className="h-0.5 w-full bg-black/5 mb-20"></div>
                        <h4 className="text-2xl font-light italic text-black/20 uppercase tracking-[0.5em]">Phe La • Authentic Concept</h4>
                    </ScrollReveal>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DifferentStyle;