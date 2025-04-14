import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
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

function MyApp({ Component, pageProps, router }: CustomAppProps) {
  // 使用路由路径作为key,确保组件不会复用
  const pageKey = router.pathname;
  
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

  // 包裹在AuthProvider中,确保认证状态可用于整个应用
  return (
    <AuthProvider>
      <DynamicToastStyles />
      <ToastContainer position="top-right" autoClose={3000} />
      {Component.noLayout ? (
        // 无布局的组件(如登录页)直接渲染
        <Component {...pageProps} key={pageKey} />
      ) : (
        // 有布局的组件使用Layout包装
        <Layout>
          <Component {...pageProps} key={pageKey} />
        </Layout>
      )}
    </AuthProvider>
  );
}

export default MyApp;