import React, { useState, useEffect, useMemo } from 'react';
import api from '~/config/axios';
import { Link } from 'react-router-dom';
import { useAuth } from '~/AuthContext';
import { toast } from 'react-toastify';

// Interfaces
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

interface Order {
  orderId: string;
  orderCode: string;
  orderDate: string;
  finalAmount: number;
  status: OrderStatus;
  orderItems: any[];
}

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

const STATUS_LABELS: Record<OrderStatus, string> = {
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
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('PENDING');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/admin';
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/order/status/${selectedStatus}`);
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
  }, [selectedStatus, user, authLoading]);

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
      setOrders(orders.filter(o => o.orderId !== orderId));
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
      // Admin can do everything
      return nextStatuses;
    } else if (role === 'STAFF') {
      // Staff can confirm orders and mark as delivering
      return nextStatuses.filter(status =>
        status === 'CONFIRMED' || status === 'DELIVERING' || status === 'CANCELLED'
      );
    } else if (role === 'DELIVERY_STAFF') {
      // Delivery staff can only mark as delivered
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