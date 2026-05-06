import React, { useState, useEffect } from 'react';
import api from '~/config/axios';
import { FaSearch, FaFilter, FaFileDownload, FaEnvelope, FaPhone, FaRobot, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { FiLock } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

interface Candidate {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string;
  cvUrl: string;
  jobPostingId: string;
  jobTitle: string;
  status: ApplicationStatus;
  applicationDate: string;
  updatedAt: string;
  aiScore?: number;
  aiEvaluation?: string;
}

const Candidate = () => {
  const { jobPostingId } = useParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [jobTitle, setJobTitle] = useState('Tất cả ứng viên');
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [unauthorized, setUnauthorized] = useState<boolean>(false);

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

    const fetchData = async () => {
      try {
        if (jobPostingId) {
          const jobResponse = await api.get(`/api/job-postings/${jobPostingId}`);
          setJobTitle(jobResponse.data.title ? `Ứng viên cho: ${jobResponse.data.title}` : 'Không tìm thấy tiêu đề');

          const candidatesResponse = await api.get(`/api/applications/job-postings/${jobPostingId}`);
          const candidatesWithJobTitle = candidatesResponse.data.map((candidate: any) => ({
            ...candidate,
            jobTitle: jobResponse.data.title
          }));
          setCandidates(candidatesWithJobTitle);
        } else {
          const response = await api.get('/api/applications');
          setCandidates(response.data || []);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        toast.error('Có lỗi khi tải dữ liệu');
      }
    };
    fetchData();
  }, [jobPostingId, user, authLoading, navigate]);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || candidate.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Chờ xử lý</span>;
      case ApplicationStatus.REVIEWED:
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Đã xem</span>;
      case ApplicationStatus.ACCEPTED:
        return <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Chấp nhận</span>;
      case ApplicationStatus.REJECTED:
        return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Từ chối</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      if (!jobPostingId) {
        await api.patch(`/api/applications/${applicationId}/status`, { status: newStatus });
      } else {
        await api.patch(
          `/api/job-postings/${jobPostingId}/applications/${applicationId}/status?status=${newStatus}`
        );
      }

      setCandidates(candidates.map(candidate =>
        candidate.applicationId === applicationId ? { ...candidate, status: newStatus } : candidate
      ));
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Có lỗi khi cập nhật trạng thái');
    }
  };

  const handleAiScreening = async (applicationId: string) => {
    setScreeningId(applicationId);
    try {
      const response = await api.post(`/api/applications/${applicationId}/ai-screen`);
      const { aiScore, aiEvaluation } = response.data;
      
      setCandidates(candidates.map(candidate =>
        candidate.applicationId === applicationId ? { ...candidate, aiScore, aiEvaluation } : candidate
      ));
      toast.success('AI Screening hoàn tất!');
    } catch (error) {
      console.error('AI Screening error:', error);
      toast.error('AI Screening thất bại. Vui lòng kiểm tra lại file CV (chỉ hỗ trợ PDF).');
    } finally {
      setScreeningId(null);
    }
  };

  const getAiScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const parseEvaluation = (evalString: string | undefined) => {
    if (!evalString) return null;
    try {
      return JSON.parse(evalString);
    } catch (e) {
      return { summary: evalString };
    }
  };

  const downloadCV = async (applicationId: string, fullName: string) => {
    try {
      const response = await api.get(`/api/cv/download/${applicationId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CV_${fullName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Không thể tải CV');
    }
  };

  const sendEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C5A35]"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-primary">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 font-primary">
            <FiLock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Truy cập bị từ chối</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên để được cấp quyền.
          </p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-[#8C5A35] hover:bg-[#6D4428] transition-all"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-[#FCF8F1] min-h-screen font-primary">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#2C1E16] uppercase tracking-tight">Quản lý ứng viên</h1>
            <p className="text-[#8C5A35] font-medium mt-1">{jobTitle}</p>
          </div>
          {jobPostingId && (
            <Link
              to="/admin/candidates"
              className="px-6 py-2.5 bg-white text-[#8C5A35] border border-[#8C5A35] rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#8C5A35] hover:text-white transition-all shadow-sm"
            >
              Xem tất cả ứng viên
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#E5D5C5]/50 overflow-hidden mb-8">
          <div className="p-6 border-b border-[#E5D5C5]/30 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaSearch className="text-[#8C5A35]/50" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  className="pl-10 pr-4 py-2.5 w-full bg-white border border-[#E5D5C5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5A35]/20 focus:border-[#8C5A35] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center text-xs font-bold text-[#8C5A35] uppercase tracking-wider">
                  <FaFilter className="mr-2" /> Lọc:
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-[#E5D5C5] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8C5A35]/20 transition-all cursor-pointer"
                >
                  <option value="all">TẤT CẢ TRẠNG THÁI</option>
                  <option value={ApplicationStatus.PENDING}>CHỜ XỬ LÝ</option>
                  <option value={ApplicationStatus.REVIEWED}>ĐÃ XEM</option>
                  <option value={ApplicationStatus.ACCEPTED}>CHẤP NHẬN</option>
                  <option value={ApplicationStatus.REJECTED}>TỪ CHỐI</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FDF5E6] border-b border-[#E5D5C5]">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-[#8C5A35] uppercase tracking-widest">Ứng viên</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">AI Screening</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-[#8C5A35] uppercase tracking-widest whitespace-nowrap">Vị trí ứng tuyển</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-[#8C5A35] uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-[#8C5A35] uppercase tracking-widest">CV</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-[#8C5A35] uppercase tracking-widest">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => {
                    const evaluation = parseEvaluation(candidate.aiEvaluation);
                    return (
                      <React.Fragment key={candidate.applicationId}>
                        <tr className="hover:bg-orange-50/20 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="text-sm font-black text-[#2C1E16]">{candidate.fullName}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5 flex flex-col sm:flex-row sm:gap-4">
                              <span className="flex items-center"><FaEnvelope className="mr-1.5 text-[#8C5A35]/50" /> {candidate.email}</span>
                              <span className="flex items-center"><FaPhone className="mr-1.5 text-[#8C5A35]/50" /> {candidate.phone}</span>
                            </div>
                            <div className="text-[10px] text-[#8C5A35] mt-1.5 font-bold uppercase tracking-tighter">Ngày nộp: {formatDate(candidate.applicationDate)}</div>
                          </td>
                          <td className="px-6 py-5">
                            {candidate.aiScore !== null && candidate.aiScore !== undefined ? (
                              <div className="flex flex-col gap-1.5">
                                <div className={`flex items-center justify-between w-24 px-2 py-1 rounded-lg border text-[11px] font-black ${getAiScoreColor(candidate.aiScore)}`}>
                                  <FaRobot className="mr-1" />
                                  <span>{candidate.aiScore}/100</span>
                                </div>
                                <button 
                                  onClick={() => setSelectedEvaluation(selectedEvaluation?.id === candidate.applicationId ? null : { id: candidate.applicationId, ...evaluation })}
                                  className="text-[10px] font-bold text-[#8C5A35] hover:underline flex items-center gap-1"
                                >
                                  {selectedEvaluation?.id === candidate.applicationId ? 'Ẩn chi tiết' : 'Xem phân tích'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAiScreening(candidate.applicationId)}
                                disabled={screeningId === candidate.applicationId}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#8C5A35]/30 text-[10px] font-black uppercase text-[#8C5A35] hover:bg-[#8C5A35] hover:text-white transition-all ${screeningId === candidate.applicationId ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {screeningId === candidate.applicationId ? (
                                  <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span> ĐANG CHẤM...</>
                                ) : (
                                  <><FaRobot /> CHẤM ĐIỂM AI</>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-xs font-bold text-[#2C1E16] max-w-[150px] truncate">{candidate.jobTitle}</div>
                            <div className="text-[10px] text-gray-400 mt-1 uppercase">ID: {candidate.jobPostingId}</div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {getStatusBadge(candidate.status)}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {candidate.cvUrl ? (
                              <button
                                onClick={() => downloadCV(candidate.applicationId, candidate.fullName)}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FDF5E6] text-[#8C5A35] hover:bg-[#8C5A35] hover:text-white transition-all shadow-sm"
                                title="Tải xuống CV (PDF)"
                              >
                                <FaFileDownload />
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold uppercase">MISSING CV</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-2 items-center">
                              <select
                                value={candidate.status}
                                onChange={(e) => handleStatusChange(candidate.applicationId, e.target.value as ApplicationStatus)}
                                className="w-full bg-white border border-[#E5D5C5] rounded-lg px-2 py-1.5 text-[10px] font-bold focus:outline-none hover:border-[#8C5A35] transition-all cursor-pointer"
                              >
                                <option value={ApplicationStatus.PENDING}>CHỜ XỬ LÝ</option>
                                <option value={ApplicationStatus.REVIEWED}>ĐÃ XEM</option>
                                <option value={ApplicationStatus.ACCEPTED}>CHẤP NHẬN</option>
                                <option value={ApplicationStatus.REJECTED}>TỪ CHỐI</option>
                              </select>
                              <button
                                onClick={() => sendEmail(candidate.email)}
                                className="w-full px-3 py-1.5 bg-[#FDF5E6] text-[#8C5A35] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#8C5A35] hover:text-white transition-all"
                              >
                                LIÊN HỆ EMAIL
                              </button>
                            </div>
                          </td>
                        </tr>
                        {selectedEvaluation?.id === candidate.applicationId && (
                          <tr className="bg-[#FDF5E6]/30 animate-fade-in">
                            <td colSpan={6} className="px-8 py-6 border-b border-[#E5D5C5]/30">
                              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5D5C5]/50">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-[#8C5A35] text-white flex items-center justify-center">
                                    <FaRobot size={14} />
                                  </div>
                                  <h3 className="text-sm font-black text-[#2C1E16] uppercase tracking-wider">AI Phê La - Phân tích chi tiết</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                  <div className="space-y-4">
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                      <div className="flex items-center gap-2 text-green-700 font-black text-xs uppercase mb-2">
                                        <FaCheckCircle /> Ưu điểm / Điểm mạnh
                                      </div>
                                      <ul className="list-disc list-inside text-xs text-green-800 space-y-1.5 leading-relaxed font-medium">
                                        {evaluation?.strengths?.map((s: string, idx: number) => <li key={idx}>{s}</li>) || <li>Ứng viên có kỹ năng nền tảng tốt.</li>}
                                      </ul>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                      <div className="flex items-center gap-2 text-red-700 font-black text-xs uppercase mb-2">
                                        <FaExclamationCircle /> Điểm cần cân nhắc
                                      </div>
                                      <ul className="list-disc list-inside text-xs text-red-800 space-y-1.5 leading-relaxed font-medium">
                                        {evaluation?.weaknesses?.map((w: string, idx: number) => <li key={idx}>{w}</li>) || <li>Chưa thấy nhiều kinh nghiệm thực chiến ở mảng này.</li>}
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="p-5 bg-[#FDF5E6] rounded-xl border border-[#E5D5C5]">
                                      <h4 className="text-[11px] font-black text-[#8C5A35] uppercase tracking-widest mb-3">Tóm tắt & Đánh giá</h4>
                                      <p className="text-xs text-[#2C1E16] leading-relaxed italic font-medium">
                                        "{evaluation?.summary || evaluation?.recommendation || 'AI đánh giá ứng viên này có tiềm năng phù hợp với môi trường Phê La.'}"
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gợi ý từ AI:</span>
                                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${candidate.aiScore! >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {evaluation?.recommendation || (candidate.aiScore! >= 70 ? 'Nên phỏng vấn' : 'Cần xem xét thêm')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <FaSearch size={40} className="mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">Không tìm thấy ứng viên nào phù hợp</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-gray-50/50 border-t border-[#E5D5C5]/20 flex justify-between items-center text-[10px] font-black text-[#8C5A35] uppercase tracking-widest">
            <span>Hiển thị {filteredCandidates.length} ứng viên</span>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-white border border-[#E5D5C5] rounded hover:bg-[#8C5A35] hover:text-white transition-all disabled:opacity-30" disabled>Trước</button>
               <button className="px-3 py-1 bg-white border border-[#E5D5C5] rounded hover:bg-[#8C5A35] hover:text-white transition-all">Sau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Candidate;