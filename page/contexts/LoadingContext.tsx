import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LoadingContextType {
  isInitialLoading: boolean;
  isRouteChanging: boolean;
  loadingKey: number; // 用于强制重新渲染
  startLoading: () => void;
  stopLoading: () => void;
  showLoadingOnRouteChange: boolean;
  setShowLoadingOnRouteChange: (show: boolean) => void;
}

// 创建初始值
const LoadingContext = createContext<LoadingContextType>({
  isInitialLoading: true,
  isRouteChanging: false,
  loadingKey: 0,
  startLoading: () => {},
  stopLoading: () => {},
  showLoadingOnRouteChange: false, // 默认不在路由切换时显示加载
  setShowLoadingOnRouteChange: () => {}
});

// 自定义Hook，便于使用上下文
export const useLoading = () => useContext(LoadingContext);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  // 初始加载标志
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // 路由变化标志
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  // 强制重新渲染的key
  const [loadingKey, setLoadingKey] = useState(0);
  // 是否在路由切换时显示加载画面
  const [showLoadingOnRouteChange, setShowLoadingOnRouteChange] = useState(false);
  
  // 初始加载逻辑
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window !== 'undefined') {
      // 大幅减少初始加载时间
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300); // 从500ms减少到300ms
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // 启动加载状态
  const startLoading = () => {
    if (showLoadingOnRouteChange) {
      setIsRouteChanging(true);
    }
  };
  
  // 停止加载状态
  const stopLoading = () => {
    setIsRouteChanging(false);
    // 增加key以触发重新渲染
    setLoadingKey(prev => prev + 1);
  };
  
  return (
    <LoadingContext.Provider
      value={{
        isInitialLoading,
        isRouteChanging,
        loadingKey,
        startLoading,
        stopLoading,
        showLoadingOnRouteChange,
        setShowLoadingOnRouteChange
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}; 