import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, isCustomerUser, type CustomerUser } from "~/AuthContext";
import api from "~/config/axios";
import {
  FiMusic,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiClock,
  FiAward,
  FiTrendingUp,
  FiChevronRight
} from "react-icons/fi";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface PointHistory {
  id: string;
  amount: number;
  type: 'EARN' | 'REDEEM' | 'REFUND';
  description: string;
  transactionDate: string;
  orderCode: string;
}

const MembershipDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const customer = isCustomerUser(user) ? user : null;

  useEffect(() => {
    const fetchData = async () => {
      if (customer?.customerId) {
        try {
          const response = await api.get(`/api/customer/history/${customer.customerId}`);
          setHistory(response.data);
          await refreshUser();
        } catch (error) {
          console.error("Error fetching point history:", error);
        } finally {
          setLoading(false);
        }
      } else if (!user) {
        setLoading(false);
      }
    };

    fetchData();
  }, [customer?.customerId]);

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'SILVER': return { name: 'Bạc', color: '#C0C0C0', next: 600 };
      case 'GOLD': return { name: 'Vàng', color: '#FFD700', next: 1000 };
      case 'DIAMOND': return { name: 'Kim Cương', color: '#E5E4E2', next: 1000 };
      default: return { name: 'Thành viên', color: '#8C5A35', next: 300 };
    }
  };

  const tierInfo = getTierInfo(customer?.membershipTier || 'DEFAULT');
  const progress = Math.min(100, ((customer?.totalAccumulatedNotes || 0) / tierInfo.next) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C5A35]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      {/* Header Section */}
      <div className="bg-[#2C1E16] text-white pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C5A35] opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 text-sm font-medium">
                <FiArrowDownLeft /> Quay lại Trang Chủ
              </Link>
              <p className="text-[#D4A373] font-medium tracking-widest mb-2 uppercase text-sm">Chương trình khách hàng thân thiết</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 !text-white" style={{ color: '#ffffff' }}>Nốt Nhạc Phê La</h1>
              <div className="flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
                <FiAward className="text-[#D4A373]" />
                <span className="font-medium">Hạng {tierInfo.name}</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl min-w-[280px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Số dư hiện tại</p>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold text-[#D4A373]">{customer?.currentNotes || 0}</span>
                    <FiMusic className="text-xl text-[#D4A373]" />
                  </div>
                </div>
                <div className="bg-[#8C5A35] p-3 rounded-2xl">
                  <FiMusic className="text-2xl text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Tiến trình nâng hạng tiếp theo</span>
                  <span className="text-[#D4A373]">{customer?.totalAccumulatedNotes || 0}/{tierInfo.next}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-[#D4A373] to-[#8C5A35]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#F0E6D2] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#F9F5F0] rounded-2xl flex items-center justify-center">
                  <FiTrendingUp className="text-[#8C5A35] text-xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Tổng tích lũy</p>
                  <p className="text-xl font-bold text-[#2C1E16]">{customer?.totalAccumulatedNotes || 0} nốt nhạc</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Bạn đã tích lũy được tổng cộng {customer?.totalAccumulatedNotes || 0} nốt nhạc kể từ khi gia nhập. Càng nhiều nốt nhạc, ưu đãi càng lớn!
              </p>
            </div>

            <div className="bg-[#8C5A35] p-8 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <FiMusic size={120} />
              </div>
              <h3 className="text-xl font-bold mb-4 italic">"Mỗi nốt nhạc, một niềm cảm hứng"</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Sử dụng nốt nhạc để thanh toán cho mọi đơn hàng. 1 nốt nhạc tương đương với 1.000đ giảm giá.
              </p>
              <button className="flex items-center gap-2 text-white font-semibold group">
                Tìm hiểu quyền lợi <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Points History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-[#F0E6D2] overflow-hidden"
          >
            <div className="p-6 border-b border-[#F0E6D2] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FiClock className="text-[#8C5A35]" />
                <h2 className="font-bold text-[#2C1E16] text-lg">Lịch sử nốt nhạc</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-[#F9F5F0] rounded-full">Gần đây</span>
            </div>

            <div className="divide-y divide-[#F9F5F0]">
              {history.length > 0 ? (
                history.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-6 hover:bg-[#FDFCFB] transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'EARN' ? 'bg-green-50 text-green-600' :
                        item.type === 'REDEEM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {item.type === 'EARN' ? <FiArrowUpRight size={20} /> : <FiArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-[#2C1E16] group-hover:text-[#8C5A35] transition-colors">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{format(new Date(item.transactionDate), "dd MMM, yyyy HH:mm")}</span>
                          {item.orderCode && (
                            <span className="text-[10px] bg-[#F9F5F0] text-[#8C5A35] font-bold px-2 py-0.5 rounded tracking-wide">#{item.orderCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${item.type === 'EARN' ? 'text-green-600' :
                        item.type === 'REDEEM' ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                        {item.type === 'EARN' ? '+' : '-'}{item.amount}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">Nốt nhạc</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-[#F9F5F0] rounded-full flex items-center justify-center mb-4">
                    <FiMusic className="text-[#8C5A35] opacity-30 text-2xl" />
                  </div>
                  <p className="text-gray-400 italic">Bạn chưa có lịch sử giao dịch nốt nhạc nào.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MembershipDashboard;
