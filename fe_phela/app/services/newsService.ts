
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

export interface News {
  newsId: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsCreateDTO {
  title: string;
  summary?: string;
  content: string;
  imageFile?: File;
}

export interface NewsUpdateDTO {
  title?: string;
  summary?: string;
  content?: string;
  imageFile?: File;
}

// PUBLIC ENDPOINTS - No authentication required
export const getPublicNews = async () => {
  const response = await publicApi.get('/api/news');
  return response.data;
};

export const getPublicNewsById = async (newsId: string) => {
  const response = await publicApi.get(`/api/news/${newsId}`);
  return response.data;
};

export const searchPublicNews = async (searchParams: {
  title?: string;
  page?: number;
  size?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const response = await publicApi.get(`/api/news/search?${params.toString()}`);
  return response.data;
};

// ADMIN ENDPOINTS - Require admin authentication
export const getAllNewsAdmin = async (page: number = 0, size: number = 10) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await api.get(`/api/admin/news?${params.toString()}`);
  return response.data;
};

export const getNewsById = async (newsId: string) => {
  const response = await api.get(`/api/admin/news/${newsId}`);
  return response.data;
};

export const createNews = async (newsData: NewsCreateDTO | FormData) => {
  let formData: FormData;
  
  if (newsData instanceof FormData) {
    // If FormData is passed directly (from components)
    formData = newsData;
  } else {
    // If NewsCreateDTO object is passed
    formData = new FormData();
    formData.append('title', newsData.title);
    formData.append('summary', newsData.summary || '');
    formData.append('content', newsData.content);

    if (newsData.imageFile) {
      formData.append('thumbnail', newsData.imageFile);
    }
  }

  const response = await api.post('/api/admin/news', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateNews = async (newsId: string, newsData: NewsUpdateDTO | FormData) => {
  let formData: FormData;
  
  if (newsData instanceof FormData) {
    // If FormData is passed directly (from components)
    formData = newsData;
  } else {
    // If NewsUpdateDTO object is passed
    formData = new FormData();
    if (newsData.title) formData.append('title', newsData.title);
    if (newsData.summary) formData.append('summary', newsData.summary);
    if (newsData.content) formData.append('content', newsData.content);
    if (newsData.imageFile) formData.append('thumbnail', newsData.imageFile);
  }

  const response = await api.put(`/api/admin/news/${newsId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteNews = async (newsId: string) => {
  const response = await api.delete(`/api/admin/news/${newsId}`);
  return response.data;
};

// Alias for backwards compatibility
export const getAllNews = getAllNewsAdmin;