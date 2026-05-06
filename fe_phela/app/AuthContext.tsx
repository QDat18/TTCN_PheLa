import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from './config/axios';
import { supabase } from './utils/supabaseClient';

// Định nghĩa các Interface cho User
export interface BaseUser {
  id: string;
  username: string;
  fullname?: string;
  email: string;
  role: string;
  token?: string;
}

export interface CustomerUser extends BaseUser {
  type: 'customer';
  customerId: string;
  pointUse: number;
  currentNotes: number;
  membershipTier: string;
  gender?: string;
  latitude?: number;
  longitude?: number;
}

export interface AdminUser extends BaseUser {
  type: 'admin';
  adminId: string;
}

export type User = CustomerUser | AdminUser;

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const storedUserRaw = localStorage.getItem('user');
    if (!storedUserRaw) return;

    try {
      const storedUser = JSON.parse(storedUserRaw) as User;
      if (storedUser.type === 'customer' && storedUser.customerId) {
        // Fetch fresh data from API - use a direct axios call to avoid the 401 interceptor redirect
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/customer/getById/${storedUser.customerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn(`refreshUser failed with status ${response.status}. Will not redirect.`);
          return; // Silently fail - don't trigger redirect loop
        }

        const freshData = await response.json();

        // Merge with existing user (preserving token)
        const updatedUser = {
          ...storedUser,
          ...freshData,
          type: 'customer' // Ensure type is preserved
        } as CustomerUser;

        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // DO NOT throw or redirect - this prevents the infinite loop
    }
  };

  useEffect(() => {
    // 1. Lắng nghe trạng thái đăng nhập từ Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('--- SUPABASE DEBUG ---');
      // console.log('Event:', event);
      // console.log('Session is null?', !session);
      // console.log('Current URL Hash:', window.location.hash);

      if (session && session.user) {
        // console.log('Logged in User:', session.user.email);
        // Chỉ auto login supabase cho user ngoài trang admin
        if (window.location.pathname.startsWith('/admin')) {
          return;
        }

        const userData: CustomerUser = {
          id: session.user.id,
          customerId: session.user.id,
          username: session.user.email || 'Google User',
          email: session.user.email || '',
          role: 'CUSTOMER',
          type: 'customer',
          token: session.access_token,
          pointUse: 0,
          currentNotes: 0,
          membershipTier: 'MEMBER',
          gender: 'OTHER'
        };

        const existingToken = localStorage.getItem('token');
        if (existingToken !== session.access_token) {
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          // Lấy thêm thông tin từ Backend
          refreshUser();
        }
      } else if (event === 'SIGNED_OUT') {
        // handleLogout();
      }
    });

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUserRaw = localStorage.getItem('user');

      if (storedToken && storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw) as User;
          setUser(storedUser);

          // Refresh user data silently on init if it's a customer
          if (storedUser.type === 'customer') {
            refreshUser();
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('token', userData.token || '');
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;

    try {
      // Create updated user object
      const updatedUser = { ...user, ...data } as User;

      // Update state and storage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('User profile updated locally:', updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout: handleLogout,
      loading,
      updateUserProfile,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Robust role checking functions
export const isCustomerUser = (user: User | null): user is CustomerUser => {
  if (!user) return false;
  return user.type === 'customer';
};

export const isAdminUser = (user: User | null): user is AdminUser => {
  if (!user) return false;
  return user.type === 'admin';
};