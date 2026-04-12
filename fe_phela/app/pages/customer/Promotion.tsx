import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTag, FiCopy, FiCheck, FiClock, FiInfo } from 'react-icons/fi';
import Header from '~/components/customer/Header';
import Footer from '~/components/customer/Footer';
import api from '~/config/axios';
import { toast } from 'react-toastify';

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'SHIPPING';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startDate: string;
  endDate: string;
  status: string;
}

const Promotion = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveVouchers = async () => {
      try {
        const response = await api.get('/api/vouchers/active');
        if (response.data.success) {
          setVouchers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveVouchers();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatValue = (voucher: Voucher) => {
    if (voucher.type === 'PERCENTAGE') return `${voucher.value}%`;
    if (voucher.type === 'SHIPPING') return 'FREE SHIP';
    return `${voucher.value.toLocaleString()} ₫`;
  };

  return (
    <div className="min-h-screen bg-[#FCF8F1]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-[#2C1E16] uppercase tracking-tighter mb-4">
              Ưu đãi đặc quyền <span className="text-[#8C5A35]">tại Phê La</span>
            </h1>
            <p className="text-[#5C4D43] font-medium max-w-2xl mx-auto">
              Khám phá những mã giảm giá mới nhất để tận hưởng những nốt hương đặc sản với mức giá ưu đãi.
            </p>
          </motion.div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#8C5A35]/20 border-t-[#8C5A35] rounded-full animate-spin"></div>
          </div>
        ) : vouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vouchers.map((voucher, index) => (
              <motion.div
                key={voucher.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group h-full"
              >
                {/* Cinema Ticket Style Card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E5D5C5] flex h-full">
                  {/* Left Side (Value Indicator) */}
                  <div className="w-24 md:w-32 bg-[#2C1E16] flex flex-col items-center justify-center text-white p-4 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#FCF8F1] rounded-full border border-[#E5D5C5]"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-[#FCF8F1] rounded-full border border-[#E5D5C5]"></div>
                    
                    <FiTag className="text-[#8C5A35] mb-2" size={24} />
                    <span className="text-xl md:text-2xl font-black text-center leading-none mb-1">
                      {formatValue(voucher)}
                    </span>
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">OFF</span>
                  </div>

                  {/* Right Side (Details) */}
                  <div className="flex-1 p-6 flex flex-col justify-between border-l-2 border-dashed border-[#E5D5C5] relative">
                    {/* Punch hole icons for effect */}
                    <div className="absolute top-0 -left-1 -translate-y-1/2 w-2 h-4 bg-[#FCF8F1] rounded-r-full"></div>
                    <div className="absolute bottom-0 -left-1 translate-y-1/2 w-2 h-4 bg-[#FCF8F1] rounded-r-full"></div>

                    <div>
                      <h3 className="text-lg font-black text-[#2C1E16] uppercase leading-tight mb-2 tracking-tight group-hover:text-[#8C5A35] transition-colors line-clamp-2">
                        {voucher.name}
                      </h3>
                      <p className="text-xs text-[#5C4D43] font-medium mb-4 line-clamp-2">
                        {voucher.description || 'Áp dụng cho mọi đơn hàng đủ điều kiện.'}
                      </p>
                      
                      <div className="space-y-1.5 mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8C5A35] uppercase">
                          <FiClock size={12} />
                          <span>Hết hạn: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {voucher.minOrderAmount > 0 && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#5C4D43] uppercase">
                            <FiInfo size={12} />
                            <span>Đơn tối thiểu: {voucher.minOrderAmount.toLocaleString()} ₫</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#FCF8F1] border border-[#E5D5C5] px-3 py-2 rounded-lg font-black text-xs text-[#2C1E16] text-center tracking-widest break-all">
                        {voucher.code}
                      </div>
                      <button
                        onClick={() => handleCopyCode(voucher.code)}
                        className={`p-2.5 rounded-lg transition-all duration-300 shadow-sm ${
                          copiedCode === voucher.code 
                            ? 'bg-green-500 text-white shadow-green-200' 
                            : 'bg-[#2C1E16] text-white hover:bg-[#8C5A35]'
                        }`}
                        title="Sao chép mã"
                      >
                        {copiedCode === voucher.code ? <FiCheck size={18} /> : <FiCopy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E5D5C5]">
            <FiTag className="mx-auto text-[#E5D5C5] mb-4" size={48} />
            <p className="text-[#5C4D43] font-black uppercase tracking-widest">Hiện chưa có mã ưu đãi nào mới</p>
            <p className="text-sm text-[#5C4D43]/60 font-medium mt-2">Quay lại sau để cập nhật những ưu đãi sớm nhất từ Phê La nhé!</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Promotion;
