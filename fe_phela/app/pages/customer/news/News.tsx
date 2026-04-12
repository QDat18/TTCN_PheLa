import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '~/components/customer/Header'
import Footer from '~/components/customer/Footer';
import { getPublicNews } from '~/services/newsService';
import { motion } from 'framer-motion';
import ScrollReveal from '~/components/common/ScrollReveal';

interface NewsArticle {
  newsId: string;
  title: string;
  summary: string;
  thumbnailUrl: string;
}

const News = () => {
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getPublicNews();
        setNewsList(data);
      } catch (error) {
        toast.error("Không thể tải tin tức. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F1]">
      <Header />

      {/* Hero Header - Black */}
      <div className="bg-black py-40 mt-16 flex items-center justify-center">
          <ScrollReveal>
            <h1 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter italic">Tin Tức <span className="text-[#D2B48C]">&</span> Sự Kiện</h1>
            <div className="h-1 w-16 bg-[#D2B48C] mx-auto mt-8"></div>
          </ScrollReveal>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* News Grid - Minimalist Minimalist */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {newsList.map((article, index) => (
            <ScrollReveal key={article.newsId} delay={index * 0.1}>
              <div className="group h-full flex flex-col bg-white shadow-xl overflow-hidden hover:-translate-y-2 transition-all duration-700">
                <Link to={`/tin-tuc/${article.newsId}`} className="block aspect-[4/3] overflow-hidden bg-black">
                  <img 
                    src={article.thumbnailUrl || 'https://placehold.co/400x300?text=News'} 
                    alt={article.title} 
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                  />
                </Link>
                <div className="p-10 flex flex-col flex-grow">
                  <Link to={`/tin-tuc/${article.newsId}`}>
                    <h2 className="text-xl font-black mb-6 text-black hover:text-[#D2B48C] transition-colors uppercase tracking-tight leading-snug line-clamp-2">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="text-black/50 text-sm leading-relaxed mb-8 line-clamp-3 font-bold uppercase tracking-widest flex-grow italic border-l-2 border-[#D2B48C]/20 pl-4">
                    {article.summary}
                  </p>
                  <Link to={`/tin-tuc/${article.newsId}`} className="inline-flex items-center gap-4 text-[10px] font-black text-black uppercase tracking-[0.3em] group/btn">
                    Xem bản tin <div className="h-px w-8 bg-[#D2B48C] group-hover/btn:w-12 transition-all"></div>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default News;