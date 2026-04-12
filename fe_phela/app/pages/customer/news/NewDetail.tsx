import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '~/components/customer/Header'
import Footer from '~/components/customer/Footer';
import { getPublicNewsById } from '~/services/newsService';
import { motion } from 'framer-motion';
import ScrollReveal from '~/components/common/ScrollReveal';

const NewDetail = () => {
    const { newsId } = useParams<{ newsId: string }>();
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (newsId) {
            const fetchDetail = async () => {
                try {
                    const data = await getPublicNewsById(newsId);
                    setArticle(data);
                } catch (error) {
                    toast.error("Không tìm thấy bài viết.");
                } finally {
                    setLoading(false);
                }
            };
            fetchDetail();
        }
    }, [newsId]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCF8F1]">
                <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Bản tin không tồn tại.</h1>
                <Link to="/news" className="mt-8 text-[#D2B48C] font-black uppercase tracking-widest text-xs">Trở lại bản tin</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FCF8F1]">
            <Header />

            {/* Banner Section - Full Width Minimalist */}
            <div className="relative h-[60vh] md:h-[80vh] overflow-hidden mt-[70px]">
                <div 
                    className="absolute inset-0 bg-cover bg-center grayscale-[20%] scale-105"
                    style={{ backgroundImage: `url(${article.thumbnailUrl || 'https://placehold.co/1200x600?text=News+Banner'})` }}
                ></div>
                <div className="absolute inset-0 bg-black/40"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <ScrollReveal>
                        <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter italic drop-shadow-2xl leading-none mb-10">
                            {article.title}
                        </h1>
                        <div className="flex items-center gap-6 justify-center text-[#D2B48C] font-black uppercase tracking-[0.4em] text-[10px] border-y border-white/10 py-6 px-12">
                            <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span className="w-2 h-2 bg-[#D2B48C] rounded-full"></span>
                            <span>Phê La News</span>
                        </div>
                    </ScrollReveal>
                </div>
            </div>

            {/* Content Section - High Elegance Typography */}
            <div className="max-w-4xl mx-auto px-6 py-40">
                <ScrollReveal>
                    <div className="bg-white p-12 md:p-24 shadow-3xl">
                        {/* Article Content - High Contrast Black on White */}
                        <div className="prose prose-xl prose-black max-w-none text-black/80 font-bold leading-relaxed space-y-12 whitespace-pre-wrap text-justify">
                             <p className="text-[#D2B48C] text-[10px] font-black uppercase tracking-[0.8em] mb-10">• Authentic Story •</p>
                             {article.content}
                        </div>
                        
                        {/* Article Footer */}
                        <div className="mt-32 pt-16 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-black/30">
                                <span className="w-12 h-px bg-black/20" />
                                Phe La • Tự hào nông sản Việt
                            </div>
                            <div className="flex gap-6">
                                <Link to="/news" className="text-[10px] font-black uppercase tracking-[0.2em] text-black hover:text-[#D2B48C] transition-all">Quay lại bản tin</Link>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            <Footer />
        </div>
    );
};

export default NewDetail;