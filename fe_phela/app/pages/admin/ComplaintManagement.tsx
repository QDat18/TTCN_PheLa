import React, { useState, useEffect } from 'react';
import api from '~/config/axios';
import { toast, ToastContainer } from 'react-toastify';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

interface Complaint {
    id: string;
    orderId: string;
    orderCode: string;
    customerId: string;
    customerName: string;
    reason: string;
    evidenceImages: string[];
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
    resolutionType: string;
    resolutionNotes: string;
    adminNotes: string;
    createdAt: string;
}

const ComplaintManagement: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [resolutionType, setResolutionType] = useState('REFUND');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/api/complaints');
            setComplaints(res.data);
        } catch (err) {
            toast.error('Lỗi khi tải danh sách khiếu nại');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        setIsResolving(true);
        try {
            await api.put(`/api/complaints/${selectedComplaint.id}/resolve`, {
                resolutionType,
                resolutionNotes,
                adminNotes
            });
            toast.success('Đã xử lý khiếu nại thành công');
            setSelectedComplaint(null);
            fetchComplaints();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lỗi khi xử lý khiếu nại');
        } finally {
            setIsResolving(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'PROCESSING': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'RESOLVED': return 'bg-green-50 text-green-600 border-green-200';
            case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-[#2C1E16] mb-8 uppercase tracking-tighter">Quản lý khiếu nại</h1>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-[#E5D5C5] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#FCF8F1] border-b border-[#E5D5C5]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-[#5C4D43] uppercase tracking-widest">Mã đơn</th>
                            <th className="px-6 py-4 text-xs font-black text-[#5C4D43] uppercase tracking-widest">Khách hàng</th>
                            <th className="px-6 py-4 text-xs font-black text-[#5C4D43] uppercase tracking-widest">Ngày tạo</th>
                            <th className="px-6 py-4 text-xs font-black text-[#5C4D43] uppercase tracking-widest">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-black text-[#5C4D43] uppercase tracking-widest text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5D5C5]">
                        {complaints.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-[#5C4D43] font-bold">Không có khiếu nại nào.</td>
                            </tr>
                        ) : (
                            complaints.map(c => (
                                <tr key={c.id} className="hover:bg-[#FCF8F1] transition-colors">
                                    <td className="px-6 py-4 font-bold text-[#8C5A35]">#{c.orderCode}</td>
                                    <td className="px-6 py-4 font-bold text-[#2C1E16]">{c.customerName}</td>
                                    <td className="px-6 py-4 text-sm text-[#5C4D43]">{new Date(c.createdAt).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(c.status)}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => setSelectedComplaint(c)}
                                            className="p-2 bg-[#FDF5E6] text-[#8C5A35] rounded-xl hover:bg-[#8C5A35] hover:text-white transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <FiEye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Resolve Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#FCF8F1] rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl border border-[#E5D5C5] max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-[#8C5A35] uppercase tracking-tight">Chi tiết khiếu nại</h2>
                            <button onClick={() => setSelectedComplaint(null)} className="text-[#5C4D43] hover:text-red-500"><FiX size={24} /></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                            <div>
                                <p className="font-black text-[#5C4D43] uppercase tracking-widest text-[10px] mb-1">Mã đơn hàng</p>
                                <p className="font-bold text-[#8C5A35] text-lg">#{selectedComplaint.orderCode}</p>
                            </div>
                            <div>
                                <p className="font-black text-[#5C4D43] uppercase tracking-widest text-[10px] mb-1">Khách hàng</p>
                                <p className="font-bold text-[#2C1E16]">{selectedComplaint.customerName}</p>
                            </div>
                        </div>

                        <div className="mb-6 bg-white p-4 rounded-xl border border-[#E5D5C5]">
                            <p className="font-black text-[#5C4D43] uppercase tracking-widest text-[10px] mb-2">Lý do khiếu nại</p>
                            <p className="font-bold text-[#2C1E16] leading-relaxed">{selectedComplaint.reason}</p>
                        </div>

                        {selectedComplaint.evidenceImages && selectedComplaint.evidenceImages.length > 0 && (
                            <div className="mb-6">
                                <p className="font-black text-[#5C4D43] uppercase tracking-widest text-[10px] mb-2">Hình ảnh bằng chứng</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedComplaint.evidenceImages.map((img, i) => (
                                        <a href={img} target="_blank" rel="noreferrer" key={i}>
                                            <img src={img} alt="Evidence" className="w-24 h-24 object-cover rounded-xl border border-[#E5D5C5] hover:opacity-80 transition-opacity" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedComplaint.status !== 'PENDING' && selectedComplaint.status !== 'PROCESSING' ? (
                            <div className="mt-8 pt-6 border-t border-dashed border-[#E5D5C5]">
                                <h3 className="font-black text-green-600 uppercase tracking-widest text-xs mb-4">Kết quả xử lý</h3>
                                <p className="text-sm"><strong>Hình thức:</strong> {selectedComplaint.resolutionType}</p>
                                <p className="text-sm mt-2"><strong>Ghi chú KH:</strong> {selectedComplaint.resolutionNotes}</p>
                                <p className="text-sm mt-2"><strong>Ghi chú nội bộ:</strong> {selectedComplaint.adminNotes}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleResolve} className="mt-8 pt-6 border-t border-dashed border-[#E5D5C5]">
                                <h3 className="font-black text-[#8C5A35] uppercase tracking-widest text-xs mb-4">Xử lý khiếu nại</h3>
                                
                                <div className="mb-4">
                                    <label className="block text-[10px] font-black text-[#5C4D43] uppercase tracking-widest mb-2">Hình thức giải quyết</label>
                                    <select 
                                        value={resolutionType} 
                                        onChange={e => setResolutionType(e.target.value)}
                                        className="w-full p-3 bg-white border border-[#E5D5C5] rounded-xl focus:ring-2 focus:ring-[#8C5A35]/30 text-sm font-bold"
                                    >
                                        <option value="REFUND">Hoàn tiền (Cập nhật TT Đơn hàng)</option>
                                        <option value="EXCHANGE">Đổi trả hàng</option>
                                        <option value="COMPENSATION">Đền bù (Voucher/Điểm)</option>
                                        <option value="REJECTED">Từ chối khiếu nại</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[10px] font-black text-[#5C4D43] uppercase tracking-widest mb-2">Ghi chú cho Khách Hàng (Sẽ hiển thị cho KH)</label>
                                    <textarea 
                                        value={resolutionNotes} 
                                        onChange={e => setResolutionNotes(e.target.value)}
                                        className="w-full p-3 bg-white border border-[#E5D5C5] rounded-xl focus:ring-2 focus:ring-[#8C5A35]/30 text-sm"
                                        rows={3}
                                        required
                                        placeholder="Ví dụ: Cửa hàng đồng ý hoàn tiền cho đơn hàng của bạn..."
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-[10px] font-black text-[#5C4D43] uppercase tracking-widest mb-2">Ghi chú nội bộ (Chỉ Admin xem)</label>
                                    <textarea 
                                        value={adminNotes} 
                                        onChange={e => setAdminNotes(e.target.value)}
                                        className="w-full p-3 bg-white border border-[#E5D5C5] rounded-xl focus:ring-2 focus:ring-[#8C5A35]/30 text-sm"
                                        rows={2}
                                        placeholder="Ghi chú về việc xử lý, nhân viên nào chịu trách nhiệm..."
                                    />
                                </div>

                                <div className="flex justify-end gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedComplaint(null)}
                                        className="px-6 py-2.5 bg-white border border-[#E5D5C5] rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#FDF5E6]"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isResolving}
                                        className="px-6 py-2.5 bg-[#8C5A35] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#2C1E16] disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <FiCheck size={14} /> {isResolving ? 'Đang xử lý...' : 'Xác nhận xử lý'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
            <ToastContainer position="bottom-right" />
        </div>
    );
};

export default ComplaintManagement;
