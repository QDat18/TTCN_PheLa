import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiPackage, FiShoppingBag, FiDollarSign,
  FiUsers, FiTrendingUp, FiTrendingDown,
  FiActivity, FiCalendar, FiExternalLink, FiBarChart2,
  FiPlus, FiTag, FiClock, FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '~/config/axios';
import { getLatestActiveBanners } from '~/services/bannerService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Banner {
  bannerId: string;
  imageUrl: string;
}

interface Order {
  orderId: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const HomeAdmin = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [summaryRes, ordersRes, bannersRes] = await Promise.allSettled([
          api.get('/api/dashboard/summary'),
          api.get('/api/order/status/PENDING'),
          getLatestActiveBanners()
        ]);

        const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value.data : null;
        const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value.data : null;
        const bannersData = bannersRes.status === 'fulfilled' ? bannersRes.value : [];

        if (summaryData) {
          setSummary(summaryData);

          // Update Chart Data
          if (summaryData.weeklyRevenueData) {
            setRevenueChartData({
              labels: summaryData.weeklyRevenueData.map((d: any) => {
                const date = new Date(d.date);
                return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
              }),
              datasets: [
                {
                  fill: true,
                  label: 'Doanh thu',
                  data: summaryData.weeklyRevenueData.map((d: any) => d.revenue),
                  borderColor: '#d4a373',
                  backgroundColor: 'rgba(212, 163, 115, 0.1)',
                  tension: 0.4,
                  pointRadius: 4,
                  pointBackgroundColor: '#d4a373',
                },
              ],
            });
          }
        }

        setBanners(bannersData.filter((banner: any) => banner.imageUrl));

        if (ordersData) {
          const sorted = Array.isArray(ordersData) ? ordersData : (ordersData.content || []);
          setRecentOrders(sorted.slice(0, 5));
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + " tỷ";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + " tr";
    return value.toLocaleString('vi-VN') + "đ";
  };

  const stats = [
    {
      id: 1,
      label: "Tổng Sản phẩm",
      value: summary?.totalProducts?.toLocaleString() || "0",
      trend: "Hệ thống",
      isUp: true,
      icon: FiPackage,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      id: 2,
      label: "Đơn mới (Ngày)",
      value: summary?.totalOrdersDay?.toLocaleString() || "0",
      trend: "Hôm nay",
      isUp: true,
      icon: FiShoppingBag,
      color: "bg-amber-500/10 text-amber-600"
    },
    {
      id: 3,
      label: "Doanh thu tháng",
      value: formatCurrency(summary?.totalRevenueMonth || 0),
      trend: "Tháng này",
      isUp: true,
      icon: FiDollarSign,
      color: "bg-green-500/10 text-green-600"
    },
    {
      id: 4,
      label: "Nhân viên",
      value: summary?.totalStaff?.toLocaleString() || "0",
      trend: "Tổng số",
      isUp: true,
      icon: FiUsers,
      color: "bg-purple-500/10 text-purple-600"
    },
  ];

  const quickActions = [
    { label: "Thêm Sản phẩm", icon: FiPlus, color: "bg-[#2C1E16]", path: "/admin/san-pham" },
    { label: "Tạo Voucher", icon: FiTag, color: "bg-[#8C5A35]", path: "/admin/ma-giam-gia" },
    { label: "Đơn hàng mới", icon: FiClock, color: "bg-[#d4a373]", path: "/admin/don-hang" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#2C1E16] tracking-tight uppercase">Bảng điều khiển hệ thống</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Chào mừng quay trở lại! Đây là tóm tắt nhanh về hoạt động của Phê La.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#2C1E16]/10 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <FiCalendar /> Xuất báo cáo
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2C1E16] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#8C5A35] transition-colors shadow-lg shadow-[#2C1E16]/20">
              <FiActivity /> Live View
            </button>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-[#2C1E16]/5 shadow-sm h-40 flex flex-col justify-between">
                <div className="flex justify-between">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="w-24 h-3" />
                  <Skeleton className="w-32 h-8" />
                </div>
              </div>
            ))
          ) : (
            stats.map((stat) => (
              <motion.div
                key={stat.id}
                variants={itemVariants}
                className="bg-white p-6 rounded-3xl shadow-sm border border-[#2C1E16]/5 hover:shadow-xl hover:shadow-[#2C1E16]/5 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${stat.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {stat.isUp ? <FiTrendingUp /> : <FiTrendingDown />}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</h3>
                  <p className="text-3xl font-black text-[#2C1E16] mt-1">{stat.value}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold italic">
                      Cập nhật: {summary ? new Date(summary.generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                    <FiExternalLink className="text-[#d4a373] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Quick Actions & Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-black text-[#2C1E16] uppercase tracking-widest">Thao tác nhanh</h3>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => window.location.href = action.path}
                  className={`flex items-center gap-4 p-4 ${action.color} text-white rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-black/5 group`}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <action.icon size={20} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Banner Summary Info */}
            <div className="bg-[#2C1E16] rounded-3xl p-6 shadow-xl relative overflow-hidden group mt-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a373] opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
              <div className="relative z-10">
                <h3 className="text-sm font-black text-[#FCF8F1] tracking-tight mb-2 uppercase">Banners</h3>
                <p className="text-[#FCF8F1]/60 text-[10px] font-medium leading-relaxed mb-4">
                  Hiện có {banners.length} banner đang hoạt động trên hệ thống khách hàng.
                </p>
                <button
                  onClick={() => window.location.href = '/admin/banner'}
                  className="w-full py-2 bg-[#FCF8F1] text-[#2C1E16] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d4a373] hover:text-[#FCF8F1] transition-all"
                >
                  Quản lý
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-[#2C1E16]/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-[#2C1E16] uppercase tracking-widest">Doanh thu tuần qua</h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <FiCheckCircle /> Dữ liệu trực tiếp
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <Skeleton className="w-full h-full rounded-2xl" />
                </div>
              ) : revenueChartData ? (
                <div className="h-64">
                  <Line
                    data={revenueChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#2C1E16',
                          titleFont: { size: 10, weight: 'bold' },
                          bodyFont: { size: 12 },
                          padding: 12,
                          cornerRadius: 12,
                          displayColors: false,
                          callbacks: {
                            label: (context) => `Doanh thu: ${context.parsed.y.toLocaleString()}đ`
                          }
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af' }
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0,0,0,0.02)' },
                          ticks: {
                            font: { size: 10, weight: 'bold' },
                            color: '#9ca3af',
                            callback: (value) => formatCurrency(Number(value))
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <FiBarChart2 size={48} className="text-gray-200 mb-4" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Chưa có dữ liệu biểu đồ</p>
                </div>
              )}
            </div>

            {/* Recent Orders Bottom */}
            <div className="bg-white rounded-3xl p-8 border border-[#2C1E16]/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-[#2C1E16] uppercase tracking-widest">Đơn hàng mới nhất</h3>
                <button
                  onClick={() => window.location.href = '/admin/don-hang'}
                  className="text-[10px] font-black text-[#d4a373] uppercase tracking-widest hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl h-24">
                      <div className="flex gap-4">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="w-full h-3" />
                          <Skeleton className="w-1/2 h-2" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-amber-50 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/admin/don-hang?id=${order.orderId}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-[10px] text-[#2C1E16]">
                          #{order.orderCode.slice(-4)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#2C1E16] uppercase truncate max-w-[100px]">{order.customerName || 'Khách hàng'}</h4>
                          <p className="text-[10px] text-gray-400 font-bold">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#2C1E16]">{order.totalAmount.toLocaleString()}đ</p>
                        <span className="text-[8px] font-black uppercase text-amber-600 tracking-tighter">Đang chờ</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-8">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Không có đơn hàng mới</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;