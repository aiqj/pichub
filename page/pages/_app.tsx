import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LoadingProvider, useLoading } from '../contexts/LoadingContext';
import Layout from '../components/layout/Layout';
import LoadingScreen from '../components/ui/LoadingScreen';
import dynamic from 'next/dynamic';
import '../styles/globals.css';

// 动态导入ToastContainer，减少首屏加载时间
const ToastContainer = dynamic(
  () => import('react-toastify').then((mod) => mod.ToastContainer),
  { ssr: false }
);

// 动态导入样式，只在客户端加载
const DynamicToastStyles = () => {
  useEffect(() => {
    // 直接导入CSS会在服务端代码中报错，所以只在客户端执行
    if (typeof window !== 'undefined') {
      require('react-toastify/dist/ReactToastify.css');
    }
  }, []);
  return null;
};

// 扩展类型以支持noLayout标志
type CustomAppProps = AppProps & {
  Component: AppProps['Component'] & {
    noLayout?: boolean;
  };
};

// 主应用容器组件，用于处理路由切换和加载状态
const AppContainer = ({ Component, pageProps, router }: CustomAppProps) => {
  const { 
    isInitialLoading, 
    isRouteChanging, 
    startLoading, 
    stopLoading,
    showLoadingOnRouteChange
  } = useLoading();
  
  // 是否显示加载界面 - 只在初始加载或路由改变且设置了显示时才显示
  const showLoading = isInitialLoading || (isRouteChanging && showLoadingOnRouteChange);
  
  // 使用路由路径作为key，确保组件不会复用
  const pageKey = router.pathname;
  
  // 内容是否可见（加载完成后才显示）
  const [contentVisible, setContentVisible] = useState(!isInitialLoading);
  
  // 监听加载状态变化
  useEffect(() => {
    if (!showLoading && !contentVisible) {
      // 如果加载完成但内容还未显示，则显示内容
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100); // 从300ms减少到100ms，更快显示内容
      return () => clearTimeout(timer);
    } else if (showLoading && contentVisible) {
      // 如果开始加载但内容还在显示，则隐藏内容
      setContentVisible(false);
    }
  }, [showLoading, contentVisible]);
  
  // 路由切换监听
  useEffect(() => {
    const handleStart = (url: string) => {
      // 检查是否是登录/登出相关路由
      const isAuthRoute = url === '/login' || url === '/register';
      const fromAuthRoute = router.pathname === '/login' || router.pathname === '/register';
      
      // 如果是登录/登出相关导航，不显示加载屏幕
      if (isAuthRoute || fromAuthRoute) {
        // 登录/登出导航不显示加载
        return;
      }
      
      startLoading();
    };
    
    const handleComplete = () => {
      // 减少延迟时间
      setTimeout(() => {
        stopLoading();
      }, 200); // 从500ms减少到200ms
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router, startLoading, stopLoading]);
  
  // 添加性能监控
  useEffect(() => {
    // 页面加载性能监控
    if (typeof window !== 'undefined') {
      const reportWebVitals = () => {
        const perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries.length > 0) {
          const timing = perfEntries[0] as PerformanceNavigationTiming;
          // 计算页面加载时间
          console.log(`页面加载时间: ${timing.loadEventEnd - timing.startTime}ms`);
        }
      };
      
      // 页面加载完成后报告性能指标
      window.addEventListener('load', reportWebVitals);
      return () => window.removeEventListener('load', reportWebVitals);
    }
  }, [router.pathname]);

  return (
    <>
      {/* 使用加载屏幕组件 */}
      <LoadingScreen isVisible={showLoading} />
      
      <DynamicToastStyles />
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* 内容区域，使用类名控制渐变效果 */}
      <div className={contentVisible ? 'content-visible' : 'content-hidden'}>
        {Component.noLayout ? (
          // 无布局的组件(如登录页)直接渲染
          <Component {...pageProps} key={pageKey} />
        ) : (
          // 有布局的组件使用Layout包装
          <Layout>
            <Component {...pageProps} key={pageKey} />
          </Layout>
        )}
      </div>
    </>
  );
};

// 主应用入口
function MyApp(props: CustomAppProps) {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
          <AppContainer {...props} />
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default MyApp;