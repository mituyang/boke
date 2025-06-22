'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, userToken?: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: User) => void;
  isAdmin: () => boolean;
  isLoggedIn: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // 使用 Cookie 认证，无需手动传递 token
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // 确保发送 cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken('cookie-based'); // 标记使用 cookie 认证
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User, userToken?: string) => {
    setUser(userData);
    setToken('cookie-based'); // 使用 cookie 认证
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' // 确保发送 cookies
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isLoggedIn = () => {
    return user !== null;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    checkAuth,
    updateUser,
    isAdmin,
    isLoggedIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 保护管理员页面的高阶组件
export function withAdminAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AdminProtectedComponent(props: T) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user || !isAdmin()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">访问被拒绝</h2>
            <p className="text-gray-600 mb-4">您需要管理员权限才能访问此页面</p>
            <a
              href="/login?returnUrl=/admin"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              登录
            </a>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// 保护需要登录的页面的高阶组件
export function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthProtectedComponent(props: T) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h2>
            <p className="text-gray-600 mb-4">请登录后继续操作</p>
            <a
              href="/login"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              登录
            </a>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
} 