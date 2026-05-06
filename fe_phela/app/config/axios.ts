import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { supabase } from '../utils/supabaseClient';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// Tạo một instance của Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Reduced from 60s to 30s for better responsiveness
  headers: {},
  withCredentials: true,
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ===========================
// REQUEST INTERCEPTOR
// ===========================
// Phân biệt rõ 2 loại token:
// - Admin: dùng JWT nội bộ (lưu trong localStorage 'token')
// - Customer: dùng token Supabase (lấy qua supabase.auth.getSession())
api.interceptors.request.use(
  async (config) => {
    const storedUserRaw = localStorage.getItem('user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

    if (storedUser?.type === 'admin') {
      // Admin: gắn JWT nội bộ từ localStorage
      const adminToken = localStorage.getItem('token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Customer: ưu tiên lấy token Supabase mới nhất từ session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        // Fallback: dùng token trong localStorage nếu Supabase session không có
        const localToken = localStorage.getItem('token');
        if (localToken) {
          config.headers.Authorization = `Bearer ${localToken}`;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===========================
// RESPONSE INTERCEPTOR
// ===========================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Retry logic for network errors or 5xx on GET requests
    if (config && config.method === 'get' && (!response || response.status >= 500)) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        console.warn(`[Axios] Retrying request (${config.__retryCount}/${MAX_RETRIES}): ${config.url}`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.__retryCount));
        return api(config);
      }
    }

    console.error('API Error:', error);
    
    // Generic timeout handling
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('Request timed out. Please check your connection.');
    }

    if (response?.status === 401) {
      const storedUserRaw = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

      // Nếu chưa đăng nhập thì không redirect (tránh loop ở login page)
      if (!storedUser && !storedToken) {
        return Promise.reject(error);
      }

      // Chỉ xóa token và redirect nếu KHÔNG phải admin
      // Admin bị 401 có thể do nhiều nguyên nhân khác, không nên tự động logout
      if (storedUser?.type !== 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login-register';
      } else {
        // Admin bị 401: log warning, KHÔNG xóa token hay redirect
        console.warn('[AdminAuth] Received 401. Token may be expired. Please re-login manually.');
      }
    }

    if (error.response?.status === 403) {
      console.warn('Access forbidden. User may not have required role.');
    }

    return Promise.reject(error);
  }
);

export default api;