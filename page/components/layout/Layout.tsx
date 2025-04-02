import React, { useEffect, useState, CSSProperties } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

// 定义常用样式
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #18181b, #27272a, #18181b)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection']
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom right, #18181b, #27272a, #18181b)'
  },
  loadingSpinner: {
    height: '3rem',
    width: '3rem',
    borderRadius: '9999px',
    borderTop: '2px solid #a855f7',
    borderBottom: '2px solid #a855f7',
    marginBottom: '1rem',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#a1a1aa',
    marginLeft: '0.75rem'
  },
  nav: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    borderBottom: '1px solid #3f3f46'
  },
  navInner: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem',
    '@media (min-width: 640px)': {
      padding: '0 1.5rem'
    },
    '@media (min-width: 1024px)': {
      padding: '0 2rem'
    }
  },
  navFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    height: '4rem'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #c084fc, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  navItemsContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  navItems: {
    display: 'flex',
    gap: '1rem'
  },
  navLink: {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#d4d4d8',
    transition: 'color 0.2s'
  },
  navLinkActive: {
    color: '#c084fc'
  },
  navLinkHover: {
    color: '#d8b4fe'
  },
  mainContent: {
    flexGrow: 1,
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem 1rem',
    '@media (min-width: 640px)': {
      padding: '2rem 1.5rem'
    },
    '@media (min-width: 1024px)': {
      padding: '2rem 2rem'
    }
  },
  footer: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    borderTop: '1px solid #3f3f46',
    padding: '1.5rem 0',
    marginTop: 'auto'
  },
  footerInner: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem',
    '@media (min-width: 640px)': {
      padding: '0 1.5rem'
    },
    '@media (min-width: 1024px)': {
      padding: '0 2rem'
    }
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    alignItems: 'center',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  },
  footerText: {
    marginBottom: '1rem',
    '@media (min-width: 768px)': {
      marginBottom: 0
    }
  },
  footerCopyright: {
    fontSize: '0.875rem',
    color: '#a1a1aa'
  },
  footerLinks: {
    display: 'flex',
    gap: '1.5rem'
  },
  footerLink: {
    color: '#a1a1aa',
    transition: 'color 0.2s'
  },
  footerLinkHover: {
    color: '#c084fc'
  }
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();
  // 添加客户端渲染检测
  const [isClient, setIsClient] = useState(false);
  const [isHovering, setIsHovering] = useState<{[key: string]: boolean}>({});

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

  // 处理导航项悬停
  const handleMouseEnter = (item: string) => {
    setIsHovering(prev => ({ ...prev, [item]: true }));
  };

  const handleMouseLeave = (item: string) => {
    setIsHovering(prev => ({ ...prev, [item]: false }));
  };

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
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>正在载入...</p>
      </div>
    );
  }

  // 已通过所有重定向检查，渲染正常布局
  console.log('Layout: 渲染正常布局内容');
  return (
    <div style={styles.container}>
      {/* 导航栏 - 只在用户登录后显示 */}
      {(!isClient || isAuthenticated) && !isAuthPage && (
        <nav style={styles.nav}>
          <div style={styles.navInner}>
            <div style={styles.navFlex}>
              <div style={styles.logoContainer}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={styles.logoText}>
                    PicHub
                  </span>
                </Link>
              </div>
              <div style={styles.navItemsContainer}>
                <div style={styles.navItems}>
                  <Link
                    href="/"
                    style={{
                      ...styles.navLink,
                      ...(router.pathname === '/' ? styles.navLinkActive : {}),
                      ...(isHovering['home'] ? styles.navLinkHover : {})
                    }}
                    onMouseEnter={() => handleMouseEnter('home')}
                    onMouseLeave={() => handleMouseLeave('home')}
                  >
                    上传
                  </Link>

                  <Link
                    href="/files"
                    style={{
                      ...styles.navLink,
                      ...(router.pathname === '/files' ? styles.navLinkActive : {}),
                      ...(isHovering['files'] ? styles.navLinkHover : {})
                    }}
                    onMouseEnter={() => handleMouseEnter('files')}
                    onMouseLeave={() => handleMouseLeave('files')}
                  >
                    我的文件
                  </Link>
                  
                  {(!isClient || (user && user.role === 'admin')) && (
                    <Link
                      href="/admin"
                      style={{
                        ...styles.navLink,
                        ...(isAdminRoute ? styles.navLinkActive : {}),
                        ...(isHovering['admin'] ? styles.navLinkHover : {})
                      }}
                      onMouseEnter={() => handleMouseEnter('admin')}
                      onMouseLeave={() => handleMouseLeave('admin')}
                    >
                      管理面板
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    style={{
                      ...styles.navLink,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      ...(isHovering['logout'] ? styles.navLinkHover : {})
                    }}
                    onMouseEnter={() => handleMouseEnter('logout')}
                    onMouseLeave={() => handleMouseLeave('logout')}
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
      <main style={styles.mainContent}>
        {children}
      </main>

      {/* 页脚 */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerContent}>
            <div style={styles.footerText}>
              <p style={styles.footerCopyright}>
                &copy; {new Date().getFullYear()} PicHub. 保留所有权利。
              </p>
            </div>
            <div style={styles.footerLinks}>
              <a 
                href="#" 
                style={{
                  ...styles.footerLink,
                  ...(isHovering['github'] ? styles.footerLinkHover : {})
                }}
                onMouseEnter={() => handleMouseEnter('github')}
                onMouseLeave={() => handleMouseLeave('github')}
              >
                <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: '0' }}>Github</span>
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5374"><path d="M536.380952 146.285714h146.285715l341.333333 292.571429-195.047619 292.571428-474.453333-79.091809L292.571429 1024H146.285714l24.380953-146.285714h-146.285715l8.143238-48.761905h146.285715L195.047619 731.428571H48.761905l8.143238-48.761904h146.285714l16.237714-97.52381h-146.285714l8.143238-48.761905h146.285715L243.809524 438.857143H97.52381l8.143238-48.761905h146.285714L268.190476 292.571429h-146.285714l8.143238-48.761905h146.285714L292.571429 146.285714h97.523809l146.285714-146.285714v146.285714z m-165.790476 409.892572l412.184381 68.705524 112.152381-168.228572L646.582857 243.809524H422.619429l-52.077715 312.368762zM585.142857 390.095238c-26.916571 0-48.761905-17.749333-48.761905-44.665905s-3.023238-44.665905 23.893334-44.665904c26.965333 0 98.011429 36.08381 98.011428 63.000381S612.059429 390.095238 585.142857 390.095238z" fill="#6366f1" p-id="5375"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 添加关键帧动画 */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Layout; 