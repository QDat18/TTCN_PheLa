import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '~/AuthContext';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } from '~/services/categoryService';

interface Category {
  categoryCode: string;
  categoryName: string;
  description: string;
}

interface CategoryCreateDTO {
  categoryName: string;
  description: string;
}

const Category = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<CategoryCreateDTO>({ categoryName: '', description: '' });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [searchName, setSearchName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

    fetchCategories();
  }, [currentPage, searchName, user, authLoading, navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCategoriesAdmin(currentPage, 10, searchName);
      if (data.content) {
        setCategories(data.content.map((item: any) => ({
          categoryCode: item.categoryCode,
          categoryName: item.categoryName,
          description: item.description || '',
        })));
        setTotalPages(data.totalPages);
      } else {
        setCategories(data.map((item: any) => ({
          categoryCode: item.categoryCode,
          categoryName: item.categoryName,
          description: item.description || '',
        })));
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error.response ? error.response.data : error.message);
      setError('Không thể tải danh sách danh mục. Vui lòng thử lại.');
      toast.error('Lỗi tải danh sách danh mục. Vui lòng kiểm tra kết nối và thử lại.', {
        className: 'bg-red-100 text-red-800'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.categoryName.trim()) {
      toast.error('Tên danh mục không được để trống.');
      return;
    }
    try {
      if (editCategory) {
        const response = await updateCategory(editCategory.categoryCode, newCategory);
        setCategories(categories.map(cat =>
          cat.categoryCode === editCategory.categoryCode ? response : cat
        ));
        setEditCategory(null);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        const response = await createCategory(newCategory);
        setCategories([response, ...categories]);
        toast.success('Tạo danh mục thành công!');
      }
      setNewCategory({ categoryName: '', description: '' });
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error:', error.response ? error.response.data : error.message);
      toast.error(editCategory ? 'Không thể cập nhật danh mục.' : 'Không thể tạo danh mục.');
    }
  };

  const handleDeleteCategory = async (categoryCode: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await deleteCategory(categoryCode);
      setCategories(categories.filter(cat => cat.categoryCode !== categoryCode));
      toast.success('Xóa danh mục thành công!');
    } catch (error: any) {
      console.error('Error deleting category:', error.response ? error.response.data : error.message);
      toast.error('Không thể xóa danh mục. Vui lòng thử lại.');
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      setNewCategory({ categoryName: category.categoryName, description: category.description });
    } else {
      setEditCategory(null);
      setNewCategory({ categoryName: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCategory(null);
    setNewCategory({ categoryName: '', description: '' });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <FiLock className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
          </p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Quay lại trang Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục Sản phẩm</h1>
          <button
            onClick={() => openModal()}
            className="mt-4 md:mt-0 flex items-center bg-primary text-white px-4 py-2 rounded-md transition duration-200"
            disabled={isModalOpen}
          >
            <FiPlus className="mr-2" />
            Thêm mới
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* Search Box */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setCurrentPage(0);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              placeholder="Tìm kiếm theo tên danh mục..."
              disabled={loading || isModalOpen}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className={`bg-white shadow rounded-lg overflow-hidden ${isModalOpen ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã danh mục
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên danh mục
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.categoryCode} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.categoryCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.categoryName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.description || 'Không có mô tả'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openModal(category)}
                            className="text-amber-600 hover:text-amber-900 transition duration-150"
                            disabled={loading || isModalOpen}
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 className="inline-block" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.categoryCode)}
                            className="text-red-600 hover:text-red-900 transition duration-150"
                            disabled={loading || isModalOpen}
                            title="Xóa"
                          >
                            <FiTrash2 className="inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0 || loading || isModalOpen}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                      disabled={currentPage === totalPages - 1 || loading || isModalOpen}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Sau
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                          disabled={currentPage === 0 || loading || isModalOpen}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Trước</span>
                          <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                          disabled={currentPage === totalPages - 1 || loading || isModalOpen}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Sau</span>
                          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có danh mục nào được tìm thấy.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editCategory ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleCreateOrUpdateCategory} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                      Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="categoryName"
                      value={newCategory.categoryName}
                      onChange={(e) => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      placeholder="Nhập tên danh mục..."
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Mô tả
                    </label>
                    <textarea
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      placeholder="Nhập mô tả..."
                    />
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                      {editCategory ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;