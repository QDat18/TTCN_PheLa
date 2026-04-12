import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '~/components/customer/Header';
import api from '~/config/axios';
import { FiUpload, FiX, FiCheck, FiCalendar, FiDollarSign, FiBriefcase, FiMapPin } from 'react-icons/fi';

interface JobPosting {
  jobPostingId: string;
  jobCode: string;
  title: string;
  description: string;
  requirements: string;
  salaryRange: string;
  experienceLevel: string;
  branchCode: string;
  branchName: string;
  postingDate: string;
  deadline: string;
  updatedAt: string;
  status: string;
  applicationCount: number;
}

const RecruitmentDetail: React.FC = () => {
  const { recruitmentId } = useParams<{ recruitmentId: string }>();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/api/job-postings/${recruitmentId}`);
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Không thể tải chi tiết tin tuyển dụng. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    fetchJob();
  }, [recruitmentId]);

  const formatDate = (dateString: string) => {
    // Kiểm tra xem chuỗi có phải là định dạng YYYY-MM-DD không
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
       // Nếu là định dạng đầy đủ (có giờ phút), dùng cách cũ an toàn hơn
       const date = new Date(dateString);
       return date.toLocaleDateString('vi-VN', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
       });
    }

    // Nếu là YYYY-MM-DD, xử lý thủ công để tránh lỗi timezone
    const parts = dateString.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Vui lòng tải lên file CV');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('cvFile', file);

    try {
      await api.post(`/api/applications/job-postings/${recruitmentId}/apply`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setApplicationSuccess(true);
      setShowApplicationForm(false);
      setFormData({ fullName: '', email: '', phone: '' });
      setFile(null);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Có lỗi xảy ra khi nộp đơn. Vui lòng thử lại sau.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a373]"></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 text-lg">{error || 'Không tìm thấy tin tuyển dụng.'}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#d4a373] text-white rounded hover:bg-[#c19262] transition"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <div className={`container mx-auto px-4 py-8 ${showApplicationForm ? 'blur-sm' : ''}`}>
        {/* Job Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{job.title}</h1>
                <p className="text-gray-600 mt-1">Mã tin: {job.jobCode}</p>
              </div>
              <button
                onClick={() => setShowApplicationForm(true)}
                className="px-6 py-3 bg-[#d4a373] hover:bg-[#c19262] text-white font-medium rounded-lg transition-colors duration-300"
              >
                Ứng tuyển ngay
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center text-gray-700">
                <FiDollarSign className="mr-2 text-[#d4a373]" />
                <span><strong>Mức lương:</strong> {job.salaryRange}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <FiBriefcase className="mr-2 text-[#d4a373]" />
                <span><strong>Kinh nghiệm:</strong> {job.experienceLevel}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <FiMapPin className="mr-2 text-[#d4a373]" />
                <span><strong>Chi nhánh:</strong> {job.branchName}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <FiCalendar className="mr-2 text-[#d4a373]" />
                <span><strong>Hạn nộp:</strong> {formatDate(job.deadline)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Mô tả công việc</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {job.description.split('\n').map((line, index) => (
                  <li key={index}>{line.replace(/^- /, '')}</li>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Yêu cầu công việc</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {job.requirements.split('\n').map((line, index) => (
                  <li key={index}>{line.replace(/^- /, '')}</li>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Thông tin chung</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-gray-600">Ngày đăng:</span>
                  <span className="font-medium">{formatDate(job.postingDate)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Cập nhật:</span>
                  <span className="font-medium">{formatDate(job.updatedAt)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`font-medium ${job.status === 'OPEN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {job.status === 'OPEN' ? 'Đang tuyển' : 'Đã đóng'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Số ứng viên:</span>
                  <span className="font-medium">{job.applicationCount}</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#f8f4f0] border border-[#d4a373] rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-3">Hướng dẫn ứng tuyển</h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>Điền đầy đủ thông tin cá nhân</li>
                <li>Tải lên CV (PDF hoặc Word)</li>
                <li>Nhấn "Nộp đơn" để hoàn tất</li>
              </ol>
              <button
                onClick={() => setShowApplicationForm(true)}
                className="mt-4 w-full px-4 py-3 bg-[#d4a373] hover:bg-[#c19262] text-white font-medium rounded-lg transition-colors duration-300"
              >
                Ứng tuyển ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Đơn ứng tuyển</h2>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-[#f8f4f0] p-4 rounded-lg">
                <h3 className="font-bold text-lg text-gray-800">{job.title}</h3>
                <p className="text-gray-600">Mã tin: {job.jobCode}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="fullName">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium" htmlFor="phone">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                      File CV <span className="text-red-500">*</span>
                      <span className="text-sm text-gray-500 ml-2">(PDF, DOCX, tối đa 5MB)</span>
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-[#d4a373]'
                        }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {file ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-700 flex items-center">
                              <FiCheck className="mr-2" /> {file.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FiUpload className="mx-auto text-gray-400 mb-2" size={24} />
                          <p className="text-gray-500">Kéo thả file vào đây hoặc click để chọn</p>
                          <p className="text-sm text-gray-400 mt-1">Hỗ trợ: PDF, DOC, DOCX</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#d4a373] hover:bg-[#c19262] text-white font-medium rounded-lg transition-colors duration-300"
                  >
                    Nộp đơn
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {applicationSuccess && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
            <FiCheck className="mr-2" size={20} />
            <span>Đơn ứng tuyển của bạn đã được gửi thành công!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentDetail;