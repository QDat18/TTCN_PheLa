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

export interface Branch {
  branchCode: string;
  branchName: string;
  address: string;
  phoneNumber: string;
  email?: string;
  city: string;
  district: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  openingTime?: string;
  closingTime?: string;
}

export interface BranchCreateDTO {
  branchName: string;
  address: string;
  phoneNumber: string;
  email?: string;
  city: string;
  district: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
}

export interface BranchUpdateDTO {
  branchName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  city?: string;
  district?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
}

// PUBLIC ENDPOINTS - No authentication required
export const getPublicBranches = async () => {
  const response = await publicApi.get('/api/branch');
  return response.data;
};

export const getPublicBranchByCode = async (branchCode: string) => {
  const response = await publicApi.get(`/api/branch/${branchCode}`);
  return response.data;
};

export const getPublicBranchesByCity = async (city: string) => {
  const response = await publicApi.get(`/api/branch/by-city?city=${encodeURIComponent(city)}`);
  return response.data;
};

export const getPublicBranchesByDistrict = async (district: string) => {
  const response = await publicApi.get(`/api/branch/by-district?district=${encodeURIComponent(district)}`);
  return response.data;
};

export const searchPublicBranches = async (searchParams: {
  city?: string;
  district?: string;
  name?: string;
}) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const response = await publicApi.get(`/api/branch/search?${params.toString()}`);
  return response.data;
};

// ADMIN ENDPOINTS - Require admin authentication
export const getAllBranchesAdmin = async (page: number = 0, size: number = 10, search?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await api.get(`/api/admin/branches?${params.toString()}`);
  return response.data;
};

export const createBranch = async (branchData: BranchCreateDTO) => {
  const response = await api.post('/api/admin/branches', branchData);
  return response.data;
};

export const updateBranch = async (branchCode: string, branchData: BranchUpdateDTO) => {
  const response = await api.put(`/api/admin/branches/${branchCode}`, branchData);
  return response.data;
};

export const deleteBranch = async (branchCode: string) => {
  const response = await api.delete(`/api/admin/branches/${branchCode}`);
  return response.data;
};

export const getBranchStatistics = async () => {
  const response = await api.get('/api/admin/branches/statistics');
  return response.data;
};