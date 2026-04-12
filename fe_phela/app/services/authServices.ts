import api from '../config/axios';
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
  withCredentials: true, // Enable sending cookies and credentials
});

// Interface cho dữ liệu đăng nhập
export interface LoginCredentials {
    username: string;
    password: string;
  }

  // Interface cho dữ liệu đăng ký Customer (dựa trên CustomerCreateDTO)
  export interface CustomerRegisterData {
    username: string;
    password: string;
    email: string;
    gender: string;
    latitude?: number;
    longitude?: number;
  }

  // Interface cho dữ liệu đăng ký Admin (dựa trên AdminCreateDTO)
  export interface AdminRegisterData {
    fullname: string;
    username: string;
    password: string;
    dob: string; // Chuỗi định dạng "dd/MM/yyyy" theo DTO
    email: string;
    phone: string;
    gender: string;
  }

  // Interface cho yêu cầu quên mật khẩu
  export interface ForgotPasswordRequest {
    email: string;
  }

  // Interface cho xác nhận OTP và đặt lại mật khẩu
  export interface VerifyOtpAndResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
  }

// Đăng nhập cho Admin
export const loginAdmin = async (credentials: LoginCredentials) => {
  try {
    const response = await api.post('/auth/admin/login', credentials);
    return response.data;
  } catch (error: any) {
    // Preserve the original error with backend details
    throw error;
  }
};

// Đăng nhập cho Customer
export const loginCustomer = async (credentials: LoginCredentials) => {
  try {
    const response = await api.post('/auth/customer/login', credentials);
    return response.data;
  } catch (error: any) {
    // Preserve the original error with backend details
    throw error;
  }
};
// Đăng ký cho Admin
export const registerAdmin = async (data: AdminRegisterData) => {
    try {
        const response = await api.post('/auth/admin/register', data);
        // localStorage.setItem('token', response.data.token); // Lưu token
        return response.data;
    } catch (error: any) {
        // Preserve the original error with backend details
        throw error;
    }
};

// Đăng ký cho Customer
export const registerCustomer = async (data: CustomerRegisterData) => {
    try {
      const response = await api.post('/auth/customer/register', data);
      // localStorage.setItem('token', response.data.token); // Lưu token
      return response.data;
    } catch (error: any) {
      // Preserve the original error with backend details
      throw error;
    }
};


// Hàm đăng xuất
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ========================
// CUSTOMER PASSWORD RESET
// ========================

// Gửi OTP để đặt lại mật khẩu Customer
export const sendOtpForCustomerPasswordReset = async (email: string) => {
  try {
    const response = await publicApi.post('/auth/forgot-password/send-otp', { email });
    return response.data;
  } catch (error: any) {
    // Preserve the original error with backend details
    throw error;
  }
};

// Xác nhận OTP và đặt lại mật khẩu Customer
export const verifyOtpAndResetCustomerPassword = async (data: VerifyOtpAndResetPasswordRequest) => {
  try {
    const response = await publicApi.post('/auth/forgot-password/reset', data);
    return response.data;
  } catch (error: any) {
    // Preserve the original error with backend details
    throw error;
  }
};

// ========================
// ADMIN PASSWORD RESET
// ========================

// Gửi OTP để đặt lại mật khẩu Admin
export const sendOtpForAdminPasswordReset = async (email: string) => {
  try {
    const response = await publicApi.post('/auth/admin/forgot-password/send-otp', { email });
    return response.data;
  } catch (error: any) {
    // Preserve the original error with backend details
    throw error;
  }
};

// Xác nhận OTP và đặt lại mật khẩu Admin
export const verifyOtpAndResetAdminPassword = async (data: VerifyOtpAndResetPasswordRequest) => {
  try {
    const response = await publicApi.post('/auth/admin/forgot-password/reset', data);
    return response.data;
  } catch (error: any) {
    // Preserve the original error with backend details
    throw error;
  }
};