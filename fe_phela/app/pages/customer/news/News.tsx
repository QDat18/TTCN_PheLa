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
      <div className="min-h-screen bg-[#FCF8F1]">
        <Header />
        <div className="pt-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-[450px] shadow-sm border border-[#E5D5C5]/30"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F1] selection:bg-[#8C5A35] selection:text-white">
      <Header />

      {/* Hero Header - Deep Coffee */}
      <div className="relative bg-[#1A120B] pt-40 pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8C5A35] opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#E2B13C] opacity-5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-[#E2B13C] text-xs font-black uppercase tracking-[0.4em] mb-6 block">Kể Chuyện Phê La</span>
            <h1 className="text-5xl md:text-7xl font-black !text-[#FDF5E6] leading-none mb-8">
              Tin Tức <span className="italic font-serif text-[#E2B13C] font-normal">&</span> <br className="md:hidden" /> Sự Kiện
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-[#8C5A35]/40"></div>
              <p className="text-[#FDF5E6]/60 text-sm md:text-base max-w-md font-medium">
                Cập nhật những câu chuyện mới nhất về hành trình kết nối những tâm hồn đồng âm.
              </p>
              <div className="h-px w-12 bg-[#8C5A35]/40"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* News Content */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        {newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {newsList.map((article, index) => (
              <motion.div
                key={article.newsId}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
              >
                <Link to={`/tin-tuc/${article.newsId}`} className="group block h-full">
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-8 shadow-lg shadow-[#1A120B]/5">
                    <img
                      src={article.thumbnailUrl || 'https://placehold.co/800x500?text=Phe+La+News'}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A120B]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Category Tag */}
                    <div className="absolute top-4 left-4 bg-[#FDF5E6]/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                      <span className="text-[#1A120B] text-[10px] font-black uppercase tracking-widest">Sự kiện</span>
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-black text-[#8C5A35] uppercase tracking-widest">Hành trình Phê La</span>
                      <div className="w-1 h-1 rounded-full bg-[#E5D5C5]"></div>
                      <span className="text-[10px] font-medium text-gray-400">06.05.2024</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-[#1A120B] group-hover:text-[#8C5A35] transition-colors leading-tight line-clamp-2 italic">
                      {article.title}
                    </h2>

                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {article.summary}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-black text-[#1A120B] uppercase tracking-widest group-hover:gap-5 transition-all duration-300">
                      <span>Đọc tiếp</span>
                      <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5H19M19 5L15 1M19 5L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[40px] border border-[#E5D5C5]/30">
            <div className="text-[#8C5A35] opacity-20 mb-6">
              <svg className="mx-auto" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l4 4v10a2 2 0 0 1-2 2z" />
                <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">Chưa có bản tin nào tại đây.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default News;