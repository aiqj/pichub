import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../utils/api';

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
  
  // 初始化时检查是否已有保存的身份验证信息
  const initializeAuth = async () => {
    try {
      // 只在客户端执行
      if (typeof window === 'undefined') {
        setLoading(false);
        return false;
      }
      
      console.log('开始验证认证状态...');
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('本地Token:', token ? '存在' : '不存在');
      console.log('本地User数据:', savedUser ? '存在' : '不存在');
      
      if (!token || !savedUser) {
        console.log('没有本地认证信息，认证未通过');
        // 如果没有token或用户信息，就直接结束加载状态
        setLoading(false);
        return false;
      }
      
      // 使用本地存储的用户数据设置认证状态
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('解析本地用户数据成功:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('认证初始化完成: 已认证');
        return true;
      } catch (parseError) {
        console.error('解析本地用户数据失败:', parseError);
        // 如果解析失败，清除本地存储但不重定向
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
    } catch (error) {
      console.error('认证初始化过程中发生错误:', error);
      return false;
    } finally {
      // 无论如何都结束加载状态
      setLoading(false);
    }
  };
  
  // 手动检查认证状态的函数，可以在需要时调用
  const checkAuth = async () => {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (!token || !savedUser) {
        return false;
      }
      
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return true;
      } catch (e) {
        console.error('解析用户数据失败:', e);
        return false;
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      return false;
    }
  };
  
  useEffect(() => {
    initializeAuth();
  }, []);

  // 登录函数
  const login = (token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('登录成功，保存认证信息到本地存储');
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  // 登出函数
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('登出成功，清除本地存储的认证信息');
    }
    setUser(null);
    setIsAuthenticated(false);
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
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 