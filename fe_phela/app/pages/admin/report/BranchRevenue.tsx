import React, { useState, useEffect } from 'react';
import api from '~/config/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';
import { FiLock, FiDownload, FiBarChart2, FiPieChart, FiList } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface BranchRevenue {
  branchName: string;
  totalRevenue: number;
  orderCount: number;
}

type DisplayType = 'charts' | 'table';

const BranchRevenue = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<BranchRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [displayType, setDisplayType] = useState<DisplayType>('charts');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!user || !allowedRoles.includes(user.role)) {
      setUnauthorized(true);
      toast.error('Bạn không có quyền truy cập trang này', {
        onClose: () => navigate('/admin/dashboard')
      });
      return;
    }

    fetchData();
  }, [period, authLoading, navigate, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/dashboard/branch-revenue?period=${period}`);
      setData(response.data);
    } catch (error: any) {
      console.error(`Failed to fetch branch revenue:`, error);
      toast.error('Không thể tải dữ liệu chi nhánh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await api.get(`/api/dashboard/export-branch-revenue?period=${period}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ThongKeChiNhanh_${period}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Không thể xuất file Excel.');
    } finally {
      setExportLoading(false);
    }
  };

  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatPeriodLabel = (p: string) => {
    switch (p) {
      case 'day': return 'Hôm nay';
      case 'week': return 'Tuần này';
      case 'month': return 'Tháng này';
      case 'quarter': return 'Quý này';
      case 'year': return 'Năm nay';
      default: return p;
    }
  };

  const barChartData = {
    labels: data.map(d => d.branchName),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: data.map(d => d.totalRevenue),
        backgroundColor: 'rgba(212, 163, 115, 0.8)',
        borderColor: '#d4a373',
        borderWidth: 1,
      }
    ],
  };

  const doughnutData = {
    labels: data.map(d => d.branchName),
    datasets: [
      {
        data: data.map(d => d.totalRevenue),
        backgroundColor: [
          '#d4a373', '#2C1E16', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
        ],
        borderWidth: 1,
      }
    ],
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="py-8 text-center">
        <FiLock className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Truy cập bị từ chối</h2>
        <button onClick={() => navigate('/admin/dashboard')} className="mt-4 px-4 py-2 bg-[#2C1E16] text-white rounded-lg">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Thống kê theo Chi nhánh</h1>
          <p className="text-gray-500 mt-1">Phân tích hiệu quả kinh doanh của từng cơ sở</p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exportLoading || data.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiDownload className="w-5 h-5" />
          )}
          <span>Xuất Excel Phân Tích</span>
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {['day', 'week', 'month', 'quarter', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              period === p
              ? 'bg-[#d4a373] text-white shadow-md transform scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {formatPeriodLabel(p)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng chi nhánh</h3>
            <p className="text-3xl font-black text-[#2C1E16]">{data.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center border-l-4 border-l-[#d4a373]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Chi nhánh dẫn đầu</h3>
            <p className="text-3xl font-black text-[#d4a373]">
                {data.length > 0 ? data.reduce((prev, curr) => prev.totalRevenue > curr.totalRevenue ? prev : curr).branchName : '---'}
            </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center border-l-4 border-l-[#2C1E16]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng doanh thu kỳ này</h3>
            <p className="text-3xl font-black text-[#2C1E16]">
                {formatRevenue(data.reduce((sum, item) => sum + item.totalRevenue, 0))}
            </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                    <FiBarChart2 className="text-[#d4a373] w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Dữ liệu chi tiết</h2>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setDisplayType('charts')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${displayType === 'charts' ? 'bg-white text-[#d4a373] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FiPieChart className="inline mr-2" /> Biểu đồ
                </button>
                <button 
                  onClick={() => setDisplayType('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${displayType === 'table' ? 'bg-white text-[#d4a373] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FiList className="inline mr-2" /> Bảng
                </button>
            </div>
        </div>

        <div className="p-6">
            {loading ? (
                <div className="flex justify-center items-center h-80">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#d4a373]"></div>
                </div>
            ) : data.length > 0 ? (
                displayType === 'charts' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="h-80">
                            <h4 className="text-center text-sm font-bold text-gray-400 uppercase mb-4">So sánh doanh thu</h4>
                            <Bar 
                              data={barChartData} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } }
                              }} 
                            />
                        </div>
                        <div className="h-80 flex flex-col items-center">
                            <h4 className="text-center text-sm font-bold text-gray-400 uppercase mb-4">Tỷ trọng doanh thu</h4>
                            <div className="h-full w-full max-w-[300px]">
                                <Doughnut 
                                    data={doughnutData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'right' } }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Chi nhánh</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Doanh thu</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Đơn hàng</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Trung bình/Đơn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.sort((a, b) => b.totalRevenue - a.totalRevenue).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700">{item.branchName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-[#d4a373]">{formatRevenue(item.totalRevenue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{item.orderCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 italic">
                                            {item.orderCount > 0 ? formatRevenue(item.totalRevenue / item.orderCount) : '0 ₫'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <FiBarChart2 size={48} className="mb-4 opacity-20" />
                    <p>Không có dữ liệu kinh doanh trong khoảng thời gian này</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BranchRevenue;
