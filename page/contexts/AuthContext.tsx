import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../utils/api';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  updateUserData: (userData: Partial<User>) => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: true,
  updateUserData: () => {},
  checkAuth: () => Promise.resolve(false),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // 初始化认证状态
  useEffect(() => {
    const initAuthStatus = () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (!token || !savedUser) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // 解析保存的用户数据
        const parsedUser = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
        setLoading(false);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        // 清除任何可能损坏的数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    };
    
    initAuthStatus();
  }, []);
  
  // 检查认证状态的函数
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
      
      // 尝试获取用户信息以验证token
      const response = await authApi.getUserInfo();
      
      if (response.data && response.data.success) {
        const userData = response.data.user;
        
        try {
          // 确保我们更新本地存储的用户数据和状态
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          setIsAuthenticated(true);
          return true;
        } catch (e) {
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          return false;
        }
      } else {
        // 响应无效，可能token已过期
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      // API调用异常或token无效
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };
  
  // 登录函数
  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };
  
  // 登出函数
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    
    // 重定向到登录页
    router.push('/login');
  };

  // 更新用户数据
  const updateUserData = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        updateUserData,
        checkAuth: checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 