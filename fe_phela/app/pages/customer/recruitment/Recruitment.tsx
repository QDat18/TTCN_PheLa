import React, { useState, useEffect } from 'react';
import Header from '~/components/customer/Header';
import Footer from '~/components/customer/Footer';
import { Link } from 'react-router-dom';
import { getPublicJobPostings, getApplicationCount } from '~/services/jobService';
import { motion } from 'framer-motion';
import { FiBriefcase, FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';

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

const Recruitment: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsData = await getPublicJobPostings();
        const jobsWithCount = await Promise.all(
          jobsData.map(async (job: JobPosting) => {
            try {
              const count = await getApplicationCount(job.jobPostingId);
              return { ...job, applicationCount: count };
            } catch {
              return { ...job, applicationCount: 0 };
            }
          })
        );
        setJobs(jobsWithCount);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách tin tuyển dụng. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF8F1]">
        <Header />
        <div className="pt-40 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-[40px] h-64 shadow-sm border border-[#E5D5C5]/30"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F1] selection:bg-[#8C5A35] selection:text-white">
      <Header />

      {/* Hero Section - Deep Coffee */}
      <div className="relative bg-[#1A120B] pt-48 pb-36 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8C5A35] opacity-5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2B13C] opacity-5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-[#E2B13C] text-xs font-black uppercase tracking-[0.4em] mb-6 block italic">Join Our Team</span>
            <h1 className="text-5xl md:text-7xl font-black !text-[#FDF5E6] leading-none mb-8">
              Tuyển <span className="italic font-serif text-[#E2B13C] font-normal">Dụng</span>
            </h1>
            <div className="flex flex-col items-center gap-6">
              <p className="text-[#FDF5E6]/60 text-sm md:text-base max-w-xl font-medium leading-relaxed italic">
                Chúng tôi luôn tìm kiếm những tâm hồn đồng điệu để cùng nhau viết tiếp hành trình kết nối đam mê và lan tỏa những giá trị nguyên bản.
              </p>
              <div className="h-1 w-12 bg-[#E2B13C]"></div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Job Listings Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-black text-[#1A120B] uppercase tracking-tighter italic">Cơ hội nghề nghiệp</h2>
            <div className="flex-1 h-px bg-[#E5D5C5]/50"></div>
            <div className="px-4 py-1.5 bg-[#8C5A35] rounded-full">
               <span className="text-white text-[10px] font-black uppercase tracking-widest">{jobs.length} Vị trí</span>
            </div>
          </div>
          
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.jobPostingId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:shadow-[#1A120B]/5 transition-all duration-500 border border-[#E5D5C5]/30 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#FDF5E6] rounded-bl-[60px] -mr-8 -mt-8 transition-colors group-hover:bg-[#E2B13C]/10"></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-[#FDF5E6] text-[#8C5A35] text-[9px] font-black uppercase tracking-widest rounded-full border border-[#E5D5C5]/50">
                          {job.branchName}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-[#1A120B] leading-tight mb-2 group-hover:text-[#8C5A35] transition-colors">{job.title}</h3>
                      <p className="text-[#8C5A35] text-[10px] font-black uppercase tracking-[0.2em]">{job.jobCode}</p>
                    </div>

                    <div className="space-y-4 mb-10 flex-grow">
                      <div className="flex items-center text-gray-500 text-sm font-medium">
                        <div className="w-8 h-8 rounded-full bg-[#FCF8F1] flex items-center justify-center mr-3 group-hover:bg-[#8C5A35] group-hover:text-white transition-colors">
                          <FiDollarSign size={14} />
                        </div>
                        <span className="group-hover:text-[#1A120B] transition-colors">{job.salaryRange}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm font-medium">
                        <div className="w-8 h-8 rounded-full bg-[#FCF8F1] flex items-center justify-center mr-3 group-hover:bg-[#8C5A35] group-hover:text-white transition-colors">
                          <FiBriefcase size={14} />
                        </div>
                        <span className="group-hover:text-[#1A120B] transition-colors">{job.experienceLevel}</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-xs font-medium">
                        <div className="w-8 h-8 rounded-full bg-[#FCF8F1] flex items-center justify-center mr-3">
                          <FiClock size={12} />
                        </div>
                        <span>Hạn nộp: {formatDate(job.deadline)}</span>
                      </div>
                    </div>

                    <Link
                      to={`/tuyen-dung/${job.jobPostingId}`}
                      className="w-full h-12 inline-flex items-center justify-center bg-[#1A120B] text-[#FDF5E6] rounded-2xl group-hover:bg-[#8C5A35] transition-all duration-300 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-[#1A120B]/10 group-hover:shadow-[#8C5A35]/20"
                    >
                      Khám phá ngay
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[60px] p-24 text-center border border-[#E5D5C5]/50 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#FCF8F1]/50 to-transparent"></div>
               <div className="relative z-10">
                <div className="w-24 h-24 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <FiBriefcase className="text-[#8C5A35] opacity-30" size={32} />
                </div>
                <h3 className="text-3xl font-black text-[#1A120B] mb-4 uppercase tracking-tighter italic">Đội ngũ Phê La hiện đã đủ quân số</h3>
                <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed italic">
                  Vui lòng quay lại sau để không bỏ lỡ các cơ hội gia nhập hành trình kết nối những tâm hồn đồng âm.
                </p>
                <div className="mt-12 h-px w-24 bg-[#E2B13C] mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Recruitment;