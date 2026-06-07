import React, { useState, useEffect } from 'react';
import api from '~/config/axios';
import { toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';
import { FiEdit, FiPlus, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa';

interface Admin {
  employCode: string;
  fullname: string;
  username: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  branch: string;
}

interface Branch {
  branchCode: string;
  branchName: string;
}

const Staff = () => {
  const { user, loading: authLoading } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [searchFullname, setSearchFullname] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    employCode: '',
    fullname: '',
    username: '',
    password: '',
    dob: '',
    email: '',
    phone: '',
    gender: 'Nam',
    role: 'STAFF',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setNewStaff({
      employCode: '',
      fullname: '',
      username: '',
      password: '',
      dob: '',
      email: '',
      phone: '',
      gender: 'Nam',
      role: 'STAFF',
      status: 'ACTIVE',
    });
    setEditingUsername(null);
    setErrors({});
  };

  const formatDobForBackend = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEditClick = (admin: Admin) => {
    setErrors({});
    let dateVal = '';
    if (admin.dob) {
      if (admin.dob.includes('/')) {
        const [day, month, year] = admin.dob.split('/');
        dateVal = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        try {
          const date = new Date(admin.dob);
          if (!isNaN(date.getTime())) {
            dateVal = date.toISOString().split('T')[0];
          }
        } catch (e) {
          dateVal = admin.dob;
        }
      }
    }
    setNewStaff({
      employCode: admin.employCode,
      fullname: admin.fullname,
      username: admin.username,
      password: '',
      dob: dateVal,
      email: admin.email,
      phone: admin.phone,
      gender: admin.gender || 'Nam',
      role: admin.role,
      status: admin.status,
    });
    setEditingUsername(admin.username);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!newStaff.employCode.trim()) {
      newErrors.employCode = 'Mã nhân viên không được để trống';
    } else if (newStaff.employCode.trim().length > 20) {
      newErrors.employCode = 'Mã nhân viên không được dài quá 20 ký tự';
    }

    if (!newStaff.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (newStaff.username.trim().length < 6 || newStaff.username.trim().length > 50) {
      newErrors.username = 'Tên đăng nhập phải từ 6 đến 50 ký tự';
    }

    if (!newStaff.fullname.trim()) {
      newErrors.fullname = 'Tên nhân viên không được để trống';
    } else if (newStaff.fullname.trim().length < 6 || newStaff.fullname.trim().length > 50) {
      newErrors.fullname = 'Tên nhân viên phải từ 6 đến 50 ký tự';
    }

    if (!editingUsername) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/;
      if (!newStaff.password) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (!passwordRegex.test(newStaff.password)) {
        newErrors.password = 'Mật khẩu phải chứa ít nhất một chữ hoa, chữ thường, số và một ký tự đặc biệt (từ 8 đến 128 ký tự)';
      }
    }

    if (!newStaff.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    } else if (newStaff.email.trim().length > 50) {
      newErrors.email = 'Email không được dài quá 50 ký tự';
    }

    if (!newStaff.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^\d{10,11}$/.test(newStaff.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (phải có 10 hoặc 11 chữ số)';
    }

    if (!newStaff.dob) {
      newErrors.dob = 'Ngày sinh không được để trống';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại thông tin nhập vào.');
      return;
    }

    setLoading(true);
    try {
      const formattedDob = formatDobForBackend(newStaff.dob);
      if (editingUsername) {
        const payload = {
          fullname: newStaff.fullname,
          dob: formattedDob,
          email: newStaff.email,
          phone: newStaff.phone,
          gender: newStaff.gender,
          role: newStaff.role,
          status: newStaff.status,
        };
        await api.put(`/api/admin/updateInfo/${editingUsername}`, payload);
        toast.success('Cập nhật nhân viên thành công!');
      } else {
        const payload = {
          ...newStaff,
          dob: formattedDob,
        };
        await api.post('/api/admin/create', payload);
        toast.success('Thêm mới nhân viên thành công!');
      }
      setIsModalOpen(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const data = error.response?.data;
      if (data && data.validationErrors && Array.isArray(data.validationErrors)) {
        const backendErrors: Record<string, string> = {};
        data.validationErrors.forEach((err: any) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
        toast.error('Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.');
      } else {
        const backendMessage = data?.message || data || 'Không thể thêm nhân viên. Vui lòng kiểm tra lại.';
        toast.error(backendMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/admin';
      return;
    }

    fetchAdmins();
    fetchBranches();
  }, [currentPage, searchUsername, searchFullname, filterRole, user, authLoading]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/getAll?page=${currentPage}&size=10&sortBy=username`;
      if (searchUsername || searchFullname || filterRole) {
        const params = new URLSearchParams();
        if (searchUsername) params.append('username', searchUsername);
        if (searchFullname) params.append('fullname', searchFullname);
        if (filterRole) params.append('role', filterRole);
        url = `/api/admin/search?${params.toString()}`;
      }
      const response = await api.get(url);

      let adminsData: Admin[] = [];
      if (response.data.content) {
        adminsData = response.data.content.map((admin: any) => ({
          employCode: admin.employCode,
          fullname: admin.fullname,
          username: admin.username,
          gender: admin.gender,
          dob: admin.dob,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          status: admin.status,
          branch: admin.branch ? (typeof admin.branch === 'string' ? admin.branch : admin.branch.branchCode) : 'Chưa sắp xếp'
        }));
        setAdmins(adminsData);
        setTotalPages(response.data.page?.totalPages ?? response.data.totalPages ?? 1);
      } else {
        adminsData = response.data.map((admin: any) => ({
          employCode: admin.employCode,
          fullname: admin.fullname,
          username: admin.username,
          gender: admin.gender,
          dob: admin.dob,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          status: admin.status,
          branch: admin.branch ? (typeof admin.branch === 'string' ? admin.branch : admin.branch.branchCode) : 'Chưa sắp xếp'
        }));
        setTotalPages(1);
      }
      setAdmins(adminsData);
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      toast.error('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get('/api/branch');
      let branchesData: Branch[] = [];
      if (response.data.content) {
        branchesData = response.data.content.map((branch: any) => ({
          branchCode: branch.branchCode,
          branchName: branch.branchName,
        }));
      } else {
        branchesData = response.data.map((branch: any) => ({
          branchCode: branch.branchCode,
          branchName: branch.branchName,
        }));
      }
      setBranches(branchesData);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast.error('Không thể tải danh sách chi nhánh. Vui lòng thử lại.');
    }
  };

  const handleUpdateRole = async (username: string, newRole: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn cập nhật vai trò?')) return;
    if (!user?.username) {
      toast.error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      await api.patch(`/api/admin/${username}/role`, null, {
        params: { newRole, curentUsername: user.username },
      });
      setAdmins(prev => prev.map(admin =>
        admin.username === username ? { ...admin, role: newRole } : admin
      ));
      toast.success('Cập nhật vai trò thành công!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật vai trò. Vui lòng thử lại.');
    }
  };

  const handleUpdateStatus = async (username: string, newStatus: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn cập nhật trạng thái?')) return;
    if (!user?.username) {
      toast.error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      await api.patch(`/api/admin/${username}/status`, null, {
        params: { newStatus, curentUsername: user.username },
      });
      setAdmins(prev => prev.map(admin =>
        admin.username === username ? { ...admin, status: newStatus } : admin
      ));
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleAssignBranch = async (username: string, branchCode: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn gán chi nhánh này?')) return;
    if (!user?.username) {
      toast.error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      await api.patch(`/api/admin/${username}/assign-branch`, null, {
        params: { branchCode, curentUsername: user.username },
      });
      setAdmins(prev => prev.map(admin =>
        admin.username === username ? {
          ...admin,
          branch: branchCode
        } : admin
      ));
      toast.success('Gán chi nhánh thành công!');
    } catch (error: any) {
      console.error('Error assigning branch:', error);
      toast.error(error.response?.data?.message || 'Không thể gán chi nhánh. Vui lòng thử lại.');
    }
  };

  const handleDeleteClick = async (username: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản nhân viên này ra khỏi hệ thống không?')) return;

    try {
      await api.delete(`/api/admin/${username}`);
      toast.success('Xóa nhân viên thành công!');
      fetchAdmins();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa nhân viên. Vui lòng thử lại.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'BLOCKED': return 'Lock';
      case 'PENDING': return 'Pending';
      case 'INACTIVE': return 'Inactive';
      default: return status;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-indigo-100 text-indigo-800';
      case 'STAFF': return 'bg-blue-100 text-blue-800';
      case 'DELIVERY_STAFF': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý nhân viên</h1>
            <p className="text-gray-600">Danh sách nhân viên trong hệ thống</p>
          </div>

          {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
            <button
              className="flex items-center justify-center px-6 py-2.5 bg-[#2C1E16] text-[#FCF8F1] rounded-2xl hover:bg-[#8C5A35] transition-all text-sm font-black uppercase tracking-widest shadow-md shadow-[#2C1E16]/10 mt-4 md:mt-0"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <FiPlus className="mr-2" />
              Thêm nhân viên
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tìm theo username..."
                disabled={loading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchFullname}
                onChange={(e) => setSearchFullname(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tìm theo tên..."
                disabled={loading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                disabled={loading}
              >
                <option value="">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="STAFF">Staff</option>
                <option value="DELIVERY_STAFF">Delivery Staff</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : admins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi nhánh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.employCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.fullname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(admin.dob)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(admin.role)}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(admin.status)}`}>
                          {getStatusLabel(admin.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          onChange={(e) => handleAssignBranch(admin.username, e.target.value)}
                          value={admin.branch === 'Chưa sắp xếp' ? '' : admin.branch}
                          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={!['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '')}
                        >
                          <option value="">Chưa sắp xếp</option>
                          {branches.map((branch) => (
                            <option key={branch.branchCode} value={branch.branchCode}>
                              {branch.branchName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                        {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                          <button
                            onClick={() => handleEditClick(admin)}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all text-xs font-bold mr-2 shadow-sm"
                            disabled={admin.role === 'SUPER_ADMIN' && user?.role !== 'SUPER_ADMIN'}
                          >
                            <FiEdit className="mr-1" /> Sửa
                          </button>
                        )}
                        {user?.role === 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleDeleteClick(admin.username)}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-xl hover:bg-red-100 transition-all text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={admin.username === user?.username}
                          >
                            <FiTrash2 className="mr-1" /> Xóa
                          </button>
                        )}
                        <select
                          onChange={(e) => handleUpdateRole(admin.username, e.target.value)}
                          value={admin.role}
                          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={user?.role !== 'SUPER_ADMIN' || admin.role === 'SUPER_ADMIN'}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="STAFF">Staff</option>
                          <option value="DELIVERY_STAFF">Delivery Staff</option>
                        </select>
                        <select
                          onChange={(e) => handleUpdateStatus(admin.username, e.target.value)}
                          value={admin.status}
                          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={user?.role !== 'SUPER_ADMIN'}
                        >
                          {admin.status !== 'ACTIVE' && admin.status !== 'BLOCKED' && (
                            <option value={admin.status}>{getStatusLabel(admin.status)}</option>
                          )}
                          <option value="ACTIVE">Active</option>
                          <option value="BLOCKED">Lock</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Không có nhân viên nào</h3>
              <p className="mt-1 text-gray-500">Không tìm thấy nhân viên phù hợp với tiêu chí tìm kiếm của bạn.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Hiển thị trang {currentPage + 1} / {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0 || loading}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiChevronLeft className="mr-1" /> Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1 || loading}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau <FiChevronRight className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#FCF8F1] rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#E5D5C5]">
            <form onSubmit={handleCreateStaff} className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#2C1E16] uppercase tracking-[0.2em]">{editingUsername ? 'Cập nhật nhân viên' : 'Thêm mới nhân viên'}</h2>
                  <div className="h-1 w-12 bg-[#8C5A35] mt-2 rounded-full"></div>
                </div>
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-[#E5D5C5]/30 rounded-full transition-colors"><svg className="h-6 w-6 text-[#8C5A35]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Mã nhân viên *</label>
                    <input type="text" value={newStaff.employCode} onChange={(e) => setNewStaff({ ...newStaff, employCode: e.target.value })} className={`w-full px-4 py-2.5 ${editingUsername ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'} border ${errors.employCode ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} placeholder="Ví dụ: PLB00001" disabled={!!editingUsername} />
                    {errors.employCode && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.employCode}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Tên đăng nhập *</label>
                    <input type="text" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} className={`w-full px-4 py-2.5 ${editingUsername ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'} border ${errors.username ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} placeholder="Nhập tên đăng nhập" disabled={!!editingUsername} />
                    {errors.username && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.username}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={editingUsername ? "col-span-2" : ""}>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Họ tên nhân viên *</label>
                    <input type="text" value={newStaff.fullname} onChange={(e) => setNewStaff({ ...newStaff, fullname: e.target.value })} className={`w-full px-4 py-2.5 bg-white border ${errors.fullname ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} placeholder="Nhập họ tên đầy đủ" />
                    {errors.fullname && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.fullname}</p>}
                  </div>
                  {!editingUsername && (
                    <div>
                      <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Mật khẩu tài khoản *</label>
                      <input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} className={`w-full px-4 py-2.5 bg-white border ${errors.password ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} placeholder="Chữ hoa, thường, số, ký tự đặc biệt" />
                      {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.password}</p>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Email *</label>
                    <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className={`w-full px-4 py-2.5 bg-white border ${errors.email ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} placeholder="example@email.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Số điện thoại *</label>
                    <input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} className={`w-full px-4 py-2.5 bg-white border ${errors.phone ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} placeholder="10 hoặc 11 chữ số" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Ngày sinh *</label>
                    <input type="date" value={newStaff.dob} onChange={(e) => setNewStaff({ ...newStaff, dob: e.target.value })} className={`w-full px-4 py-2.5 bg-white border ${errors.dob ? 'border-red-500 ring-red-200' : 'border-[#E5D5C5]'} rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm`} />
                    {errors.dob && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.dob}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Giới tính *</label>
                    <div className="relative">
                      <select value={newStaff.gender} onChange={(e) => setNewStaff({ ...newStaff, gender: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#8C5A35]"><FaChevronDown size={10} /></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Vai trò *</label>
                    <div className="relative">
                      <select value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        <option value="STAFF">Staff</option>
                        <option value="DELIVERY_STAFF">Delivery Staff</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#8C5A35]"><FaChevronDown size={10} /></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-1.5 ml-1">Trạng thái ban đầu *</label>
                  <div className="relative">
                    <select value={newStaff.status} onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer">
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCKED">Lock</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#8C5A35]"><FaChevronDown size={10} /></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-2.5 bg-transparent border border-[#E5D5C5] text-[#8C5A35] hover:bg-[#E5D5C5]/10 rounded-2xl transition-all text-sm font-black uppercase tracking-widest">Hủy</button>
                <button type="submit" className="px-6 py-2.5 bg-[#2C1E16] text-[#FCF8F1] hover:bg-[#8C5A35] rounded-2xl transition-all text-sm font-black uppercase tracking-widest shadow-md shadow-[#2C1E16]/10">{editingUsername ? 'Lưu cập nhật' : 'Lưu nhân viên'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;