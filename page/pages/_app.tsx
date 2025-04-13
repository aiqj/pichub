import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

// 扩展类型以支持noLayout标志
type CustomAppProps = AppProps & {
  Component: AppProps['Component'] & {
    noLayout?: boolean;
  };
};

function MyApp({ Component, pageProps, router }: CustomAppProps) {

  // 使用路由路径作为key,确保组件不会复用
  const pageKey = router.pathname;

  // 包裹在AuthProvider中,确保认证状态可用于整个应用
  // 直接渲染内容，不再有 isMounted 条件判断
  return (
    <AuthProvider>
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