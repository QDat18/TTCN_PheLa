import React, { useState, useEffect } from 'react';
import api from '~/config/axios';
import { FaRobot, FaSync, FaChartLine, FaBrain, FaRegCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

const AiManagement = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('lastAiSync'));
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [unauthorized, setUnauthorized] = useState<boolean>(false);

  useEffect(() => {
    if (authLoading) return;
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!user || !allowedRoles.includes(user.role)) {
      setUnauthorized(true);
      return;
    }
  }, [user, authLoading]);

  const handleSyncKnowledge = async () => {
    setIsSyncing(true);
    try {
      await api.post('/api/admin/ai/sync-knowledge');
      const now = new Date().toLocaleString('vi-VN');
      setLastSync(now);
      localStorage.setItem('lastAiSync', now);
      toast.success('Đồng bộ tri thức AI thành công!');
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Lỗi đồng bộ: ' + (error.response?.data || error.message));
    } finally {
      setIsSyncing(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C5A35]"></div></div>;

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-primary">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 font-primary">
            <FiLock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Truy cập bị từ chối</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">Bạn không có quyền truy cập trang quản trị AI.</p>
          <button onClick={() => navigate('/admin/dashboard')} className="w-full py-3 px-4 rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-[#8C5A35] hover:bg-[#6D4428] transition-all">Quay lại Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-[#FCF8F1] min-h-screen font-primary">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#2C1E16] uppercase tracking-tighter flex items-center gap-4">
            <span className="p-3 bg-[#8C5A35] text-white rounded-2xl shadow-xl shadow-[#8C5A35]/20"><FaRobot size={32} /></span>
            Quản trị Hệ thống AI
          </h1>
          <p className="text-[#8C5A35] font-bold mt-4 text-sm uppercase tracking-widest opacity-80">Nền tảng trí tuệ nhân tạo Phê La v2.0</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* AI Knowledge Base Sync Card */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#8C5A35]/5 border border-[#E5D5C5]/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <FaBrain size={180} />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-[#2C1E16] uppercase mb-4 tracking-tight">Cơ sở tri thức (Knowledge Base)</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-md">
                Bộ não của AI sử dụng dữ liệu từ danh mục sản phẩm, câu chuyện thương hiệu và chính sách dịch vụ để hỗ trợ khách hàng. Hãy đồng bộ khi có thông tin mới cập nhật.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <button
                  onClick={handleSyncKnowledge}
                  disabled={isSyncing}
                  className={`flex items-center gap-3 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 ${
                    isSyncing 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-[#8C5A35] text-white hover:bg-[#6D4428] shadow-[#8C5A35]/30'
                  }`}
                >
                  {isSyncing ? <FaSync className="animate-spin text-lg" /> : <FaSync className="text-lg" />}
                  {isSyncing ? 'Đang đồng bộ...' : 'Cập nhật tri thức ngay'}
                </button>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-[#8C5A35] uppercase tracking-widest opacity-60">Lần cuối cập nhật</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#2C1E16]">
                    <FaRegCheckCircle className="text-green-500" />
                    {lastSync || 'Chưa bao giờ'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Quick Stats */}
          <div className="space-y-6">
            <div className="bg-[#2C1E16] rounded-3xl p-8 shadow-xl text-[#FCF8F1]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#d4a373]">Trạng thái hệ thống</span>
                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
              </div>
              <div className="text-3xl font-black mb-1">ONLINE</div>
              <div className="text-[10px] opacity-60 font-medium">Hệ thống AI đang hoạt động ổn định trên Supabase Vector</div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E5D5C5]/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-50 text-[#8C5A35] rounded-xl"><FaChartLine /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tỷ lệ chính xác</span>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-black text-[#2C1E16]">94<span className="text-lg text-[#8C5A35]">%</span></div>
                <div className="text-[10px] text-green-500 font-bold mb-2">+2.4% so với tháng trước</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-sm hover:bg-white transition-all cursor-pointer">
              <h3 className="text-sm font-black text-[#8C5A35] uppercase tracking-widest mb-4">Chatbot Khách hàng</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Cấu hình tính cách (Persona) và quyền hạn dữ liệu của AI Concierge khi tương tác với khách hàng.</p>
           </div>
           <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-sm hover:bg-white transition-all cursor-pointer">
              <h3 className="text-sm font-black text-[#8C5A35] uppercase tracking-widest mb-4">Sàng lọc Tuyển dụng</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Điều chỉnh tiêu chí (Criteria) đánh giá CV và thang điểm cho các vị trí tuyển dụng khác nhau.</p>
           </div>
           <div className="bg-[#E5D5C5]/20 p-8 rounded-3xl border border-dashed border-[#8C5A35]/30 flex flex-col items-center justify-center text-center">
              <FaExclamationTriangle className="text-[#8C5A35] opacity-20 mb-3" size={32} />
              <div className="text-[10px] font-black uppercase text-[#8C5A35] opacity-40 italic">Nhiều tính năng đang phát triển</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AiManagement;
