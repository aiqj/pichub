import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();
  // 添加客户端渲染检测
  const [isClient, setIsClient] = useState(false);

  // 在组件挂载后设置isClient为true
  useEffect(() => {
    setIsClient(true);
    console.log('Layout状态：', { isAuthenticated, loading, path: router.pathname });
  }, [isAuthenticated, loading, router.pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isAdminRoute = router.pathname.startsWith('/admin');
  const isLoginPage = router.pathname === '/login';
  const isRegisterPage = router.pathname === '/register';
  const isAuthPage = isLoginPage || isRegisterPage;

  // 客户端导航控制 - 只在客户端执行
  useEffect(() => {
    if (!isClient) return;

    // 如果认证状态正在加载，不执行任何操作，等待加载完成
    if (loading) {
      console.log('Layout: 认证状态加载中，等待...');
      return;
    }

    // 如果用户未登录且不在登录/注册页面，重定向到登录页
    if (!loading && !isAuthenticated && !isAuthPage) {
      console.log('Layout: 用户未认证，重定向到登录页');
      router.push('/login');
      return;
    }

    // 如果用户已登录且在登录/注册页面，重定向到首页
    if (!loading && isAuthenticated && isAuthPage) {
      console.log('Layout: 用户已认证但在登录页，重定向到首页');
      router.push('/');
      return;
    }

    // 如果用户不是管理员但尝试访问管理员页面，重定向到首页
    if (!loading && user && user.role !== 'admin' && isAdminRoute) {
      console.log('Layout: 非管理员用户访问管理页面，重定向到首页');
      router.push('/');
      return;
    }
  }, [isClient, loading, isAuthenticated, isAuthPage, user, isAdminRoute, router]);

  // 对于服务端渲染，始终渲染完整布局以保持一致
  // 客户端导航会在useEffect中处理
  
  // 如果正在客户端并且认证状态加载中，显示加载状态
  if (isClient && loading) {
    console.log('Layout: 认证状态加载中，显示加载界面');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400 ml-3">正在载入...</p>
      </div>
    );
  }

  // 已通过所有重定向检查，渲染正常布局
  console.log('Layout: 渲染正常布局内容');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* 导航栏 - 只在用户登录后显示 */}
      {(!isClient || isAuthenticated) && !isAuthPage && (
        <nav className="bg-black/30 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
                    PicHub
                  </span>
                </Link>
              </div>
              <div className="flex items-center">
                <div className="space-x-4">
                  <Link
                    href="/"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      router.pathname === '/' ? 'text-indigo-400' : 'text-gray-300 hover:text-indigo-300'
                    }`}
                  >
                    上传
                  </Link>

                  <Link
                    href="/files"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      router.pathname === '/files' ? 'text-indigo-400' : 'text-gray-300 hover:text-indigo-300'
                    }`}
                  >
                    我的文件
                  </Link>
                  
                  {(!isClient || (user && user.role === 'admin')) && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isAdminRoute ? 'text-indigo-400' : 'text-gray-300 hover:text-indigo-300'
                      }`}
                    >
                      管理面板
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-indigo-300"
                  >
                    退出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* 页面内容 */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-gray-700 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} PicHub. 保留所有权利。
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-indigo-400">
                <span className="sr-only">Github</span>
                <svg t="1743527862263" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5374" width="24" height="24"><path d="M536.380952 146.285714h146.285715l341.333333 292.571429-195.047619 292.571428-474.453333-79.091809L292.571429 1024H146.285714l24.380953-146.285714h-146.285715l8.143238-48.761905h146.285715L195.047619 731.428571H48.761905l8.143238-48.761904h146.285714l16.237714-97.52381h-146.285714l8.143238-48.761905h146.285715L243.809524 438.857143H97.52381l8.143238-48.761905h146.285714L268.190476 292.571429h-146.285714l8.143238-48.761905h146.285714L292.571429 146.285714h97.523809l146.285714-146.285714v146.285714z m-165.790476 409.892572l412.184381 68.705524 112.152381-168.228572L646.582857 243.809524H422.619429l-52.077715 312.368762zM585.142857 390.095238c-26.916571 0-48.761905-17.749333-48.761905-44.665905s-3.023238-44.665905 23.893334-44.665904c26.965333 0 98.011429 36.08381 98.011428 63.000381S612.059429 390.095238 585.142857 390.095238z" fill="#6366f1" p-id="5375"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 