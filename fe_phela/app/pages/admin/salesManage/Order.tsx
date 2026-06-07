import React, { useState, useEffect, useMemo } from 'react';
import api from '~/config/axios';
import { Link } from 'react-router-dom';
import { useAuth } from '~/AuthContext';
import { toast } from 'react-toastify';

// Interfaces
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
type OrderTabStatus = 'ALL' | OrderStatus;

interface Order {
  orderId: string;
  orderCode: string;
  orderDate: string;
  finalAmount: number;
  status: OrderStatus;
  orderItems: any[];
}

const STATUSES: OrderTabStatus[] = ['ALL', 'PENDING', 'CONFIRMED', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

const STATUS_LABELS: Record<OrderTabStatus, string> = {
  'ALL': 'Tất cả',
  'PENDING': 'Chờ xác nhận',
  'CONFIRMED': 'Đã xác nhận',
  'DELIVERING': 'Đang giao',
  'DELIVERED': 'Đã giao',
  'CANCELLED': 'Đã hủy'
};

const Order = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderTabStatus>('ALL');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState<any[]>([]);

  // Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/api/branch');
        if (Array.isArray(response.data)) {
          setBranches(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      }
    };
    fetchBranches();
  }, []);

  // Fetch Orders based on Status and Filters
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/admin';
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: 0,
          size: 100, // Load more rows for search/filter results
        };

        if (selectedStatus !== 'ALL') {
          params.status = selectedStatus;
        }
        if (selectedBranch) {
          params.branchCode = selectedBranch;
        }
        if (selectedPaymentMethod) {
          params.paymentMethod = selectedPaymentMethod;
        }
        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }
        if (appliedQuery) {
          params.query = appliedQuery;
        }

        const response = await api.get('/api/order/search-filter', { params });
        const data = response.data;
        if (data && Array.isArray(data.content)) {
          setOrders(data.content);
        } else if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [selectedStatus, selectedBranch, selectedPaymentMethod, startDate, endDate, appliedQuery, user, authLoading]);

  const handleSearch = () => {
    setAppliedQuery(searchQuery);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setAppliedQuery('');
    setSelectedBranch('');
    setSelectedPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setSelectedStatus('ALL');
  };

  const handleExportExcel = async () => {
    try {
      const params: any = {};
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      if (selectedBranch) {
        params.branchCode = selectedBranch;
      }
      if (selectedPaymentMethod) {
        params.paymentMethod = selectedPaymentMethod;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (appliedQuery) {
        params.query = appliedQuery;
      }

      toast.info("Đang chuẩn bị xuất file Excel...");
      
      const response = await api.get('/api/order/export-excel', {
        params,
        responseType: 'blob'
      });

      const disposition = response.headers['content-disposition'];
      let filename = `DanhSachDonHang_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Export Excel failed:", error);
      toast.error("Không thể xuất file Excel");
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user?.username) {
      toast.error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      await api.patch(`/api/order/${orderId}/status`, null, {
        params: {
          status: newStatus,
          username: user.username
        }
      });
      toast.success('Cập nhật trạng thái thành công!');
      if (selectedStatus !== 'ALL') {
        setOrders(orders.filter(o => o.orderId !== orderId));
      } else {
        setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error: any) {
      toast.error(`Lỗi: ${error.response?.data?.message || 'Không thể cập nhật'}`);
    }
  };

  // Get next possible statuses based on current status and user role
  const getAvailableActions = (currentStatus: OrderStatus): OrderStatus[] => {
    const role = user?.role;

    // Define status workflow
    const statusWorkflow: Record<OrderStatus, OrderStatus[]> = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['DELIVERING', 'CANCELLED'],
      'DELIVERING': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [], // Final state
      'CANCELLED': [] // Final state
    };

    const nextStatuses = statusWorkflow[currentStatus] || [];

    // Filter based on role permissions
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return nextStatuses;
    } else if (role === 'STAFF') {
      return nextStatuses.filter(status =>
        status === 'CONFIRMED' || status === 'DELIVERING' || status === 'CANCELLED'
      );
    } else if (role === 'DELIVERY_STAFF') {
      return nextStatuses.filter(status => status === 'DELIVERED');
    }

    return [];
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-200 text-gray-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'DELIVERING': return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA; // Sắp xếp giảm dần (mới nhất lên trước)
    });
  }, [orders]);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
          {STATUSES.map(status => {
            const orderCount = status === selectedStatus ? orders.length : 0;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${selectedStatus === status
                  ? 'bg-[#d4a373] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {STATUS_LABELS[status]}
                {selectedStatus === status && orderCount > 0 && (
                  <span className="ml-2 bg-white text-[#d4a373] px-2 py-0.5 rounded-full text-xs font-bold">
                    {orderCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and Filter panel */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="flex flex-col">
              <label htmlFor="search-input" className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tìm kiếm</label>
              <div className="relative flex">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Mã đơn, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="w-full text-sm rounded-l-md border-gray-300 shadow-sm focus:border-[#d4a373] focus:ring focus:ring-[#d4a373] focus:ring-opacity-50 pr-8"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#d4a373] text-white px-4 rounded-r-md text-sm font-medium hover:bg-[#b38a5a] transition-colors"
                >
                  Tìm
                </button>
              </div>
            </div>

            {/* Branch Filter */}
            <div className="flex flex-col">
              <label htmlFor="branch-select" className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Chi nhánh</label>
              <select
                id="branch-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-[#d4a373] focus:ring focus:ring-[#d4a373] focus:ring-opacity-50"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map(b => (
                  <option key={b.branchCode} value={b.branchCode}>{b.branchName}</option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex flex-col">
              <label htmlFor="payment-method-select" className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Thanh toán</label>
              <select
                id="payment-method-select"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-[#d4a373] focus:ring focus:ring-[#d4a373] focus:ring-opacity-50"
              >
                <option value="">Tất cả hình thức</option>
                <option value="COD">COD (Tiền mặt)</option>
                <option value="BANK_TRANSFER">BANK TRANSFER (Chuyển khoản)</option>
                <option value="SEPAY">SEPAY</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col">
              <label htmlFor="start-date-input" className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Khoảng thời gian</label>
              <div className="flex space-x-2 items-center">
                <input
                  id="start-date-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[#d4a373] focus:ring focus:ring-[#d4a373] focus:ring-opacity-50"
                />
                <span className="text-gray-400 text-xs">đến</span>
                <input
                  id="end-date-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[#d4a373] focus:ring focus:ring-[#d4a373] focus:ring-opacity-50"
                />
              </div>
            </div>

          </div>

          {/* Reset Filters Option */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Xuất file Excel
              </button>
            </div>

            {(appliedQuery || selectedBranch || selectedPaymentMethod || startDate || endDate || selectedStatus !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a373]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#d4a373]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mã đơn</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Ngày đặt</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tổng tiền</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Trạng thái</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map(order => (
                      <tr key={order.orderId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.orderCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.finalAmount.toLocaleString()} VND
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-10">
                          {getAvailableActions(order.status).length > 0 ? (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleUpdateStatus(order.orderId, e.target.value as OrderStatus);
                                  e.target.value = '';
                                }
                              }}
                              className="text-sm rounded-md border-gray-300 shadow-sm focus:border-[#d4a373] focus:ring focus:ring-[#d4a373] focus:ring-opacity-50"
                            >
                              <option value="">Cập nhật trạng thái</option>
                              {getAvailableActions(order.status).map(action => (
                                <option key={action} value={action}>{STATUS_LABELS[action]}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-400 text-sm">Không có hành động</span>
                          )}
                          <Link
                            to={`/admin/don-hang/${order.orderId}`}
                            className="text-[#d4a373] hover:text-[#b38a5a]"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Không có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Order;