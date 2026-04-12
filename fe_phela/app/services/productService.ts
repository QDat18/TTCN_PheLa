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
  withCredentials: true,
});

export interface Product {
  productId: string;
  productName: string;
  description: string;
  originalPrice: number;
  imageUrl: string;
  status: string;
  categoryCode?: string;
}

export interface ProductCreateDTO {
  productName: string;
  description: string;
  originalPrice: number;
  categoryCode: string;
  imageFile?: File;
}

export interface ProductUpdateDTO {
  productName?: string;
  description?: string;
  originalPrice?: number;
  categoryCode?: string;
  imageFile?: File;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// PUBLIC ENDPOINTS - No authentication required
export const getPublicProducts = async () => {
  const response = await publicApi.get('/api/product/all');
  return response.data;
};

export const getPublicProductsByCategory = async (categoryCode: string) => {
  const response = await publicApi.get(`/api/product/category/${categoryCode}`);
  return response.data;
};

export const getPublicProductById = async (productId: string) => {
  const response = await publicApi.get(`/api/product/get/${productId}`);
  return response.data;
};

export const searchPublicProducts = async (searchParams: {
  name?: string;
  categoryCode?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const response = await publicApi.get(`/api/product/search?${params.toString()}`);
  return response.data;
};

// ADMIN ENDPOINTS - Require admin authentication
export const getAllProductsAdmin = async (page: number = 0, size: number = 10, search?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await api.get(`/api/admin/products?${params.toString()}`);
  return response.data;
};

export const createProduct = async (productData: ProductCreateDTO) => {
  const formData = new FormData();
  formData.append('productName', productData.productName);
  formData.append('description', productData.description);
  formData.append('originalPrice', productData.originalPrice.toString());
  formData.append('categoryCode', productData.categoryCode);

  if (productData.imageFile) {
    formData.append('imageFile', productData.imageFile);
  }

  const response = await api.post('/api/admin/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProduct = async (productId: string, productData: ProductUpdateDTO) => {
  const formData = new FormData();

  if (productData.productName) formData.append('productName', productData.productName);
  if (productData.description) formData.append('description', productData.description);
  if (productData.originalPrice) formData.append('originalPrice', productData.originalPrice.toString());
  if (productData.categoryCode) formData.append('categoryCode', productData.categoryCode);
  if (productData.imageFile) formData.append('imageFile', productData.imageFile);

  const response = await api.put(`/api/admin/products/${productId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProductStatus = async (productId: string, status: ProductStatus) => {
  const response = await api.patch(`/api/admin/products/${productId}/status`, null, {
    params: { status }
  });
  return response.data;
};

export const deleteProduct = async (productId: string) => {
  const response = await api.delete(`/api/admin/products/${productId}`);
  return response.data;
};

// CUSTOMER ENDPOINTS - Require customer authentication
export const addToCart = async (productId: string, quantity: number = 1) => {
  const response = await api.post('/api/customer/cart/add', {
    productId,
    quantity
  });
  return response.data;
};

export const getCustomerProducts = async () => {
  const response = await api.get('/api/customer/products');
  return response.data;
};