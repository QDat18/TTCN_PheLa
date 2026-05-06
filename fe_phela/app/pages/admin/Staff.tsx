import React, { useState, useEffect } from 'react';
import api from '~/config/axios';
import { toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';
import { FiEdit, FiPlus, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
        setTotalPages(response.data.totalPages);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          
          {/* <button
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mt-4 md:mt-0"
            onClick={() => {
              // Thêm logic mở modal thêm nhân viên mới ở đây
              toast.info('Chức năng thêm nhân viên mới sẽ được triển khai sau');
            }}
          >
            <FiPlus className="mr-2" />
            Thêm nhân viên
          </button> */}
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
                          {admin.status}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="PENDING">Pending</option>
                          <option value="BLOCKED">Blocked</option>
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
    </div>
  );
};

export default Staff;