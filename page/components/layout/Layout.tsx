import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface DropdownPosition {
  top: number;
  left: number;
  avatarLeft?: number; // 添加可选的avatarLeft属性
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();
  // 添加客户端渲染检测
  const [isClient, setIsClient] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const userAvatarRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // 在组件挂载后设置isClient为true
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isAdminRoute = router.pathname.startsWith('/admin');
  const isLoginPage = router.pathname === '/login';
  const isRegisterPage = router.pathname === '/register';
  const isAuthPage = isLoginPage || isRegisterPage;

  // 路由变化处理
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // 更新当前路径状态
      setCurrentPath(url);
    };
    
    // 订阅路由变化事件
    router.events.on('routeChangeComplete', handleRouteChange);
    
    // 清理函数
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  // 处理认证重定向逻辑
  useEffect(() => {
    // 如果还在加载认证状态，先不重定向
    if (loading) {
      return;
    }
    
    // 获取当前页面路径
    const path = router.pathname;
    
    // 非认证用户尝试访问需要认证的页面，重定向到登录页
    if (!isAuthenticated && path !== '/login' && path !== '/register') {
      router.push('/login');
      return;
    }
    
    // 已认证用户访问登录或注册页，重定向到首页
    if (isAuthenticated && (path === '/login' || path === '/register')) {
      router.push('/');
      return;
    }
    
    // 非管理员用户访问管理页面，重定向到首页
    if (isAuthenticated && user && user.role !== 'admin' && path.startsWith('/admin')) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, loading, router, user, router.pathname]);

  // 点击其他地方时关闭下拉菜单
  useEffect(() => {
    if (!isClient || !dropdownOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userAvatarRef.current && !userAvatarRef.current.contains(target)) {
        // 检查点击的元素不是下拉菜单内的元素
        const dropdownElements = document.querySelectorAll('.dropdown-menu-item');
        for (let i = 0; i < dropdownElements.length; i++) {
          if (dropdownElements[i].contains(target)) {
            return;
          }
        }
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClient, dropdownOpen]);
  
  // 处理下拉菜单的位置计算和切换
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡
    
    if (userAvatarRef.current) {
      const rect = userAvatarRef.current.getBoundingClientRect();
      // 计算屏幕右边缘
      const windowWidth = window.innerWidth;
      
      // 菜单宽度为192px (w-48)
      const menuWidth = 192;
      
      // 确保菜单不会超出右侧边缘
      let leftPosition = rect.right - menuWidth;
      if (leftPosition + menuWidth > windowWidth - 20) {
        leftPosition = windowWidth - menuWidth - 20; // 保留20px的边距
      }
      
      // 确保菜单不会超出左侧边缘
      if (leftPosition < 20) {
        leftPosition = 20;
      }
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8, // 添加8px的空间，避免紧贴头像
        left: leftPosition,
        avatarLeft: rect.left + rect.width / 2, // 存储头像中心点用于箭头对齐
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  // 对于服务端渲染，始终渲染完整布局以保持一致
  // 客户端导航会在useEffect中处理
  
  // 如果正在客户端并且认证状态加载中，显示加载状态
  if (isClient && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400 ml-3">正在载入...</p>
      </div>
    );
  }

  // 已通过所有重定向检查，渲染正常布局
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
                <div className="flex items-center space-x-4">
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
                  
                  <div className="relative px-3 py-2">
                    <div 
                      ref={userAvatarRef}
                      className="relative group cursor-pointer flex items-center"
                      onClick={handleToggleDropdown}
                    >
                      <div className="h-8 w-8 rounded-full border border-gray-600 hover:border-indigo-400 flex items-center justify-center overflow-hidden bg-gray-700">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="用户头像"
                            className="h-8 w-8 object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-300">
                            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                          </span>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded whitespace-nowrap">
                        {user?.username || "用户"}
                      </div>
                    </div>
                    
                    {/* 使用Portal将下拉菜单渲染到body */}
                    {isClient && dropdownOpen && createPortal(
                      <div className="fixed z-[99999]" style={{ top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                        <div 
                          className="absolute w-48 rounded-md shadow-lg py-1 bg-gray-800 border border-gray-700 dropdown-menu transform transition-transform duration-200 ease-out origin-top-right"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            pointerEvents: 'auto',
                          }}
                          onClick={(e) => e.stopPropagation()} // 防止点击菜单时关闭菜单
                        >
                          {/* 箭头指示器 */}
                          <div 
                            className="absolute w-3 h-3 bg-gray-800 border-t border-l border-gray-700 transform rotate-45"
                            style={{ 
                              top: '-6px', 
                              left: `${dropdownPosition.avatarLeft - dropdownPosition.left - 6}px`,
                            }}
                          ></div>
                          
                          <div className="relative z-10"> {/* 确保内容在箭头上方 */}
                            <div 
                              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-indigo-400 cursor-pointer dropdown-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(false);
                                router.push('/profile').catch(err => console.error('导航错误:', err));
                              }}
                            >
                              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              个人资料
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(false);
                                handleLogout();
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-indigo-400 dropdown-menu-item"
                            >
                              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              退出
                            </button>
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
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
                <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M536.380952 146.285714h146.285715l341.333333 292.571429-195.047619 292.571428-474.453333-79.091809L292.571429 1024H146.285714l24.380953-146.285714h-146.285715l8.143238-48.761905h146.285715L195.047619 731.428571H48.761905l8.143238-48.761904h146.285714l16.237714-97.52381h-146.285714l8.143238-48.761905h146.285715L243.809524 438.857143H97.52381l8.143238-48.761905h146.285714L268.190476 292.571429h-146.285714l8.143238-48.761905h146.285714L292.571429 146.285714h97.523809l146.285714-146.285714v146.285714z m-165.790476 409.892572l412.184381 68.705524 112.152381-168.228572L646.582857 243.809524H422.619429l-52.077715 312.368762zM585.142857 390.095238c-26.916571 0-48.761905-17.749333-48.761905-44.665905s-3.023238-44.665905 23.893334-44.665904c26.965333 0 98.011429 36.08381 98.011428 63.000381S612.059429 390.095238 585.142857 390.095238z" fill="#6366f1"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 