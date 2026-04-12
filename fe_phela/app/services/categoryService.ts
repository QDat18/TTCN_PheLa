import api from '~/config/axios';
import axios from 'axios';

// Get API base URL for public endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phela-backend-dyl7.onrender.com';

// Create a separate axios instance for public endpoints (no auth required)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Category {
  categoryCode: string;
  categoryName: string;
  description: string;
}

export interface CategoryCreateDTO {
  categoryName: string;
  description: string;
}

export interface CategoryUpdateDTO {
  categoryName?: string;
  description?: string;
}

// PUBLIC ENDPOINTS - No authentication required
export const getPublicCategories = async () => {
  const response = await publicApi.get('/api/categories/getAll');
  return response.data;
};

export const getPublicCategoryByCode = async (categoryCode: string) => {
  const response = await publicApi.get(`/api/categories/${categoryCode}`);
  return response.data;
};

export const searchPublicCategories = async (searchParams: {
  name?: string;
  page?: number;
  size?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const response = await publicApi.get(`/api/categories/search?${params.toString()}`);
  return response.data;
};

// ADMIN ENDPOINTS - Require admin authentication
export const getAllCategoriesAdmin = async (page: number = 0, size: number = 10, search?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await api.get(`/api/admin/categories?${params.toString()}`);
  return response.data;
};

export const createCategory = async (categoryData: CategoryCreateDTO) => {
  const response = await api.post('/api/admin/categories', categoryData);
  return response.data;
};

export const updateCategory = async (categoryCode: string, categoryData: CategoryUpdateDTO) => {
  const response = await api.put(`/api/admin/categories/${categoryCode}`, categoryData);
  return response.data;
};

export const deleteCategory = async (categoryCode: string) => {
  const response = await api.delete(`/api/admin/categories/${categoryCode}`);
  return response.data;
};

export const getCategoryStatistics = async () => {
  const response = await api.get('/api/admin/categories/statistics');
  return response.data;
};

// CUSTOMER ENDPOINTS - Require customer authentication (if any specific customer category endpoints exist)
export const getCustomerFavoriteCategories = async () => {
  const response = await api.get('/api/customer/categories/favorites');
  return response.data;
};