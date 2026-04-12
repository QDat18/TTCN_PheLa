import React, { useState, useEffect } from 'react';
import Header from '~/components/admin/Header';
import { toast } from 'react-toastify';
import { getVouchers, createVoucher, updateVoucher, deleteVoucher } from '~/services/voucherService';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTicketAlt, FaTimes } from 'react-icons/fa';

interface Voucher {
    id: string;
    code: string;
    name: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'SHIPPING';
    value: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
    usageLimit: number;
    usedCount: number;
}

const VoucherManager = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [formData, setFormData] = useState<Partial<Voucher>>({
        code: '',
        name: '',
        description: '',
        type: 'FIXED_AMOUNT',
        value: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        status: 'ACTIVE',
        usageLimit: 100
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const data = await getVouchers();
            setVouchers(data);
        } catch (error) {
            console.error("Failed to fetch vouchers:", error);
            toast.error('Không thể tải danh sách mã giảm giá.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (voucher?: Voucher) => {
        if (voucher) {
            setEditingVoucher(voucher);
            setFormData({
                ...voucher,
                startDate: voucher.startDate.slice(0, 16),
                endDate: voucher.endDate.slice(0, 16)
            });
        } else {
            setEditingVoucher(null);
            setFormData({
                code: '',
                name: '',
                description: '',
                type: 'FIXED_AMOUNT',
                value: 0,
                minOrderAmount: 0,
                maxDiscountAmount: 0,
                startDate: new Date().toISOString().slice(0, 16),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                status: 'ACTIVE',
                usageLimit: 100
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingVoucher) {
                await updateVoucher(editingVoucher.id, formData);
                toast.success('Cập nhật mã giảm giá thành công!');
            } else {
                await createVoucher(formData);
                toast.success('Tạo mã giảm giá thành công!');
            }
            setIsModalOpen(false);
            fetchVouchers();
        } catch (error) {
            console.error("Error saving voucher:", error);
            toast.error('Có lỗi xảy ra khi lưu mã giảm giá.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
            try {
                await deleteVoucher(id);
                toast.success('Xóa mã giảm giá thành công!');
                fetchVouchers();
            } catch (error) {
                console.error("Error deleting voucher:", error);
                toast.error('Không thể xóa mã giảm giá.');
            }
        }
    };

    const filteredVouchers = (vouchers || []).filter(v => 
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen bg-[#FCF8F1]">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 mt-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-[#2C1E16] uppercase tracking-tighter flex items-center gap-3">
                                <FaTicketAlt className="text-[#8C5A35]" />
                                Quản lý Khuyến mãi
                            </h1>
                            <p className="text-[#8C5A35] font-medium opacity-80">Quản lý các mã giảm giá và chương trình ưu đãi của hệ thống.</p>
                        </div>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="bg-[#8C5A35] hover:bg-[#2C1E16] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <FaPlus /> Tạo Mã Mới
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5D5C5] mb-6 flex items-center gap-4">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C5A35] opacity-50" />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm theo mã hoặc tên chương trình..."
                                className="w-full pl-11 pr-4 py-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Vouchers Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-[#8C5A35] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[#8C5A35] font-bold animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVouchers.map(voucher => (
                                <div key={voucher.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E5D5C5] hover:shadow-md transition-shadow group flex flex-col">
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                voucher.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                                voucher.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {voucher.status === 'ACTIVE' ? 'Đang chạy' : 
                                                 voucher.status === 'EXPIRED' ? 'Hết hạn' : 'Đã tắt'}
                                            </span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(voucher)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><FaEdit /></button>
                                                <button onClick={() => handleDelete(voucher.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><FaTrash /></button>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#2C1E16] mb-1">{voucher.name}</h3>
                                        <div className="bg-[#FAF6F1] border-2 border-dashed border-[#8C5A35]/30 p-3 rounded-xl mb-4 text-center">
                                            <span className="text-2xl font-black text-[#8C5A35] tracking-widest uppercase">{voucher.code}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{voucher.description}</p>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Giảm giá:</span>
                                                <span className="font-bold text-[#2C1E16]">
                                                    {voucher.type === 'PERCENTAGE' ? `${voucher.value}%` : 
                                                     voucher.type === 'FIXED_AMOUNT' ? `${voucher.value.toLocaleString()}đ` : 'Free Ship'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Đơn tối thiểu:</span>
                                                <span className="font-bold text-[#2C1E16]">{voucher.minOrderAmount.toLocaleString()}đ</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Thời gian:</span>
                                                <span className="font-bold text-[#2C1E16]">{new Date(voucher.endDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-[#FAF6F1] border-t border-[#E5D5C5] flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#8C5A35]" 
                                                    style={{ width: `${Math.min((voucher.usedCount / voucher.usageLimit) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-gray-500">{voucher.usedCount}/{voucher.usageLimit}</span>
                                        </div>
                                        <span className="font-bold text-[#8C5A35]">Chi tiết</span>
                                    </div>
                                </div>
                            ))}
                            {filteredVouchers.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                    <div className="bg-white inline-block p-8 rounded-full mb-4 shadow-sm border border-[#E5D5C5]">
                                        <FaTicketAlt className="text-5xl text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#2C1E16]">Không tìm thấy mã giảm giá nào</h3>
                                    <p className="text-gray-500">Hãy thử đổi từ khóa tìm kiếm hoặc tạo mã giảm giá mới.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#2C1E16] p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-widest">
                                {editingVoucher ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:rotate-90 transition-transform"><FaTimes size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Mã Code (In hoa, không dấu)</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        placeholder="VD: PHELA50"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Tên chương trình</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        placeholder="VD: Ưu đãi đại lễ"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Mô tả</label>
                                    <textarea 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-medium"
                                        rows={2}
                                        placeholder="Nhập mô tả ngắn gọn về mã giảm giá..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Loại giảm giá</label>
                                    <select 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                    >
                                        <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                        <option value="SHIPPING">Miễn phí vận chuyển</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Giá trị giảm</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.value}
                                        onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Đơn tối thiểu (đ)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({...formData, minOrderAmount: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Giới hạn sử dụng</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({...formData, usageLimit: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Ngày bắt đầu</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Ngày kết thúc</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#8C5A35] mb-2">Trạng thái</label>
                                    <select 
                                        className="w-full p-3 bg-[#FCF8F1] border-none rounded-xl focus:ring-2 focus:ring-[#8C5A35] text-[#2C1E16] font-bold"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                    >
                                        <option value="ACTIVE">Kích hoạt</option>
                                        <option value="DISABLED">Vô hiệu hóa</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-10 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 border-2 border-[#E5D5C5] text-[#2C1E16] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FDF5E6] transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-[#8C5A35] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#2C1E16] transition-all shadow-lg shadow-[#8C5A35]/20 active:scale-[0.98]"
                                >
                                    {editingVoucher ? 'Cập nhật ngay' : 'Tạo mã voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherManager;
