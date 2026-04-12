import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { getLatestActiveBanners } from '~/services/bannerService';
import Header from '~/components/customer/Header'
import Footer from '~/components/customer/Footer'
import home from '~/assets/images/home.jpg';
import ChatWidget from '~/components/customer/ChatWidget';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '~/components/common/ScrollReveal';

interface Banner {
    bannerId: string;
    imageUrl: string;
}

const Home = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data: Banner[] = await getLatestActiveBanners();
                setBanners(data.filter(banner => banner.imageUrl)); 
            } catch (error) {
                console.error("Failed to fetch banners:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    const nextBanner = () => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    };

    useEffect(() => {
        if (banners.length > 1) {
            const timer = setInterval(nextBanner, 5000);
            return () => clearInterval(timer);
        }
    }, [banners]);

    const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

    return (
        <div className="min-h-screen bg-[#FCF8F1]">
            <Header />
            <ChatWidget />
            
            {/* Hero Slider Section - Full Height */}
            <div className="relative w-full h-[90vh] overflow-hidden bg-black">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="loading"
                            className="absolute inset-0 flex items-center justify-center bg-black"
                        >
                             <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                        </motion.div>
                    ) : currentBanner ? (
                        <motion.div
                            key={currentBanner.bannerId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-cover bg-center scale-105"
                            style={{ backgroundImage: `url(${currentBanner.imageUrl})` }}
                        >
                             {/* Minimalist Dark Overlay */}
                            <div className="absolute inset-0 bg-black/40" />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
                    <ScrollReveal>
                        <h1 className="text-white text-6xl md:text-9xl font-black tracking-[-0.05em] mb-4 uppercase italic drop-shadow-2xl">
                             Phê La
                        </h1>
                        <div className="h-0.5 w-16 bg-[#D2B48C] mx-auto mb-6"></div>
                        <p className="text-white/80 text-[10px] md:text-xs tracking-[1em] font-black uppercase drop-shadow-lg ml-[1em]">
                             Nốt Hương Đặc Sản
                        </p>
                    </ScrollReveal>
                </div>
            </div>

            {/* Promotional Voucher Banner */}
            <div className="bg-[#FCF8F1] py-12 md:py-20 border-b border-[#E5D5C5]">
                <div className="max-w-7xl mx-auto px-6">
                    <ScrollReveal>
                        <div className="relative overflow-hidden bg-[#2C1E16] rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C5A35]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#8C5A35]/20 transition-all duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8C5A35]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                            <div className="relative z-10 flex-1">
                                <span className="inline-flex items-center gap-2 text-[#8C5A35] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                    <div className="w-8 h-px bg-[#8C5A35]"></div> Special Offer
                                </span>
                                <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                                    Ưu đãi <span className="text-[#8C5A35]">Độc Quyền</span> <br />Hôm Nay Tại Phê La
                                </h2>
                                <p className="text-white/60 text-sm font-medium max-w-md mb-8">
                                    Nhận ngay những mã giảm giá đặc biệt để trải nghiệm những nốt hương trà đặc sản tinh túy nhất.
                                </p>
                                <button 
                                    onClick={() => navigate('/khuyen-mai')}
                                    className="bg-[#FCF8F1] text-[#2C1E16] px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#8C5A35] hover:text-white transition-all duration-300 shadow-xl shadow-black/20"
                                >
                                    Khám phá ngay
                                </button>
                            </div>

                            <div className="relative z-10 w-full md:w-auto">
                                {/* Cinema Ticket Style Mini Card */}
                                <div className="bg-[#FCF8F1] p-1 rounded-2xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="border-2 border-dashed border-[#2C1E16]/20 rounded-xl p-4 flex gap-4 bg-white">
                                        <div className="w-16 h-16 bg-[#2C1E16] rounded-lg flex flex-col items-center justify-center text-white">
                                            <span className="text-lg font-black leading-none">20%</span>
                                            <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">OFF</span>
                                        </div>
                                        <div className="flex-1 pr-4">
                                            <h3 className="text-[#2C1E16] text-sm font-black uppercase tracking-tight mb-1">Mã Chào Bạn Mới</h3>
                                            <p className="text-[#5C4D43] text-[10px] font-medium leading-tight mb-2">Giảm giá 20% cho đơn hàng đầu tiên của bạn.</p>
                                            <div className="inline-block bg-[#FCF8F1] border border-[#E5D5C5] px-2 py-1 rounded text-[10px] font-black tracking-widest text-[#2C1E16]">
                                                PHELA2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Second overlapping card */}
                                <div className="hidden lg:block absolute -bottom-6 -right-6 bg-white p-1 rounded-2xl shadow-xl -rotate-6 group-hover:rotate-0 transition-transform duration-700 delay-75">
                                    <div className="border-2 border-dashed border-[#2C1E16]/10 rounded-xl p-3 flex gap-3 bg-[#FCF8F1]">
                                        <div className="w-10 h-10 bg-[#8C5A35] rounded-lg flex flex-col items-center justify-center text-white">
                                            <span className="text-xs font-black">FS</span>
                                        </div>
                                        <div className="pr-2">
                                            <h3 className="text-[#2C1E16] text-[10px] font-black uppercase">FREESHIP</h3>
                                            <p className="text-[#5C4D43] text-[8px] font-medium">Cho đơn từ 50K</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
            
            {/* Main Feature Section: PHÊ LA & NHỮNG ĐIỀU KHÁC BIỆT */}
            <div className="max-w-7xl mx-auto px-6 py-40">
                <ScrollReveal>
                    <div className="text-center mb-32">
                        <h2 className="text-4xl md:text-6xl font-black text-black mb-8 uppercase tracking-tighter leading-none">Phê La <span className="text-[#D2B48C]">&</span> Những Điều Khác Biệt</h2>
                        <div className="flex justify-center items-center gap-4">
                             <div className="h-px w-12 bg-black/10"></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/30">Since 2024</span>
                             <div className="h-px w-12 bg-black/10"></div>
                        </div>
                    </div>
                </ScrollReveal>
                
                {/* Story Block 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center mb-40">
                    <div className="lg:col-span-5 space-y-12">
                        <ScrollReveal>
                            <h3 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight leading-tight">Câu Chuyện <br /> <span className="text-[#D2B48C]">Thương Hiệu</span></h3>
                            <p className="text-black/60 leading-relaxed text-lg font-bold italic border-l-4 border-[#D2B48C] pl-8">
                                "Phê La luôn trân quý, nâng niu những giá trị Nguyên Bản ở mỗi vùng đất mà chúng tôi đi qua, nơi tâm hồn được đồng điệu với thiên nhiên, với nỗi vất vả nhọc nhằn của người nông dân."
                            </p>
                            <p className="text-black/40 text-sm leading-loose uppercase tracking-widest font-bold">
                                Chúng tôi sẵn sàng viết tiếp câu chuyện Đánh thức những nốt hương đặc sản của nông sản Việt Nam vươn ra thế giới.
                            </p>
                            <Link 
                                to="/product" 
                                className="inline-block bg-[#D2B48C] text-white px-12 py-5 rounded-sm font-black text-[10px] tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl shadow-[#D2B48C]/20 hover:-translate-y-1"
                            >
                                Khám phá ngay
                            </Link>
                        </ScrollReveal>
                    </div>
                    
                    <div className="lg:col-span-7">
                        <ScrollReveal delay={0.4}>
                            <div className="relative aspect-[4/3] overflow-hidden shadow-2xl">
                                <img 
                                    src={home} 
                                    alt="Phê La" 
                                    className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
                                />
                                <div className="absolute inset-0 border-[20px] border-white/10 pointer-events-none"></div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* Story Block 2: Alternating Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center flex-row-reverse">
                    <div className="lg:col-span-7 order-2 lg:order-1">
                        <ScrollReveal>
                            <div className="aspect-video bg-black overflow-hidden shadow-2xl relative">
                                <img 
                                    src="https://phela.vn/wp-content/uploads/2021/08/DSC09515.jpg" 
                                    alt="Cắm trại Phê La" 
                                    className="w-full h-full object-cover brightness-75 hover:brightness-100 transition-all duration-1000"
                                />
                                <div className="absolute bottom-8 left-8 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Camping Concept</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                    <div className="lg:col-span-5 order-1 lg:order-2 space-y-12 lg:pl-10">
                        <ScrollReveal delay={0.3}>
                            <h3 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight leading-tight">Phong Cách <br /> <span className="text-[#D2B48C]">Camping</span></h3>
                            <p className="text-black/60 leading-relaxed text-lg font-bold">
                                Phê La đi theo concept Cắm Trại - phong cách khác biệt độc đáo, là nơi bạn được giải toả áp lực, được thư giãn và được ‘chill’ cùng không gian thưởng thức mộc mạc nhất.
                            </p>
                            <Link 
                                to="/different-style" 
                                className="inline-block border-b-2 border-[#D2B48C] text-black pb-2 font-black text-[10px] tracking-[0.3em] uppercase hover:text-[#D2B48C] transition-all"
                            >
                                Tìm hiểu phong cách
                            </Link>
                        </ScrollReveal>
                    </div>
                </div>
            </div>

            {/* Subtle Tagline Section */}
            <div className="w-full py-40 bg-white text-center">
                 <ScrollReveal>
                    <span className="text-[#D2B48C] text-[10px] font-black uppercase tracking-[1em] mb-8 block">Authentic Experience</span>
                    <h4 className="text-4xl md:text-6xl font-light italic text-black/10 uppercase tracking-tighter">Phê La • Tự hào nông sản Việt</h4>
                 </ScrollReveal>
            </div>

            <Footer />
        </div>
    );
};

export default Home;
